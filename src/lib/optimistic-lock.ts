import { logger } from './logger';

interface LockEntry {
  key: string;
  version: number;
  timestamp: number;
  operation: string;
}

interface OptimisticLockOptions {
  maxRetries?: number;
  retryDelay?: number;
  lockTimeout?: number;
}

class OptimisticLockManager {
  private locks = new Map<string, LockEntry>();
  private readonly defaultOptions: Required<OptimisticLockOptions> = {
    maxRetries: 3,
    retryDelay: 100,
    lockTimeout: 30000 // 30 segundos
  };

  // Limpar locks expirados
  private cleanupExpiredLocks() {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (now - lock.timestamp > this.defaultOptions.lockTimeout) {
        this.locks.delete(key);
        logger.warn('Lock expirado removido', { key, operation: lock.operation });
      }
    }
  }

  // Gerar chave única para o recurso
  private generateLockKey(table: string, id: string, tenantId?: string): string {
    return `${table}:${id}${tenantId ? `:${tenantId}` : ''}`;
  }

  // Obter versão atual do registro
  private async getCurrentVersion(
    supabaseClient: any,
    table: string,
    id: string,
    tenantId?: string
  ): Promise<number> {
    try {
      const query = supabaseClient
        .from(table)
        .select('updated_at')
        .eq('id', id);

      if (tenantId) {
        query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.single();

      if (error) {
        logger.error('Erro ao obter versão do registro', { table, id, tenantId }, error);
        throw error;
      }

      // Usar timestamp como versão
      return new Date(data.updated_at).getTime();
    } catch (error) {
      logger.error('Falha ao obter versão atual', { table, id, tenantId }, error as Error);
      throw error;
    }
  }

  // Executar operação com lock otimista
  async executeWithLock<T>(
    operation: () => Promise<T>,
    lockKey: string,
    operationName: string,
    options: OptimisticLockOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let retryCount = 0;

    this.cleanupExpiredLocks();

    while (retryCount <= opts.maxRetries) {
      try {
        // Verificar se já existe lock
        const existingLock = this.locks.get(lockKey);
        if (existingLock && Date.now() - existingLock.timestamp < opts.lockTimeout) {
          throw new Error(`Recurso bloqueado por operação: ${existingLock.operation}`);
        }

        // Criar novo lock
        const newLock: LockEntry = {
          key: lockKey,
          version: Date.now(),
          timestamp: Date.now(),
          operation: operationName
        };

        this.locks.set(lockKey, newLock);

        try {
          // Executar operação
          const result = await operation();
          
          // Remover lock após sucesso
          this.locks.delete(lockKey);
          
          logger.debug('Operação executada com sucesso', { 
            lockKey, 
            operationName, 
            retryCount 
          });

          return result;
        } catch (operationError) {
          // Remover lock em caso de erro
          this.locks.delete(lockKey);
          throw operationError;
        }

      } catch (error) {
        retryCount++;
        
        if (retryCount > opts.maxRetries) {
          logger.error('Máximo de tentativas excedido', {
            lockKey,
            operationName,
            retryCount,
            maxRetries: opts.maxRetries
          }, error as Error);
          throw error;
        }

        logger.warn('Tentativa falhou, tentando novamente', {
          lockKey,
          operationName,
          retryCount,
          maxRetries: opts.maxRetries
        });

        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay * retryCount));
      }
    }

    throw new Error('Falha inesperada no lock otimista');
  }

  // Executar operação de update com verificação de versão
  async executeUpdateWithVersionCheck<T>(
    supabaseClient: any,
    table: string,
    id: string,
    updateData: Record<string, any>,
    tenantId?: string,
    options: OptimisticLockOptions = {}
  ): Promise<T> {
    const lockKey = this.generateLockKey(table, id, tenantId);
    
    return this.executeWithLock(
      async () => {
        // Obter versão atual
        const currentVersion = await this.getCurrentVersion(supabaseClient, table, id, tenantId);
        
        // Preparar dados de update com nova versão
        const dataWithTimestamp = {
          ...updateData,
          updated_at: new Date().toISOString()
        };

        // Executar update com verificação de versão
        const query = supabaseClient
          .from(table)
          .update(dataWithTimestamp)
          .eq('id', id)
          .eq('updated_at', new Date(currentVersion).toISOString());

        if (tenantId) {
          query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query.select().single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Registro foi modificado por outro usuário. Tente novamente.');
          }
          throw error;
        }

        return data;
      },
      lockKey,
      `update_${table}`,
      options
    );
  }

  // Executar operação de delete com verificação de versão
  async executeDeleteWithVersionCheck(
    supabaseClient: any,
    table: string,
    id: string,
    tenantId?: string,
    options: OptimisticLockOptions = {}
  ): Promise<void> {
    const lockKey = this.generateLockKey(table, id, tenantId);
    
    return this.executeWithLock(
      async () => {
        // Obter versão atual
        const currentVersion = await this.getCurrentVersion(supabaseClient, table, id, tenantId);
        
        // Executar delete com verificação de versão
        const query = supabaseClient
          .from(table)
          .delete()
          .eq('id', id)
          .eq('updated_at', new Date(currentVersion).toISOString());

        if (tenantId) {
          query.eq('tenant_id', tenantId);
        }

        const { error } = await query;

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Registro foi modificado por outro usuário. Tente novamente.');
          }
          throw error;
        }
      },
      lockKey,
      `delete_${table}`,
      options
    );
  }

  // Verificar se recurso está bloqueado
  isLocked(table: string, id: string, tenantId?: string): boolean {
    const lockKey = this.generateLockKey(table, id, tenantId);
    const lock = this.locks.get(lockKey);
    
    if (!lock) return false;
    
    // Verificar se lock não expirou
    if (Date.now() - lock.timestamp > this.defaultOptions.lockTimeout) {
      this.locks.delete(lockKey);
      return false;
    }
    
    return true;
  }

  // Forçar remoção de lock (usar com cuidado)
  forceClearLock(table: string, id: string, tenantId?: string): void {
    const lockKey = this.generateLockKey(table, id, tenantId);
    this.locks.delete(lockKey);
    logger.warn('Lock removido forçadamente', { lockKey });
  }

  // Obter estatísticas dos locks
  getLockStats() {
    this.cleanupExpiredLocks();
    return {
      activeLocks: this.locks.size,
      locks: Array.from(this.locks.values()).map(lock => ({
        key: lock.key,
        operation: lock.operation,
        age: Date.now() - lock.timestamp
      }))
    };
  }

  // Limpar todos os locks
  clearAllLocks(): void {
    this.locks.clear();
    logger.info('Todos os locks foram limpos');
  }
}

// Instância global do gerenciador de locks
export const optimisticLockManager = new OptimisticLockManager();

// Hook para usar locks otimistas em componentes React
export const useOptimisticLock = () => {
  return {
    executeWithLock: optimisticLockManager.executeWithLock.bind(optimisticLockManager),
    executeUpdateWithVersionCheck: optimisticLockManager.executeUpdateWithVersionCheck.bind(optimisticLockManager),
    executeDeleteWithVersionCheck: optimisticLockManager.executeDeleteWithVersionCheck.bind(optimisticLockManager),
    isLocked: optimisticLockManager.isLocked.bind(optimisticLockManager),
    getLockStats: optimisticLockManager.getLockStats.bind(optimisticLockManager)
  };
};
