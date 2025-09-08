/**
 * Sistema de fallbacks para operações críticas
 * Garante que a aplicação continue funcionando mesmo com falhas parciais
 */

import { logger } from './logger';

export interface FallbackConfig<T> {
  primary: () => Promise<T>;
  fallbacks: Array<() => Promise<T>>;
  defaultValue?: T;
  timeout?: number;
  retryAttempts?: number;
  onFallback?: (fallbackIndex: number, error: any) => void;
  onAllFailed?: (errors: any[]) => void;
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  usedFallback: boolean;
  fallbackIndex?: number;
  errors: any[];
  totalTime: number;
}

/**
 * Executa operação com fallbacks em cascata
 */
export async function withFallbacks<T>(config: FallbackConfig<T>): Promise<FallbackResult<T>> {
  const startTime = Date.now();
  const errors: any[] = [];
  const operations = [config.primary, ...config.fallbacks];
  
  for (let i = 0; i < operations.length; i++) {
    try {
      logger.debug('Tentando operação', {
        context: 'fallback_manager',
        attempt: i + 1,
        total: operations.length,
        isPrimary: i === 0
      });

      const operation = operations[i];
      let result: T;

      if (config.timeout) {
        result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), config.timeout)
          )
        ]);
      } else {
        result = await operation();
      }

      const totalTime = Date.now() - startTime;
      
      if (i > 0) {
        logger.info('Fallback bem-sucedido', {
          context: 'fallback_manager',
          fallbackIndex: i - 1,
          totalTime,
          previousErrors: errors.length
        });
        
        if (config.onFallback) {
          config.onFallback(i - 1, errors[errors.length - 1]);
        }
      }

      return {
        success: true,
        data: result,
        usedFallback: i > 0,
        fallbackIndex: i > 0 ? i - 1 : undefined,
        errors,
        totalTime
      };

    } catch (error) {
      errors.push(error);
      
      logger.warn('Operação falhou', {
        context: 'fallback_manager',
        attempt: i + 1,
        total: operations.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        isPrimary: i === 0
      });

      // Se não é a última tentativa, continuar para o próximo fallback
      if (i < operations.length - 1) {
        continue;
      }
    }
  }

  // Todas as operações falharam
  const totalTime = Date.now() - startTime;
  
  logger.error('Todas as operações falharam', {
    context: 'fallback_manager',
    totalAttempts: operations.length,
    totalTime,
    errors: errors.map(e => e instanceof Error ? e.message : String(e))
  });

  if (config.onAllFailed) {
    config.onAllFailed(errors);
  }

  // Retornar valor padrão se disponível
  if (config.defaultValue !== undefined) {
    return {
      success: true,
      data: config.defaultValue,
      usedFallback: true,
      fallbackIndex: -1, // Indica uso do valor padrão
      errors,
      totalTime
    };
  }

  return {
    success: false,
    usedFallback: false,
    errors,
    totalTime
  };
}

/**
 * Fallbacks específicos para operações comuns
 */
