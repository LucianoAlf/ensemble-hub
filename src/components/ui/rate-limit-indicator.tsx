/**
 * Componente para exibir status de rate limiting ao usuário
 */

import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useRateLimit } from '@/lib/rate-limiter';

interface RateLimitIndicatorProps {
  configName: keyof typeof import('@/lib/rate-limiter').RATE_LIMIT_CONFIGS;
  context?: string;
  showWhenOk?: boolean;
  className?: string;
}

export function RateLimitIndicator({ 
  configName, 
  context, 
  showWhenOk = false,
  className 
}: RateLimitIndicatorProps) {
  const { getStatus } = useRateLimit(configName, context);
  const status = getStatus();

  if (!status) {
    return showWhenOk ? (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Rate limit: OK
        </AlertDescription>
      </Alert>
    ) : null;
  }

  const now = Date.now();
  const isNearLimit = status.count > 0;
  const timeUntilReset = Math.max(0, status.resetTime - now);
  const minutesUntilReset = Math.ceil(timeUntilReset / (60 * 1000));

  if (!isNearLimit && !showWhenOk) {
    return null;
  }

  const progressValue = (status.count / 60) * 100; // Assumindo max 60 requests

  return (
    <Alert className={className} variant={status.count > 50 ? "destructive" : "default"}>
      <div className="flex items-center gap-2">
        {status.count > 50 ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <div className="flex-1">
          <AlertDescription>
            Rate limit: {status.count}/60 requests
            {timeUntilReset > 0 && (
              <span className="text-muted-foreground ml-2">
                (reset em {minutesUntilReset}min)
              </span>
            )}
          </AlertDescription>
          <Progress value={progressValue} className="mt-2 h-2" />
        </div>
      </div>
    </Alert>
  );
}

/**
 * Hook para mostrar toast quando rate limit é atingido
 */
export function useRateLimitToast() {
  const [lastToast, setLastToast] = React.useState<number>(0);

  const showRateLimitToast = React.useCallback((retryAfter: number) => {
    const now = Date.now();
    // Evitar spam de toasts (máximo 1 por minuto)
    if (now - lastToast < 60000) return;

    setLastToast(now);
    
    // Aqui você pode usar seu sistema de toast preferido
    console.warn(`Rate limit atingido. Tente novamente em ${retryAfter} segundos.`);
  }, [lastToast]);

  return { showRateLimitToast };
}
