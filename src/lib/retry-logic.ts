/**
 * Sistema avançado de retry logic com timeout e backoff exponencial
 * Melhora a resiliência da aplicação contra falhas temporárias
 */

import { logger } from './logger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onTimeout?: (timeoutMs: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Configurações pré-definidas para diferentes tipos de operações
 */
export const RETRY_CONFIGS = {
  // Operações de rede padrão
  network: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: any) => {
      // Retry para erros de rede, timeout, e códigos 5xx
      return (
        error?.name === 'NetworkError' ||
        error?.name === 'TimeoutError' ||
        error?.code === 'NETWORK_ERROR' ||
        (error?.status >= 500 && error?.status < 600) ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network')
      );
    }
  },

  // Operações críticas (auth, pagamentos)
  critical: {
    maxAttempts: 5,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    timeoutMs: 60000,
    backoffMultiplier: 1.5,
    jitter: true,
    retryCondition: (error: any) => {
      // Mais conservador - só retry para erros claramente temporários
      return (
        error?.name === 'TimeoutError' ||
        error?.status === 503 || // Service Unavailable
        error?.status === 502 || // Bad Gateway
        error?.status === 504    // Gateway Timeout
      );
    }
  },

  // Operações rápidas (validação, cache)
  fast: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    timeoutMs: 10000,
    backoffMultiplier: 2,
    jitter: false,
    retryCondition: (error: any) => {
      return error?.name === 'TimeoutError' || error?.status >= 500;
    }
  },

  // Upload de arquivos
  upload: {
    maxAttempts: 4,
    baseDelayMs: 3000,
    maxDelayMs: 20000,
    timeoutMs: 120000, // 2 minutos
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: any) => {
      // Não retry para erros de validação (4xx), só para problemas de rede
      return (
        error?.name === 'NetworkError' ||
        error?.name === 'TimeoutError' ||
        error?.status >= 500
      );
    }
  }
} as const;

/**
 * Adiciona jitter aleatório ao delay para evitar thundering herd
 */
function addJitter(delay: number, jitter: boolean): number {
  if (!jitter) return delay;
  
  // Adiciona ±25% de variação aleatória
  const variation = delay * 0.25;
  return delay + (Math.random() * 2 - 1) * variation;
}

/**
 * Calcula o delay para o próximo retry com backoff exponencial
 */
function calculateDelay(
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  multiplier: number,
  jitter: boolean
): number {
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  return Math.round(addJitter(cappedDelay, jitter));
}

/**
 * Cria uma Promise com timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const error = new Error(`Operation timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

/**
 * Executa uma operação com retry logic avançado
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
    ...config
  };

  const startTime = Date.now();
  let lastError: any;
  let attempt = 0;

  while (attempt < fullConfig.maxAttempts) {
    attempt++;
    
    try {
      logger.debug('Tentativa de operação', {
        context: 'retry_logic',
        attempt,
        maxAttempts: fullConfig.maxAttempts,
        timeoutMs: fullConfig.timeoutMs
      });

      // Executar operação com timeout
      const result = await withTimeout(operation(), fullConfig.timeoutMs);
      
      const totalTime = Date.now() - startTime;
      logger.info('Operação bem-sucedida', {
        context: 'retry_logic',
        attempt,
        totalTime,
        success: true
      });

      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime
      };

    } catch (error) {
      lastError = error;
      
      // Log do erro
      logger.warn('Falha na operação', {
        context: 'retry_logic',
        attempt,
        maxAttempts: fullConfig.maxAttempts,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      // Callback de timeout específico
      if (error?.name === 'TimeoutError' && fullConfig.onTimeout) {
        fullConfig.onTimeout(fullConfig.timeoutMs);
      }

      // Verificar se deve tentar novamente
      const shouldRetry = attempt < fullConfig.maxAttempts && 
                         (!fullConfig.retryCondition || fullConfig.retryCondition(error));

      if (!shouldRetry) {
        break;
      }

      // Callback de retry
      if (fullConfig.onRetry) {
        fullConfig.onRetry(attempt, error);
      }

      // Aguardar antes do próximo retry
      if (attempt < fullConfig.maxAttempts) {
        const delay = calculateDelay(
          attempt,
          fullConfig.baseDelayMs,
          fullConfig.maxDelayMs,
          fullConfig.backoffMultiplier,
          fullConfig.jitter
        );

        logger.debug('Aguardando para retry', {
          context: 'retry_logic',
          attempt,
          delayMs: delay,
          nextAttempt: attempt + 1
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const totalTime = Date.now() - startTime;
  logger.error('Operação falhou após todos os retries', {
    context: 'retry_logic',
    attempts: attempt,
    totalTime,
    finalError: lastError?.message
  });

  return {
    success: false,
    error: lastError || new Error('Operation failed after all retries'),
    attempts: attempt,
    totalTime
  };
}

/**
 * Hook React para usar retry logic
 */
export function useRetry() {
  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    configName: keyof typeof RETRY_CONFIGS = 'network'
  ): Promise<RetryResult<T>> => {
    const config = RETRY_CONFIGS[configName];
    return withRetry(operation, config);
  };

  return { executeWithRetry };
}

/**
 * Decorator para aplicar retry logic em funções
 */
export function withRetryDecorator<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: Parameters<T>) => {
    const result = await withRetry(() => fn(...args), config);
    
    if (result.success) {
      return result.data;
    } else {
      throw result.error;
    }
  }) as T;
}

/**
 * Versão especializada para fetch com retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  configName: keyof typeof RETRY_CONFIGS = 'network'
): Promise<Response> {
  const config = RETRY_CONFIGS[configName];
  
  const result = await withRetry(async () => {
    const response = await fetch(url, options);
    
    // Considerar códigos 4xx como erro não-retriable (exceto 429)
    if (!response.ok && response.status < 500 && response.status !== 429) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).response = response;
      throw error;
    }
    
    return response;
  }, {
    ...config,
    onRetry: (attempt, error) => {
      logger.warn('Retry de fetch', {
        context: 'fetch_retry',
        url,
        attempt,
        error: error?.message
      });
    },
    onTimeout: (timeoutMs) => {
      logger.error('Timeout em fetch', {
        context: 'fetch_retry',
        url,
        timeoutMs
      });
    }
  });

  if (result.success && result.data) {
    return result.data;
  } else {
    throw result.error || new Error('Fetch failed after retries');
  }
}

/**
 * Circuit breaker simples para prevenir cascata de falhas
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeMs = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.warn('Circuit breaker aberto', {
        context: 'circuit_breaker',
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export default withRetry;
