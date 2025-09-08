/**
 * Gerenciador de Content Security Policy (CSP)
 * Monitora violações e ajusta políticas dinamicamente
 */

import { logger } from './logger';

interface CSPViolation {
  blockedURI: string;
  documentURI: string;
  effectiveDirective: string;
  originalPolicy: string;
  referrer: string;
  statusCode: number;
  violatedDirective: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

interface CSPConfig {
  reportOnly: boolean;
  enableReporting: boolean;
  reportEndpoint?: string;
  allowedSources: {
    scripts: string[];
    styles: string[];
    images: string[];
    fonts: string[];
    connect: string[];
  };
}

class CSPManager {
  private static instance: CSPManager;
  private violations: CSPViolation[] = [];
  private config: CSPConfig;

  private constructor() {
    this.config = {
      reportOnly: process.env.NODE_ENV === 'development',
      enableReporting: true,
      allowedSources: {
        scripts: [
          "'self'",
          "'unsafe-inline'", // Necessário para Next.js em desenvolvimento
          "'unsafe-eval'", // Necessário para desenvolvimento
          'https://maps.googleapis.com',
          'https://www.googletagmanager.com'
        ],
        styles: [
          "'self'",
          "'unsafe-inline'", // Necessário para Tailwind CSS
          'https://fonts.googleapis.com'
        ],
        images: [
          "'self'",
          'data:',
          'blob:',
          'https://maps.gstatic.com',
          'https://maps.googleapis.com',
          'https://streetviewpixels-pa.googleapis.com'
        ],
        fonts: [
          "'self'",
          'https://fonts.gstatic.com'
        ],
        connect: [
          "'self'",
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'https://maps.googleapis.com'
        ]
      }
    };

    this.setupViolationReporting();
  }

  static getInstance(): CSPManager {
    if (!CSPManager.instance) {
      CSPManager.instance = new CSPManager();
    }
    return CSPManager.instance;
  }

  /**
   * Configura relatório de violações CSP
   */
  private setupViolationReporting(): void {
    if (typeof window === 'undefined' || !this.config.enableReporting) {
      return;
    }

    // Listener para violações CSP
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleViolation({
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        referrer: event.referrer,
        statusCode: event.statusCode,
        violatedDirective: event.violatedDirective,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });
    });

