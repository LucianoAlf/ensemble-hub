import { logger } from './logger';

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
}

class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutos
    
    const cleanupIntervalTime = options.cleanupInterval || 2 * 60 * 1000; // 2 minutos
    this.startCleanupInterval(cleanupIntervalTime);
  }

  // Iniciar limpeza automática
  private startCleanupInterval(interval: number) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  // Atualizar ordem de acesso
  private updateAccessOrder(key: string) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  // Verificar se entrada expirou
  private isExpired(entry: CacheEntry<T>): boolean {
    const ttl = entry.ttl || this.defaultTTL;
    return Date.now() - entry.timestamp > ttl;
  }

  // Remover entrada menos recentemente usada
  private evictLRU() {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    
    logger.debug('Entrada LRU removida do cache', { key: lruKey });
  }

  // Garantir que o cache não exceda o tamanho máximo
  private enforceMaxSize() {
    while (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
  }

  // Definir valor no cache
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();

    // Se a chave já existe, atualizar
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      existing.value = value;
      existing.timestamp = now;
      existing.lastAccessed = now;
      existing.accessCount++;
      existing.ttl = ttl;
      this.updateAccessOrder(key);
      return;
    }

    // Garantir espaço para nova entrada
    this.enforceMaxSize();

    // Criar nova entrada
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    logger.debug('Nova entrada adicionada ao cache', { 
      key, 
      cacheSize: this.cache.size,
      maxSize: this.maxSize 
    });
  }

  // Obter valor do cache
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Verificar se expirou
    if (this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }

    // Atualizar estatísticas de acesso
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.updateAccessOrder(key);

    return entry.value;
  }

  // Verificar se chave existe
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // Remover entrada do cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      
      logger.debug('Entrada removida do cache', { key });
    }

    return deleted;
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    if (expiredKeys.length > 0) {
      expiredKeys.forEach(key => this.delete(key));
      
      logger.debug('Limpeza de cache executada', { 
        expiredCount: expiredKeys.length,
        remainingSize: this.cache.size 
      });
    }
  }

  // Limpar todo o cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    
    logger.info('Cache completamente limpo', { previousSize: size });
  }

  // Invalidar entradas por padrão de chave
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));

    logger.debug('Invalidação por padrão executada', { 
      pattern: pattern.toString(),
      invalidatedCount: keysToDelete.length 
    });

    return keysToDelete.length;
  }

  // Obter estatísticas do cache
  getStats() {
    const now = Date.now();
    let totalAccesses = 0;
    let expiredCount = 0;
    const ageDistribution = { '0-1min': 0, '1-5min': 0, '5-15min': 0, '15min+': 0 };

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      
      if (this.isExpired(entry)) {
        expiredCount++;
      }

      const age = now - entry.timestamp;
      if (age < 60000) ageDistribution['0-1min']++;
      else if (age < 300000) ageDistribution['1-5min']++;
      else if (age < 900000) ageDistribution['5-15min']++;
      else ageDistribution['15min+']++;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize) * 100,
      totalAccesses,
      expiredCount,
      ageDistribution,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimar uso de memória (aproximado)
  private estimateMemoryUsage(): string {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 64; // overhead da entrada
    }

    if (totalSize < 1024) return `${totalSize} bytes`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Obter entradas mais acessadas
  getMostAccessed(limit: number = 10) {
    return Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, limit)
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        age: Date.now() - entry.timestamp
      }));
  }

  // Destruir cache
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
  }
}

// Cache global para dados da aplicação
export const appCache = new LRUCache({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  cleanupInterval: 2 * 60 * 1000 // 2 minutos
});

// Cache específico para dados financeiros (TTL menor devido à criticidade)
export const financialCache = new LRUCache({
  maxSize: 50,
  defaultTTL: 2 * 60 * 1000, // 2 minutos
  cleanupInterval: 1 * 60 * 1000 // 1 minuto
});

// Cache para dados de usuário (TTL maior)
export const userCache = new LRUCache({
  maxSize: 100,
  defaultTTL: 10 * 60 * 1000, // 10 minutos
  cleanupInterval: 5 * 60 * 1000 // 5 minutos
});

// Função utilitária para gerar chaves de cache consistentes
export const generateCacheKey = (
  table: string,
  operation: string,
  params: Record<string, any> = {}
): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${table}:${operation}${sortedParams ? `:${sortedParams}` : ''}`;
};

// Hook para usar cache em componentes React
export const useCache = (cacheInstance: LRUCache = appCache) => {
  return {
    get: cacheInstance.get.bind(cacheInstance),
    set: cacheInstance.set.bind(cacheInstance),
    has: cacheInstance.has.bind(cacheInstance),
    delete: cacheInstance.delete.bind(cacheInstance),
    invalidatePattern: cacheInstance.invalidatePattern.bind(cacheInstance),
    getStats: cacheInstance.getStats.bind(cacheInstance),
    generateKey: generateCacheKey
  };
};
