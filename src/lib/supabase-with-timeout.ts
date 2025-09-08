import { supabase } from '@/integrations/supabase/client';

// Timeout global de 30 segundos
const GLOBAL_TIMEOUT = 30000;

// Função para adicionar timeout a uma Promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = GLOBAL_TIMEOUT): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operação expirou após ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// Wrapper simples para adicionar timeout às operações críticas
export const executeWithTimeout = <T>(operation: () => Promise<T>, timeout?: number): Promise<T> => {
  return withTimeout(operation(), timeout);
};

// Funções utilitárias para operações comuns com timeout
export const supabaseOperations = {
  // Select com timeout
  select: async (table: string, columns: string = '*', filters?: Record<string, any>) => {
    return executeWithTimeout(async () => {
      let query = supabase.from(table as any).select(columns);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      return query;
    });
  },

  // Insert com timeout
  insert: async (table: string, data: any) => {
    return executeWithTimeout(async () => {
      return supabase.from(table as any).insert(data).select();
    });
  },

  // Update com timeout
  update: async (table: string, id: string, data: any, tenantId?: string) => {
    return executeWithTimeout(async () => {
      let query = supabase.from(table as any).update(data).eq('id', id);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      return query.select();
    });
  },

  // Delete com timeout
  delete: async (table: string, id: string, tenantId?: string) => {
    return executeWithTimeout(async () => {
      let query = supabase.from(table as any).delete().eq('id', id);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      return query;
    });
  },

  // RPC com timeout
  rpc: async (functionName: string, params?: any) => {
    return executeWithTimeout(async () => {
      return supabase.rpc(functionName as any, params);
    });
  }
};

// Manter compatibilidade - exportar o cliente original também
export { supabase };
