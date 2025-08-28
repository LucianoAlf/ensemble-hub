import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface QueryOptions {
  cache?: {
    enabled: boolean;
    ttlMs: number;
    key: string;
  };
  enableAbortSignal?: boolean;
}

interface QueryContext {
  client: typeof supabase;
}

interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

// Simple cache implementation
const cache = new Map<string, CacheEntry>();

export function useSupabaseOptimized() {
  const query = useCallback(
    async <T>(
      queryFn: (context: QueryContext) => Promise<QueryResult<T>>,
      options?: QueryOptions
    ): Promise<QueryResult<T>> => {
      const cacheKey = options?.cache?.key;
      
      // Check cache first
      if (cacheKey && options?.cache?.enabled) {
        const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
        if (cached && Date.now() < cached.expires) {
          return { data: cached.data, error: null };
        }
      }

      try {
        const result = await queryFn({ client: supabase });
        
        // Store in cache if enabled
        if (cacheKey && options?.cache?.enabled && !result.error) {
          cache.set(cacheKey, {
            data: result.data,
            expires: Date.now() + (options.cache.ttlMs || 60000),
          });
        }

        return result;
      } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    []
  );

  const mutate = useCallback(
    async <T>(
      mutateFn: (context: QueryContext) => Promise<QueryResult<T>>
    ): Promise<QueryResult<T>> => {
      try {
        return await mutateFn({ client: supabase });
      } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    []
  );

  return { query, mutate, supabase };
}