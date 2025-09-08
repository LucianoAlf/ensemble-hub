/**
 * Sistema de Rate Limiting Client-Side
 * Controla frequência de requests para prevenir spam e melhorar performance
 */

import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context?: any) => string;
  onLimitReached?: (key: string, retryAfter: number) => void;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class RateLimiter {
  private records = new Map<string, RequestRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup de registros expirados a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, record] of this.records.entries()) {
      if (record.resetTime < now) {
        this.records.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', {
        context: 'rate_limiter',
        recordsCleaned: cleaned,
        remainingRecords: this.records.size
      });
    }
  }

  check(key: string, config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    let record = this.records.get(key);

    // Criar novo registro se não existir ou se janela expirou
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
        lastRequest: now
      };
      this.records.set(key, record);
    }

    // Verificar se limite foi atingido
    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      logger.warn('Rate limit atingido', {
        context: 'rate_limiter',
        key,
        count: record.count,
        maxRequests: config.maxRequests,
        retryAfter
      });

      // Callback quando limite é atingido
      if (config.onLimitReached) {
        config.onLimitReached(key, retryAfter);
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter
      };
    }

    // Incrementar contador
    record.count++;
    record.lastRequest = now;

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  reset(key: string) {
    this.records.delete(key);
    logger.debug('Rate limit resetado', { context: 'rate_limiter', key });
  }

  getStatus(key: string) {
    const record = this.records.get(key);
    if (!record) {
      return null;
    }

    const now = Date.now();
    return {
      count: record.count,
      resetTime: record.resetTime,
      isExpired: record.resetTime < now,
      lastRequest: record.lastRequest
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }
}

// Instância global do rate limiter
const globalRateLimiter = new RateLimiter();

/**
 * Configurações pré-definidas para diferentes tipos de operações
 */
export const RATE_LIMIT_CONFIGS = {
  // API calls gerais
  api: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minuto
    keyGenerator: (endpoint?: string) => `api:${endpoint || 'general'}`
  },
  
  // Autenticação
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    keyGenerator: (action?: string) => `auth:${action || 'general'}`
  },
  
  // Upload de arquivos
  upload: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutos
    keyGenerator: () => 'upload:files'
  },
  
  // Busca/pesquisa
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minuto
    keyGenerator: (query?: string) => `search:${query ? 'query' : 'general'}`
  },
  
  // Google Maps API
  maps: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minuto
    keyGenerator: (operation?: string) => `maps:${operation || 'general'}`
  },
  
  // Operações financeiras
  financial: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minuto
    keyGenerator: (operation?: string) => `financial:${operation || 'general'}`
  }
} as const;

/**
 * Hook para usar rate limiting em componentes React
 */
export function useRateLimit(
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  context?: any
) {
  const config = RATE_LIMIT_CONFIGS[configName];
  
  const checkLimit = (customContext?: any) => {
    const key = config.keyGenerator(customContext || context);
    return globalRateLimiter.check(key, config);
  };

  const resetLimit = (customContext?: any) => {
    const key = config.keyGenerator(customContext || context);
    globalRateLimiter.reset(key);
  };

  const getStatus = (customContext?: any) => {
    const key = config.keyGenerator(customContext || context);
    return globalRateLimiter.getStatus(key);
  };

  return { checkLimit, resetLimit, getStatus };
}

/**
 * Decorator para aplicar rate limiting em funções
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  keyGenerator?: (args: Parameters<T>) => string
): T {
  const config = RATE_LIMIT_CONFIGS[configName];
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(args) : config.keyGenerator();
    const result = globalRateLimiter.check(key, config);
    
    if (!result.allowed) {
      const error = new Error(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
      (error as any).isRateLimit = true;
      (error as any).retryAfter = result.retryAfter;
      throw error;
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Middleware para requests HTTP com rate limiting
 */
export async function rateLimitedFetch(
  url: string,
  options: RequestInit = {},
  configName: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): Promise<Response> {
  const config = RATE_LIMIT_CONFIGS[configName];
  const key = config.keyGenerator(url);
  
  const result = globalRateLimiter.check(key, {
    ...config,
    onLimitReached: (key, retryAfter) => {
      logger.warn('Request bloqueado por rate limit', {
        context: 'rate_limited_fetch',
        url,
        key,
        retryAfter
      });
    }
  });
  
  if (!result.allowed) {
    const error = new Error(`Rate limit exceeded for ${url}. Try again in ${result.retryAfter} seconds.`);
    (error as any).isRateLimit = true;
    (error as any).retryAfter = result.retryAfter;
    throw error;
  }
  
  // Adicionar headers de rate limit na resposta
  const response = await fetch(url, options);
  
  // Headers informativos (não padrão, mas úteis para debugging)
  Object.defineProperty(response, 'rateLimitRemaining', {
    value: result.remaining,
    writable: false
  });
  
  Object.defineProperty(response, 'rateLimitReset', {
    value: new Date(result.resetTime),
    writable: false
  });
  
  return response;
}

/**
 * Utilitário para criar rate limiters customizados
 */
export function createRateLimiter(config: RateLimitConfig) {
  return new RateLimiter();
}

/**
 * Rate limiter específico para componentes que fazem muitas chamadas
 */
export class ComponentRateLimiter {
  private limiter = new RateLimiter();
  private componentId: string;
  
  constructor(componentId: string) {
    this.componentId = componentId;
  }
  
  async throttle<T>(
    operation: () => Promise<T>,
    config: Partial<RateLimitConfig> = {}
  ): Promise<T> {
    const fullConfig: RateLimitConfig = {
      maxRequests: 10,
      windowMs: 1000,
      ...config
    };
    
    const result = this.limiter.check(this.componentId, fullConfig);
    
    if (!result.allowed) {
      // Aguardar antes de tentar novamente
      const waitTime = Math.min(result.retryAfter! * 1000, 5000); // Max 5s
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Tentar novamente após aguardar
      return this.throttle(operation, config);
    }
    
    return operation();
  }
  
  destroy() {
    this.limiter.destroy();
  }
}

export { globalRateLimiter };
export default RateLimiter;
