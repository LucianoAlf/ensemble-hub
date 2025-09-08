import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

interface FKRelationship {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  required?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class FKValidator {
  private relationships: FKRelationship[] = [
    // Relacionamentos principais do sistema
    {
      table: 'banda',
      column: 'tenant_id',
      referencedTable: 'profiles',
      referencedColumn: 'tenant_id',
      required: true
    },
    {
      table: 'evento',
      column: 'tenant_id',
      referencedTable: 'profiles',
      referencedColumn: 'tenant_id',
      required: true
    },
    {
      table: 'evento',
      column: 'banda_id',
      referencedTable: 'banda',
      referencedColumn: 'id',
      required: true,
      onDelete: 'CASCADE'
    },
    {
      table: 'banda_integrante',
      column: 'banda_id',
      referencedTable: 'banda',
      referencedColumn: 'id',
      required: true,
      onDelete: 'CASCADE'
    },
    {
      table: 'banda_integrante',
      column: 'tenant_id',
      referencedTable: 'profiles',
      referencedColumn: 'tenant_id',
      required: true
    },
    {
      table: 'transactions',
      column: 'tenant_id',
      referencedTable: 'profiles',
      referencedColumn: 'tenant_id',
      required: true
    },
    {
      table: 'transactions',
      column: 'banda_id',
      referencedTable: 'banda',
      referencedColumn: 'id',
      required: false
    },
    {
      table: 'transactions',
      column: 'evento_id',
      referencedTable: 'evento',
      referencedColumn: 'id',
      required: false
    },
    {
      table: 'payouts',
      column: 'tenant_id',
      referencedTable: 'profiles',
      referencedColumn: 'tenant_id',
      required: true
    }
  ];

  // Validar se um valor de FK existe na tabela referenciada
  async validateFKExists(
    table: string,
    column: string,
    value: any,
    tenantId?: string
  ): Promise<boolean> {
    if (!value) return true; // Null/undefined é válido para FKs opcionais

    const relationship = this.relationships.find(
      rel => rel.table === table && rel.column === column
    );

    if (!relationship) {
      logger.warn('Relacionamento FK não encontrado', { table, column });
      return true; // Se não está mapeado, assumir válido
    }

    try {
      let query = supabase
        .from(relationship.referencedTable as any)
        .select(relationship.referencedColumn)
        .eq(relationship.referencedColumn, value);

      // Adicionar filtro de tenant se necessário
      if (tenantId && relationship.referencedTable !== 'profiles') {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Registro não encontrado
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error('Erro ao validar FK', {
        table,
        column,
        value,
        referencedTable: relationship.referencedTable
      }, error as Error);
      return false;
    }
  }

  // Validar todos os FKs de um registro
  async validateRecord(
    table: string,
    record: Record<string, any>,
    tenantId?: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const tableRelationships = this.relationships.filter(rel => rel.table === table);

    for (const relationship of tableRelationships) {
      const value = record[relationship.column];

      // Verificar se campo obrigatório está presente
      if (relationship.required && !value) {
        result.isValid = false;
        result.errors.push(
          `Campo obrigatório '${relationship.column}' não pode ser nulo`
        );
        continue;
      }

      // Validar FK se valor presente
      if (value) {
        const isValid = await this.validateFKExists(
          table,
          relationship.column,
          value,
          tenantId
        );

        if (!isValid) {
          result.isValid = false;
          result.errors.push(
            `Referência inválida: ${relationship.column}='${value}' não existe em ${relationship.referencedTable}`
          );
        }
      }
    }

    return result;
  }

  // Validar integridade antes de inserção
  async validateBeforeInsert(
    table: string,
    record: Record<string, any>,
    tenantId?: string
  ): Promise<ValidationResult> {
    logger.debug('Validando registro antes da inserção', { table, tenantId });
    return this.validateRecord(table, record, tenantId);
  }

  // Validar integridade antes de atualização
  async validateBeforeUpdate(
    table: string,
    id: string,
    updates: Record<string, any>,
    tenantId?: string
  ): Promise<ValidationResult> {
    logger.debug('Validando registro antes da atualização', { table, id, tenantId });
    
    // Obter registro atual
    try {
      let query = supabase
        .from(table as any)
        .select('*')
        .eq('id', id);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: currentRecord, error } = await query.single();

      if (error) {
        return {
          isValid: false,
          errors: [`Registro não encontrado: ${table}/${id}`],
          warnings: []
        };
      }

      // Mesclar dados atuais com updates
      const mergedRecord = Object.assign({}, currentRecord || {}, updates);
      return this.validateRecord(table, mergedRecord, tenantId);
    } catch (error) {
      logger.error('Erro ao validar antes da atualização', {
        table,
        id,
        tenantId
      }, error as Error);

      return {
        isValid: false,
        errors: ['Erro interno ao validar registro'],
        warnings: []
      };
    }
  }

