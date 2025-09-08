/**
 * Sistema de segurança para Google Maps API
 * Implementa verificações de origem e monitoramento de uso
 */

import { logger } from './logger';

interface GoogleMapsConfig {
  apiKey: string;
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  enableLogging: boolean;
}

interface UsageStats {
  requestCount: number;
  lastRequest: number;
  windowStart: number;
}

class GoogleMapsSecurityManager {
  private static instance: GoogleMapsSecurityManager;
  private config: GoogleMapsConfig;
  private usageStats: UsageStats = {
    requestCount: 0,
    lastRequest: 0,
    windowStart: Date.now()
  };
  private isInitialized = false;

  private constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      allowedOrigins: this.getAllowedOrigins(),
      rateLimitPerMinute: 50,
      enableLogging: process.env.NODE_ENV !== 'production'
    };
  }

  static getInstance(): GoogleMapsSecurityManager {
    if (!GoogleMapsSecurityManager.instance) {
      GoogleMapsSecurityManager.instance = new GoogleMapsSecurityManager();
    }
    return GoogleMapsSecurityManager.instance;
  }

  private getAllowedOrigins(): string[] {
    const origins = [
      // Produção
      'https://seu-dominio.com',
      'https://www.seu-dominio.com'
    ];

    // Adicionar origens de desenvolvimento apenas em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      origins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://localhost:3000',
        'https://localhost:3001'
      );
    }

    return origins;
  }

  /**
   * Verifica se a origem atual é permitida
   */
  validateOrigin(): boolean {
    if (typeof window === 'undefined') {
      // Server-side, permitir
      return true;
    }

    const currentOrigin = window.location.origin;
    const isAllowed = this.config.allowedOrigins.includes(currentOrigin);

    if (!isAllowed) {
      logger.error('Origem não autorizada para Google Maps API', {
        context: 'google_maps_security',
        currentOrigin,
        allowedOrigins: this.config.allowedOrigins
      });
    }

    return isAllowed;
  }

  /**
   * Verifica rate limiting
   */
  checkRateLimit(): boolean {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minuto

    // Reset da janela se passou 1 minuto
    if (now - this.usageStats.windowStart > windowDuration) {
      this.usageStats = {
        requestCount: 0,
        lastRequest: now,
        windowStart: now
      };
    }

    // Verificar se excedeu o limite
    if (this.usageStats.requestCount >= this.config.rateLimitPerMinute) {
      logger.warn('Rate limit excedido para Google Maps API', {
        context: 'google_maps_security',
        requestCount: this.usageStats.requestCount,
        limit: this.config.rateLimitPerMinute,
        windowStart: this.usageStats.windowStart
      });
      return false;
    }

    // Incrementar contador
    this.usageStats.requestCount++;
    this.usageStats.lastRequest = now;

    return true;
  }

  /**
   * Registra uso da API para monitoramento
   */
  logApiUsage(operation: string, details?: Record<string, any>): void {
    if (!this.config.enableLogging) return;

    logger.info('Google Maps API utilizada', {
      context: 'google_maps_usage',
      operation,
      timestamp: new Date().toISOString(),
      origin: typeof window !== 'undefined' ? window.location.origin : 'server',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ...details
    });
  }

  /**
   * Verifica se pode usar a API (origem + rate limit)
   */
  canUseApi(operation: string = 'general'): boolean {
    // Verificar origem
    if (!this.validateOrigin()) {
      return false;
    }

    // Verificar rate limit
    if (!this.checkRateLimit()) {
      return false;
    }

    // Log da utilização
    this.logApiUsage(operation);

    return true;
  }

  /**
   * Obtém a API key de forma segura
   */
  getApiKey(): string | null {
    if (!this.canUseApi('get_api_key')) {
      return null;
    }

    if (!this.config.apiKey) {
      logger.error('Google Maps API key não configurada', {
        context: 'google_maps_security'
      });
      return null;
    }

    return this.config.apiKey;
  }

  /**
   * Inicializa o Google Maps de forma segura
   */
  async initializeGoogleMaps(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!this.canUseApi('initialize')) {
      return false;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return false;
    }

    try {
      // Verificar se já foi carregado
      if (typeof window !== 'undefined' && window.google?.maps) {
        this.isInitialized = true;
        return true;
      }

      // Carregar script do Google Maps
      await this.loadGoogleMapsScript(apiKey);
      this.isInitialized = true;

      logger.info('Google Maps inicializado com sucesso', {
        context: 'google_maps_security'
      });

      return true;

    } catch (error) {
      logger.error('Erro ao inicializar Google Maps', {
        context: 'google_maps_security'
      }, error);
      return false;
    }
  }

  /**
   * Carrega o script do Google Maps
   */
  private loadGoogleMapsScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window não disponível'));
        return;
      }

      // Verificar se já existe
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.logApiUsage('script_loaded');
        resolve();
      };

      script.onerror = (error) => {
        logger.error('Erro ao carregar script do Google Maps', {
          context: 'google_maps_security'
        }, error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Obtém estatísticas de uso
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
      remainingRequests: Math.max(0, this.config.rateLimitPerMinute - this.usageStats.requestCount),
      windowTimeRemaining: Math.max(0, 60000 - (Date.now() - this.usageStats.windowStart))
    };
  }

  /**
   * Reset das estatísticas (para testes)
   */
  resetStats(): void {
    this.usageStats = {
      requestCount: 0,
      lastRequest: 0,
      windowStart: Date.now()
    };
  }

  /**
   * Configura alertas de segurança
   */
  setupSecurityAlerts(): void {
    // Monitorar tentativas de acesso não autorizado
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';
        
        if (url.includes('googleapis.com/maps')) {
          if (!this.validateOrigin()) {
            logger.error('Tentativa de acesso não autorizado ao Google Maps API', {
              context: 'google_maps_security_alert',
              url,
              origin: window.location.origin,
              userAgent: navigator.userAgent
            });
            throw new Error('Acesso não autorizado');
          }
        }
        
        return originalFetch(...args);
      };
    }
  }
}

/**
 * Hook React para usar Google Maps com segurança
 */
export function useGoogleMapsSecurity() {
  const securityManager = GoogleMapsSecurityManager.getInstance();

  const initializeMaps = async () => {
    return securityManager.initializeGoogleMaps();
  };

  const canUseApi = (operation?: string) => {
    return securityManager.canUseApi(operation);
  };

  const getApiKey = () => {
    return securityManager.getApiKey();
  };

  const logUsage = (operation: string, details?: Record<string, any>) => {
    securityManager.logApiUsage(operation, details);
  };

  const getUsageStats = () => {
    return securityManager.getUsageStats();
  };

  return {
    initializeMaps,
    canUseApi,
    getApiKey,
    logUsage,
    getUsageStats
  };
}

/**
 * Componente wrapper para Google Maps com segurança
 */
export class SecureGoogleMapsLoader {
  private static securityManager = GoogleMapsSecurityManager.getInstance();

  static async loadMaps(): Promise<boolean> {
    return this.securityManager.initializeGoogleMaps();
  }

  static canUseApi(operation?: string): boolean {
    return this.securityManager.canUseApi(operation);
  }

  static setupSecurity(): void {
    this.securityManager.setupSecurityAlerts();
  }
}

// Inicializar alertas de segurança automaticamente
if (typeof window !== 'undefined') {
  SecureGoogleMapsLoader.setupSecurity();
}

export default GoogleMapsSecurityManager;
