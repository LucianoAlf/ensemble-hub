/**
 * Sistema de monitoramento de saúde da aplicação
 * Executa health checks periódicos e monitora performance
 */

import { logger } from './logger';

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  interval: number; // em milissegundos
  timeout: number; // em milissegundos
  critical: boolean;
}

export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthCheckResult & { lastRun: number; critical: boolean }>;
  uptime: number;
  lastUpdate: number;
}

class HealthMonitor {
  private static instance: HealthMonitor;
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, HealthCheckResult & { lastRun: number; critical: boolean }> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime = Date.now();
  private isRunning = false;

  private constructor() {
    this.setupDefaultChecks();
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Configura health checks padrão
   */
  private setupDefaultChecks(): void {
    // Check de conectividade de rede
    this.addCheck({
      name: 'network',
      check: this.checkNetworkConnectivity,
      interval: 30000, // 30 segundos
      timeout: 5000,
      critical: true
    });

    // Check do Supabase
    this.addCheck({
      name: 'supabase',
      check: this.checkSupabaseConnection,
      interval: 60000, // 1 minuto
      timeout: 10000,
      critical: true
    });

    // Check de performance do browser
    this.addCheck({
      name: 'performance',
      check: this.checkBrowserPerformance,
      interval: 120000, // 2 minutos
      timeout: 1000,
      critical: false
    });

    // Check de memória
    this.addCheck({
      name: 'memory',
      check: this.checkMemoryUsage,
      interval: 60000, // 1 minuto
      timeout: 1000,
      critical: false
    });

    // Check de localStorage
    this.addCheck({
      name: 'localStorage',
      check: this.checkLocalStorage,
      interval: 300000, // 5 minutos
      timeout: 1000,
      critical: false
    });

    // Check de APIs externas (Google Maps)
    this.addCheck({
      name: 'googleMaps',
      check: this.checkGoogleMapsAPI,
      interval: 300000, // 5 minutos
      timeout: 10000,
      critical: false
    });
  }

  /**
   * Adiciona um health check
   */
  addCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    
    if (this.isRunning) {
      this.startCheckInterval(check);
    }

    logger.info('Health check adicionado', {
      context: 'health_monitor',
      checkName: check.name,
      interval: check.interval,
      critical: check.critical
    });
  }

  /**
   * Remove um health check
   */
  removeCheck(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
    
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }

    logger.info('Health check removido', {
      context: 'health_monitor',
      checkName: name
    });
  }

  /**
   * Inicia o monitoramento
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Executar todos os checks imediatamente
    this.runAllChecks();
    
    // Configurar intervalos
    for (const check of this.checks.values()) {
      this.startCheckInterval(check);
    }

    logger.info('Health monitor iniciado', {
      context: 'health_monitor',
      checksCount: this.checks.size
    });
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Limpar todos os intervalos
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();

    logger.info('Health monitor parado', {
      context: 'health_monitor'
    });
  }

  /**
   * Inicia intervalo para um check específico
   */
  private startCheckInterval(check: HealthCheck): void {
    const interval = setInterval(() => {
      this.runCheck(check.name);
    }, check.interval);
    
    this.intervals.set(check.name, interval);
  }

  /**
   * Executa todos os checks
   */
  private async runAllChecks(): Promise<void> {
    const promises = Array.from(this.checks.keys()).map(name => 
      this.runCheck(name)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Executa um check específico
   */
  private async runCheck(name: string): Promise<void> {
    const check = this.checks.get(name);
    if (!check) return;

    const startTime = Date.now();
    
    try {
      // Executar com timeout
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        )
      ]);

      this.results.set(name, {
        ...result,
        lastRun: Date.now(),
        critical: check.critical
      });

      if (!result.healthy) {
        logger.warn('Health check falhou', {
          context: 'health_monitor',
          checkName: name,
          message: result.message,
          duration: result.duration,
          critical: check.critical
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.set(name, {
        healthy: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        duration,
        lastRun: Date.now(),
        critical: check.critical
      });

      logger.error('Erro durante health check', {
        context: 'health_monitor',
        checkName: name,
        duration,
        critical: check.critical
      }, error);
    }
  }

  /**
   * Obtém status geral de saúde
   */
  getSystemHealth(): SystemHealth {
    const checks: SystemHealth['checks'] = {};
    let healthyCount = 0;
    let criticalFailures = 0;
    let totalChecks = 0;

    for (const [name, result] of this.results.entries()) {
      checks[name] = result;
      totalChecks++;
      
      if (result.healthy) {
        healthyCount++;
      } else if (result.critical) {
        criticalFailures++;
      }
    }

    let overall: SystemHealth['overall'];
    if (criticalFailures > 0) {
      overall = 'unhealthy';
    } else if (healthyCount < totalChecks) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      checks,
      uptime: Date.now() - this.startTime,
      lastUpdate: Date.now()
    };
  }

  // Health Check Implementations

  private checkNetworkConnectivity = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      if (!navigator.onLine) {
        return {
          healthy: false,
          message: 'Sem conexão de rede',
          duration: Date.now() - startTime
        };
      }

      // Tentar fazer uma requisição simples
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });

      return {
        healthy: response.ok,
        message: response.ok ? 'Conectividade OK' : `HTTP ${response.status}`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Falha na conectividade',
        duration: Date.now() - startTime
      };
    }
  };

  private checkSupabaseConnection = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      // Importação dinâmica para evitar problemas de SSR
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      return {
        healthy: !error,
        message: error ? error.message : 'Supabase conectado',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Erro de conexão com Supabase',
        duration: Date.now() - startTime
      };
    }
  };

  private checkBrowserPerformance = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      if (typeof window === 'undefined') {
        return {
          healthy: true,
          message: 'Server-side, performance OK',
          duration: Date.now() - startTime
        };
      }

      // Verificar performance API
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        
        const healthy = loadTime < 3000; // Menos de 3 segundos
        
        return {
          healthy,
          message: healthy ? 'Performance OK' : 'Performance degradada',
          duration: Date.now() - startTime,
          metadata: {
            loadTime,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
          }
        };
      }

      return {
        healthy: true,
        message: 'Performance API não disponível',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Erro ao verificar performance',
        duration: Date.now() - startTime
      };
    }
  };

  private checkMemoryUsage = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      if (typeof window === 'undefined' || !('memory' in performance)) {
        return {
          healthy: true,
          message: 'Memory API não disponível',
          duration: Date.now() - startTime
        };
      }

      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      const usage = (usedMB / limitMB) * 100;
      
      const healthy = usage < 80; // Menos de 80% de uso
      
      return {
        healthy,
        message: healthy ? 'Uso de memória OK' : 'Alto uso de memória',
        duration: Date.now() - startTime,
        metadata: {
          usedMB: Math.round(usedMB),
          limitMB: Math.round(limitMB),
          usagePercent: Math.round(usage)
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Erro ao verificar memória',
        duration: Date.now() - startTime
      };
    }
  };

  private checkLocalStorage = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      if (typeof window === 'undefined') {
        return {
          healthy: true,
          message: 'Server-side, localStorage OK',
          duration: Date.now() - startTime
        };
      }

      // Testar escrita e leitura
      const testKey = '_health_check_test';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const healthy = retrieved === testValue;
      
      return {
        healthy,
        message: healthy ? 'localStorage funcionando' : 'localStorage com problemas',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'localStorage não disponível',
        duration: Date.now() - startTime
      };
    }
  };

  private checkGoogleMapsAPI = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      if (typeof window === 'undefined') {
        return {
          healthy: true,
          message: 'Server-side, Google Maps OK',
          duration: Date.now() - startTime
        };
      }

      // Verificar se Google Maps está carregado
      if (window.google?.maps) {
        return {
          healthy: true,
          message: 'Google Maps carregado',
          duration: Date.now() - startTime
        };
      }

      // Tentar fazer uma requisição simples à API
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return {
          healthy: false,
          message: 'API Key do Google Maps não configurada',
          duration: Date.now() - startTime
        };
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`,
        { method: 'HEAD' }
      );

      return {
        healthy: response.ok,
        message: response.ok ? 'Google Maps API acessível' : 'Google Maps API com problemas',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Erro ao verificar Google Maps API',
        duration: Date.now() - startTime
      };
    }
  };
}

/**
 * Hook React para usar Health Monitor
 */
export function useHealthMonitor() {
  const monitor = HealthMonitor.getInstance();

  const getSystemHealth = () => {
    return monitor.getSystemHealth();
  };

  const runCheck = (name: string) => {
    return (monitor as any).runCheck(name);
  };

  const addCheck = (check: HealthCheck) => {
    monitor.addCheck(check);
  };

  const removeCheck = (name: string) => {
    monitor.removeCheck(name);
  };

  return {
    getSystemHealth,
    runCheck,
    addCheck,
    removeCheck
  };
}

// Inicializar automaticamente no browser
if (typeof window !== 'undefined') {
  const monitor = HealthMonitor.getInstance();
  monitor.start();
  
  // Parar quando a página for descarregada
  window.addEventListener('beforeunload', () => {
    monitor.stop();
  });
}

export default HealthMonitor;