export const FALLBACK_STRATEGIES = {
  // Dados financeiros
  financialData: {
    async primary() {
      // Buscar dados do Supabase
      throw new Error('Implementar busca principal');
    },
    async cache() {
      // Buscar do cache local
      const cached = localStorage.getItem('financial_data_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 5 * 60 * 1000) { // 5 minutos
          return data.value;
        }
      }
      throw new Error('Cache não disponível ou expirado');
    },
    async mockData() {
      // Dados mock para desenvolvimento/fallback
      return {
        transactions: [],
        balance: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Autenticação
  authentication: {
    async googleOAuth() {
      throw new Error('Implementar Google OAuth');
    },
    async localAuth() {
      // Fallback para autenticação local
      const stored = localStorage.getItem('local_session');
      if (stored) {
        return JSON.parse(stored);
      }
      throw new Error('Sessão local não encontrada');
    },
    async guestMode() {
      // Modo convidado com funcionalidades limitadas
      return {
        user: { id: 'guest', name: 'Convidado', email: null },
        session: { access_token: null, expires_at: null },
        isGuest: true
      };
    }
  },

  // Upload de arquivos
  fileUpload: {
    async supabaseStorage() {
      throw new Error('Implementar upload Supabase');
    },
    async localStorage() {
      // Salvar localmente como fallback
      throw new Error('Upload local não implementado');
    },
    async skipUpload() {
      // Pular upload e continuar sem arquivo
      return { url: null, skipped: true };
    }
  }
};

/**
 * Hook React para usar fallbacks
 */
export function useFallbacks() {
  const executeWithFallbacks = async <T>(
    config: FallbackConfig<T>
  ): Promise<FallbackResult<T>> => {
    return withFallbacks(config);
  };

  return { executeWithFallbacks };
}

/**
 * Fallback manager para operações críticas do sistema
 */
export class CriticalOperationManager {
  private static instance: CriticalOperationManager;
  private fallbackHistory: Map<string, FallbackResult<any>[]> = new Map();

  static getInstance(): CriticalOperationManager {
    if (!CriticalOperationManager.instance) {
      CriticalOperationManager.instance = new CriticalOperationManager();
    }
    return CriticalOperationManager.instance;
  }

  async executeOperation<T>(
    operationId: string,
    config: FallbackConfig<T>
  ): Promise<FallbackResult<T>> {
    const result = await withFallbacks({
      ...config,
      onFallback: (fallbackIndex, error) => {
        logger.warn('Fallback ativado para operação crítica', {
          context: 'critical_operation',
          operationId,
          fallbackIndex,
          error: error instanceof Error ? error.message : String(error)
        });
        config.onFallback?.(fallbackIndex, error);
      },
      onAllFailed: (errors) => {
        logger.error('Operação crítica falhou completamente', {
          context: 'critical_operation',
          operationId,
          errorCount: errors.length
        });
        config.onAllFailed?.(errors);
      }
    });

    // Armazenar histórico
    if (!this.fallbackHistory.has(operationId)) {
      this.fallbackHistory.set(operationId, []);
    }
    this.fallbackHistory.get(operationId)!.push(result);

    // Manter apenas os últimos 10 resultados
    const history = this.fallbackHistory.get(operationId)!;
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    return result;
  }

  getOperationHistory(operationId: string): FallbackResult<any>[] {
    return this.fallbackHistory.get(operationId) || [];
  }

  getOperationStats(operationId: string) {
    const history = this.getOperationHistory(operationId);
    if (history.length === 0) return null;

    const successful = history.filter(r => r.success).length;
    const withFallback = history.filter(r => r.usedFallback).length;
    const avgTime = history.reduce((sum, r) => sum + r.totalTime, 0) / history.length;

    return {
      totalOperations: history.length,
      successRate: (successful / history.length) * 100,
      fallbackRate: (withFallback / history.length) * 100,
      averageTime: avgTime,
      lastOperation: history[history.length - 1]
    };
  }
}

/**
 * Decorador para adicionar fallbacks a funções
 */
export function withFallbackDecorator<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallbacks: Array<(...args: Parameters<T>) => Promise<ReturnType<T>>>,
  defaultValue?: Awaited<ReturnType<T>>
): T {
  return (async (...args: Parameters<T>) => {
    const result = await withFallbacks({
      primary: () => fn(...args),
      fallbacks: fallbacks.map(fallback => () => fallback(...args)),
      defaultValue
    });

    if (result.success) {
      return result.data;
    } else {
      throw new Error('All operations failed');
    }
  }) as T;
}

/**
 * Utilitários para fallbacks específicos
 */
export const FallbackUtils = {
  // Criar fallback de cache
  createCacheStrategy<T>(
    cacheKey: string,
    maxAge: number = 5 * 60 * 1000 // 5 minutos
  ) {
    return async (): Promise<T> => {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) throw new Error('Cache miss');

      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > maxAge) {
        throw new Error('Cache expired');
      }

      return data.value;
    };
  },

  // Salvar no cache
  saveToCache<T>(cacheKey: string, data: T): void {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        value: data,
        timestamp: Date.now()
      }));
    } catch (error) {
      logger.warn('Falha ao salvar cache', {
        context: 'fallback_utils',
        cacheKey,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  // Criar fallback de valor padrão
  createDefaultStrategy<T>(defaultValue: T) {
    return async (): Promise<T> => {
      return defaultValue;
    };
  },

  // Criar fallback que aguarda e tenta novamente
  createRetryStrategy<T>(
    operation: () => Promise<T>,
    delay: number = 1000,
    maxRetries: number = 3
  ) {
    return async (): Promise<T> => {
      let lastError: any;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, delay * i));
          }
          return await operation();
        } catch (error) {
          lastError = error;
        }
      }
      
      throw lastError;
    };
  }
};

export default withFallbacks;
