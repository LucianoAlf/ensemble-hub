type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  tenantId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      userId: this.getCurrentUserId(),
      tenantId: this.getCurrentTenantId()
    };
  }

  private getCurrentUserId(): string | undefined {
    // Tentar obter do contexto de autenticação
    try {
      const authData = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch {
      // Ignorar erros ao obter userId
    }
    return undefined;
  }

  private getCurrentTenantId(): string | undefined {
    // Tentar obter do contexto global quando disponível
    try {
      return (window as any).__TENANT_ID__;
    } catch {
      // Ignorar erros ao obter tenantId
    }
    return undefined;
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    // Manter buffer limitado
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // Em produção, apenas warn e error
    return level === 'warn' || level === 'error';
  }

  private formatForConsole(entry: LogEntry): void {
    if (!this.isDevelopment) return;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    
    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}${contextStr}`, entry.error);
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}${contextStr}`, entry.error);
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}${contextStr}`, entry.error);
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}${contextStr}`, entry.error);
        break;
    }
  }

  private sendToRemoteLogging(entry: LogEntry): void {
    if (this.isDevelopment) return;

    // Em produção, enviar para serviço de logging remoto
    // Por enquanto, apenas armazenar localmente para análise posterior
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // Manter apenas os últimos 50 logs no localStorage
      const recentLogs = logs.slice(-50);
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch {
      // Ignorar erros ao salvar logs
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context);
    this.addToBuffer(entry);
    this.formatForConsole(entry);
  }

  info(message: string, context?: Record<string, any>) {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, context);
    this.addToBuffer(entry);
    this.formatForConsole(entry);
  }

  warn(message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, context, error);
    this.addToBuffer(entry);
    this.formatForConsole(entry);
    this.sendToRemoteLogging(entry);
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, context, error);
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      this.formatForConsole(entry);
    } else {
      // Em produção, log simplificado sem stack trace
      console.error(`[ERROR] ${message}`);
    }
    
    this.sendToRemoteLogging(entry);
  }

  // Método para capturar erros não tratados
  captureException(error: Error, context?: Record<string, any>) {
    this.error('Erro não tratado capturado', context, error);
  }

  // Obter logs do buffer para debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level);
    }
    return [...this.logBuffer];
  }

  // Limpar buffer de logs
  clearLogs() {
    this.logBuffer = [];
  }

  // Exportar logs para análise
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Instância global do logger
export const logger = new Logger();

// Capturar erros globais não tratados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.captureException(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.captureException(
      new Error(event.reason?.message || 'Promise rejeitada'),
      { reason: event.reason }
    );
  });
}

// Substituir console.error em produção para evitar exposição de informações
if (!import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Em produção, apenas log básico
    if (args.length > 0 && typeof args[0] === 'string') {
      logger.error(args[0]);
    } else {
      logger.error('Erro no console', { args: args.map(arg => String(arg)) });
    }
  };
}
