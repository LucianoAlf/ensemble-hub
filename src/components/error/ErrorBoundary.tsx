/**
 * Error Boundary para capturar erros em componentes React
 * Previne que erros quebrem toda a aplicação
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log estruturado do erro
    logger.error('Error Boundary capturou erro', {
      context: 'error_boundary',
      level,
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    }, error);

    // Callback customizado
    if (onError) {
      onError(error, errorInfo);
    }

    // Atualizar estado com informações do erro
    this.setState({
      errorInfo,
      error
    });

    // Reportar erro para serviços externos (se configurado)
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      // Por enquanto, apenas log local
      console.group('🚨 Error Boundary Report');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', this.state.errorId);
      console.groupEnd();
    } catch (reportingError) {
      logger.error('Falha ao reportar erro', { context: 'error_reporting' }, reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info('Tentativa de recuperação do erro', {
        context: 'error_recovery',
        errorId: this.state.errorId,
        retryCount: this.retryCount
      });
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderErrorUI() {
    const { level = 'component' } = this.props;
    const { error, errorId } = this.state;
    const canRetry = this.retryCount < this.maxRetries;

    // UI para erro crítico (página inteira)
    if (level === 'critical') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Erro Crítico</CardTitle>
              <CardDescription>
                Algo deu errado e a aplicação não pode continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>ID do Erro: <code className="bg-muted px-1 rounded">{errorId}</code></p>
                <p className="mt-2">Por favor, recarregue a página ou entre em contato com o suporte.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recarregar Página
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Ir para Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // UI para erro de página
    if (level === 'page') {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle>Erro na Página</CardTitle>
              <CardDescription>
                Esta página encontrou um problema e não pode ser exibida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>ID do Erro: <code className="bg-muted px-1 rounded">{errorId}</code></p>
                {error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:text-foreground">
                      Detalhes técnicos
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar Novamente ({this.maxRetries - this.retryCount})
                  </Button>
                )}
                <Button onClick={this.handleGoHome} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // UI para erro de componente (compacta)
    return (
      <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-destructive">
              Erro no Componente
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Este componente encontrou um problema.
            </p>
            <div className="flex gap-2 mt-3">
              {canRetry && (
                <Button size="sm" variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Tentar Novamente
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => {
                // Copiar ID do erro para clipboard
                navigator.clipboard?.writeText(errorId);
              }}>
                Copiar ID do Erro
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Usar fallback customizado se fornecido
      if (fallback) {
        return fallback;
      }
      
      // Caso contrário, usar UI padrão
      return this.renderErrorUI();
    }

    return children;
  }
}

/**
 * Hook para usar Error Boundary programaticamente
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    logger.error('Erro capturado programaticamente', { context: 'use_error_handler' }, error);
    setError(error);
  }, []);

  // Throw error para ser capturado pelo Error Boundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

/**
 * HOC para envolver componentes com Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