  // Verificar registros órfãos
  async findOrphanedRecords(
    table: string,
    tenantId?: string
  ): Promise<{ column: string; orphanedIds: string[] }[]> {
    const orphanedResults: { column: string; orphanedIds: string[] }[] = [];
    const tableRelationships = this.relationships.filter(rel => rel.table === table);

    for (const relationship of tableRelationships) {
      try {
        // Buscar todos os registros da tabela
        let query = supabase
          .from(table as any)
          .select(`id, ${relationship.column}`);

        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        const { data: records, error } = await query;

        if (error) {
          logger.error('Erro ao buscar registros para verificação de órfãos', {
            table,
            column: relationship.column
          }, error);
          continue;
        }

        const orphanedIds: string[] = [];

        for (const record of records || []) {
          const fkValue = record[relationship.column];
          
          if (fkValue) {
            const exists = await this.validateFKExists(
              table,
              relationship.column,
              fkValue,
              tenantId
            );

            if (!exists) {
              orphanedIds.push((record as any).id);
            }
          }
        }

        if (orphanedIds.length > 0) {
          orphanedResults.push({
            column: relationship.column,
            orphanedIds
          });
        }
      } catch (error) {
        logger.error('Erro ao verificar registros órfãos', {
          table,
          column: relationship.column
        }, error as Error);
      }
    }

    return orphanedResults;
  }

  // Executar validação completa de integridade
  async runIntegrityCheck(tenantId?: string): Promise<{
    isValid: boolean;
    issues: Array<{
      table: string;
      type: 'orphaned' | 'missing_required';
      details: any;
    }>;
  }> {
    const issues: Array<{
      table: string;
      type: 'orphaned' | 'missing_required';
      details: any;
    }> = [];

    const tables = [...new Set(this.relationships.map(rel => rel.table))];

    for (const table of tables) {
      try {
        // Verificar registros órfãos
        const orphanedResults = await this.findOrphanedRecords(table, tenantId);
        
        for (const orphaned of orphanedResults) {
          if (orphaned.orphanedIds.length > 0) {
            issues.push({
              table,
              type: 'orphaned',
              details: {
                column: orphaned.column,
                count: orphaned.orphanedIds.length,
                ids: orphaned.orphanedIds.slice(0, 10) // Limitar para não sobrecarregar
              }
            });
          }
        }

        // Verificar campos obrigatórios
        const requiredRelationships = this.relationships.filter(
          rel => rel.table === table && rel.required
        );

        for (const relationship of requiredRelationships) {
          let query = supabase
            .from(table as any)
            .select('id')
            .is(relationship.column, null);

          if (tenantId) {
            query = query.eq('tenant_id', tenantId);
          }

          const { data: nullRecords, error } = await query;

          if (!error && nullRecords && nullRecords.length > 0) {
            issues.push({
              table,
              type: 'missing_required',
              details: {
                column: relationship.column,
                count: nullRecords.length,
                ids: nullRecords.map((r: any) => r.id).slice(0, 10)
              }
            });
          }
        }
      } catch (error) {
        logger.error('Erro durante verificação de integridade', {
          table,
          tenantId
        }, error as Error);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Obter estatísticas de relacionamentos
  getRelationshipStats() {
    const stats = {
      totalRelationships: this.relationships.length,
      byTable: {} as Record<string, number>,
      requiredCount: 0,
      cascadeCount: 0
    };

    for (const rel of this.relationships) {
      stats.byTable[rel.table] = (stats.byTable[rel.table] || 0) + 1;
      
      if (rel.required) stats.requiredCount++;
      if (rel.onDelete === 'CASCADE') stats.cascadeCount++;
    }

    return stats;
  }
}

// Instância global do validador
export const fkValidator = new FKValidator();

// Hook para usar validação FK em componentes React
export const useFKValidator = () => {
  return {
    validateRecord: fkValidator.validateRecord.bind(fkValidator),
    validateBeforeInsert: fkValidator.validateBeforeInsert.bind(fkValidator),
    validateBeforeUpdate: fkValidator.validateBeforeUpdate.bind(fkValidator),
    findOrphanedRecords: fkValidator.findOrphanedRecords.bind(fkValidator),
    runIntegrityCheck: fkValidator.runIntegrityCheck.bind(fkValidator),
    getStats: fkValidator.getRelationshipStats.bind(fkValidator)
  };
};
