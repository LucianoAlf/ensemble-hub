import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
  lastAccessed: number;
}

interface QueryOptions {
  cache?: {
    enabled: boolean;
    ttlMs: number;
    key: string;
  };
  enableAbortSignal?: boolean;
  retries?: number;
  retryDelay?: number;
}

interface QueryContext {
  client: typeof supabase;
  signal?: AbortSignal;
}

interface SupabaseResult<T> {
  data: T | null;
  error: Error | null;
}

// Enhanced cache implementation with cleanup
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

const cacheManager = new CacheManager();

export function useSupabaseOptimized() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const query = useCallback(
    async <T>(
      queryFn: (context: QueryContext) => Promise<SupabaseResult<T>>,
      options?: QueryOptions
    ): Promise<SupabaseResult<T>> => {
      const cacheKey = options?.cache?.key;
      const retries = options?.retries ?? 0;
      const retryDelay = options?.retryDelay ?? 1000;
      
      // Check cache first
      if (cacheKey && options?.cache?.enabled) {
        const cached = cacheManager.get<T>(cacheKey);
        if (cached !== null) {
          return { data: cached, error: null };
        }
      }

      // Setup abort signal if enabled
      let abortController: AbortController | undefined;
      if (options?.enableAbortSignal) {
        abortController = new AbortController();
        abortControllerRef.current = abortController;
      }

      const executeQuery = async (attempt: number): Promise<SupabaseResult<T>> => {
        try {
          const context: QueryContext = {
            client: supabase,
            signal: abortController?.signal,
          };
          
          const result = await queryFn(context);
          
          // Store in cache if enabled and successful
          if (cacheKey && options?.cache?.enabled && result.data && !result.error) {
            cacheManager.set(cacheKey, result.data, options.cache.ttlMs || 60000);
          }

          return result;
        } catch (error) {
          // Handle abort signal
          if (error instanceof Error && error.name === 'AbortError') {
            return { data: null, error: new Error('Query was aborted') };
          }
          
          // Retry logic
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
            return executeQuery(attempt + 1);
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Supabase query error:', error);
          return { data: null, error: new Error(errorMessage) };
        }
      };

      return executeQuery(0);
    },
    []
  );

  const mutate = useCallback(
    async <T>(
      mutateFn: (context: QueryContext) => Promise<SupabaseResult<T>>,
      options?: { invalidateCache?: string[] | string }
    ): Promise<SupabaseResult<T>> => {
      try {
        const result = await mutateFn({ client: supabase });
        
        // Invalidate cache entries after successful mutation
        if (result.data && !result.error && options?.invalidateCache) {
          const patterns = Array.isArray(options.invalidateCache) 
            ? options.invalidateCache 
            : [options.invalidateCache];
          
          patterns.forEach(pattern => cacheManager.invalidate(pattern));
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown mutation error';
        console.error('Supabase mutation error:', error);
        return { data: null, error: new Error(errorMessage) };
      }
    },
    []
  );

  const abortQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearCache = useCallback((pattern?: string) => {
    cacheManager.invalidate(pattern);
  }, []);

  return { 
    query, 
    mutate, 
    abortQuery, 
    clearCache, 
    client: supabase 
  };
}