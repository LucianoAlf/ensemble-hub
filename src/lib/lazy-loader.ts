/**
 * Sistema de lazy loading consistente
 * Gerencia carregamento dinâmico de componentes com fallbacks
 */

import React, { Suspense, ComponentType } from 'react';

interface LazyLoadOptions {
  fallback?: React.ReactElement;
  retryCount?: number;
  timeout?: number;
  preload?: boolean;
}

/**
 * Componente de fallback padrão para loading
 */
export function LazyLoadingFallback({ message = 'Carregando...' }: { message?: string }) {
  return React.createElement(
    'div',
    { className: 'flex items-center justify-center p-8' },
    React.createElement(
      'div',
      { className: 'flex items-center space-x-2' },
      React.createElement('div', { 
        className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-primary' 
      }),
      React.createElement(
        'span',
        { className: 'text-sm text-muted-foreground' },
        message
      )
    )
  );
}

/**
 * Retry logic para imports que falharam
 */
async function retryImport<T>(
  importFn: () => Promise<T>,
  retryCount: number,
  timeout: number
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const importPromise = importFn();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), timeout);
      });

      const result = await Promise.race([importPromise, timeoutPromise]);
      
      if (attempt > 1) {
        console.info('Import bem-sucedido após retry:', { attempt, retryCount });
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      
      console.warn('Falha no import do componente:', { attempt, retryCount, error: lastError.message });

      if (attempt < retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('Todas as tentativas de import falharam:', { retryCount, finalError: lastError.message });
  throw lastError;
}

/**
 * Wrapper para lazy loading com retry e fallback customizável
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): ComponentType<any> {
  const {
    fallback = React.createElement(LazyLoadingFallback),
    retryCount = 3,
    timeout = 10000,
    preload = false
  } = options;

  const LazyComponent = React.lazy(() => {
    return retryImport(importFn, retryCount, timeout);
  });

  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Falha no preload do componente:', error.message);
      });
    }, 100);
  }

  const WrappedComponent: ComponentType<any> = (props) => {
    return React.createElement(
      Suspense,
      { fallback },
      React.createElement(LazyComponent, props)
    );
  };

  WrappedComponent.displayName = 'LazyWrapper';
  return WrappedComponent;
}

/**
 * Utilitário para lazy loading de páginas
 */
export function createLazyPage<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  pageName: string
) {
  return createLazyComponent(importFn, {
    fallback: React.createElement(LazyLoadingFallback, { message: `Carregando ${pageName}...` }),
    retryCount: 3,
    timeout: 15000,
    preload: false
  });
}

/**
 * Utilitário para lazy loading de modais/dialogs
 */
export function createLazyModal<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  modalName: string
) {
  return createLazyComponent(importFn, {
    fallback: React.createElement(LazyLoadingFallback, { message: `Abrindo ${modalName}...` }),
    retryCount: 2,
    timeout: 8000,
    preload: true
  });
}

/**
 * Utilitário para lazy loading de charts/gráficos
 */
export function createLazyChart<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chartName: string = 'gráfico'
) {
  return createLazyComponent(importFn, {
    fallback: React.createElement(LazyLoadingFallback, { message: `Carregando ${chartName}...` }),
    retryCount: 2,
    timeout: 10000,
    preload: false
  });
}