    // Listener para relatórios CSP via Reporting API
    if ('ReportingObserver' in window) {
      const observer = new ReportingObserver((reports) => {
        reports.forEach((report) => {
          if (report.type === 'csp-violation') {
            this.handleViolation(report.body as any);
          }
        });
      });
      observer.observe();
    }
  }

  /**
   * Processa violação CSP
   */
  private handleViolation(violation: CSPViolation): void {
    // Filtrar violações conhecidas e esperadas
    if (this.isKnownViolation(violation)) {
      return;
    }

    this.violations.push(violation);

    logger.warn('Violação CSP detectada', {
      context: 'csp_manager',
      blockedURI: violation.blockedURI,
      violatedDirective: violation.violatedDirective,
      effectiveDirective: violation.effectiveDirective,
      documentURI: violation.documentURI,
      sourceFile: violation.sourceFile,
      lineNumber: violation.lineNumber
    });

    // Reportar violação crítica
    if (this.isCriticalViolation(violation)) {
      this.reportCriticalViolation(violation);
    }

    // Limitar número de violações armazenadas
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-50);
    }
  }

  /**
   * Verifica se é uma violação conhecida/esperada
   */
  private isKnownViolation(violation: CSPViolation): boolean {
    const knownViolations = [
      // Extensões do browser
      'chrome-extension:',
      'moz-extension:',
      'safari-extension:',
      // Scripts inline esperados do Next.js
      'webpack-internal:',
      // Google Analytics/Tag Manager
      'https://www.google-analytics.com',
      'https://analytics.google.com'
    ];

    return knownViolations.some(known => 
      violation.blockedURI.includes(known)
    );
  }

  /**
   * Verifica se é uma violação crítica
   */
  private isCriticalViolation(violation: CSPViolation): boolean {
    const criticalPatterns = [
      'eval',
      'javascript:',
      'data:text/html',
      'unsafe-inline',
      'unsafe-eval'
    ];

    return criticalPatterns.some(pattern =>
      violation.blockedURI.includes(pattern) ||
      violation.violatedDirective.includes(pattern)
    );
  }

  /**
   * Reporta violação crítica
   */
  private reportCriticalViolation(violation: CSPViolation): void {
    logger.error('Violação CSP crítica detectada', {
      context: 'csp_critical_violation',
      violation,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Aqui você pode integrar com serviços de monitoramento
    // como Sentry, DataDog, etc.
  }

  /**
   * Gera política CSP baseada na configuração
   */
  generateCSPPolicy(): string {
    const directives = [
      `default-src 'self'`,
      `script-src ${this.config.allowedSources.scripts.join(' ')}`,
      `style-src ${this.config.allowedSources.styles.join(' ')}`,
      `img-src ${this.config.allowedSources.images.join(' ')}`,
      `font-src ${this.config.allowedSources.fonts.join(' ')}`,
      `connect-src ${this.config.allowedSources.connect.join(' ')}`,
      `frame-src 'none'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`
    ];

    if (this.config.enableReporting && this.config.reportEndpoint) {
      directives.push(`report-uri ${this.config.reportEndpoint}`);
    }

    return directives.join('; ');
  }

  /**
   * Adiciona fonte permitida dinamicamente
   */
  addAllowedSource(directive: keyof CSPConfig['allowedSources'], source: string): void {
    if (!this.config.allowedSources[directive].includes(source)) {
      this.config.allowedSources[directive].push(source);
      
      logger.info('Fonte adicionada à política CSP', {
        context: 'csp_manager',
        directive,
        source
      });
    }
  }

  /**
   * Remove fonte permitida
   */
  removeAllowedSource(directive: keyof CSPConfig['allowedSources'], source: string): void {
    const index = this.config.allowedSources[directive].indexOf(source);
    if (index > -1) {
      this.config.allowedSources[directive].splice(index, 1);
      
      logger.info('Fonte removida da política CSP', {
        context: 'csp_manager',
        directive,
        source
      });
    }
  }

  /**
   * Obtém estatísticas de violações
   */
  getViolationStats() {
    const stats = {
      total: this.violations.length,
      byDirective: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      critical: 0,
      recent: 0 // Últimas 24h
    };

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    this.violations.forEach(violation => {
      // Por diretiva
      const directive = violation.violatedDirective;
      stats.byDirective[directive] = (stats.byDirective[directive] || 0) + 1;

      // Por fonte
      const source = new URL(violation.blockedURI).hostname;
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;

      // Críticas
      if (this.isCriticalViolation(violation)) {
        stats.critical++;
      }

      // Recentes (assumindo timestamp no objeto, se disponível)
      // stats.recent++; // Implementar quando timestamp estiver disponível
    });

    return stats;
  }

  /**
   * Limpa violações antigas
   */
  clearViolations(): void {
    this.violations = [];
    logger.info('Violações CSP limpas', { context: 'csp_manager' });
  }

  /**
   * Configura modo de desenvolvimento
   */
  setDevelopmentMode(enabled: boolean): void {
    this.config.reportOnly = enabled;
    
    if (enabled) {
      // Adicionar fontes necessárias para desenvolvimento
      this.addAllowedSource('scripts', "'unsafe-eval'");
      this.addAllowedSource('scripts', 'webpack-internal:');
    }
  }

  /**
   * Valida se uma URL é permitida pela política atual
   */
  isSourceAllowed(directive: keyof CSPConfig['allowedSources'], url: string): boolean {
    const allowedSources = this.config.allowedSources[directive];
    
    return allowedSources.some(source => {
      if (source === "'self'") {
        return new URL(url).origin === window.location.origin;
      }
      if (source === "'unsafe-inline'" || source === "'unsafe-eval'") {
        return false; // Estas são diretivas especiais, não URLs
      }
      return url.startsWith(source);
    });
  }
}

/**
 * Hook React para usar CSP Manager
 */
export function useCSP() {
  const cspManager = CSPManager.getInstance();

  const addAllowedSource = (directive: keyof CSPConfig['allowedSources'], source: string) => {
    cspManager.addAllowedSource(directive, source);
  };

  const removeAllowedSource = (directive: keyof CSPConfig['allowedSources'], source: string) => {
    cspManager.removeAllowedSource(directive, source);
  };

  const getViolationStats = () => {
    return cspManager.getViolationStats();
  };

  const isSourceAllowed = (directive: keyof CSPConfig['allowedSources'], url: string) => {
    return cspManager.isSourceAllowed(directive, url);
  };

  return {
    addAllowedSource,
    removeAllowedSource,
    getViolationStats,
    isSourceAllowed
  };
}

/**
 * Utilitário para validar CSP antes de carregar recursos
 */
export class CSPValidator {
  private static cspManager = CSPManager.getInstance();

  static async loadScript(src: string, options?: { async?: boolean; defer?: boolean }): Promise<void> {
    if (!this.cspManager.isSourceAllowed('scripts', src)) {
      throw new Error(`Script não permitido pela política CSP: ${src}`);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options?.async ?? true;
      script.defer = options?.defer ?? false;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));

      document.head.appendChild(script);
    });
  }

  static loadStylesheet(href: string): Promise<void> {
    if (!this.cspManager.isSourceAllowed('styles', href)) {
      throw new Error(`Stylesheet não permitida pela política CSP: ${href}`);
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Falha ao carregar stylesheet: ${href}`));

      document.head.appendChild(link);
    });
  }

  static validateImageSource(src: string): boolean {
    return this.cspManager.isSourceAllowed('images', src);
  }
}

// Inicializar CSP Manager automaticamente
if (typeof window !== 'undefined') {
  CSPManager.getInstance();
}

export default CSPManager;
