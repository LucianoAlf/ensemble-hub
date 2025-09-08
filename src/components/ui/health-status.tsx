/**
 * Componente de status de saúde do sistema
 * Exibe informações de health checks em tempo real
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock,
  Activity,
  Wifi,
  Database,
  Zap,
  HardDrive,
  Map
} from 'lucide-react';
import { useHealthMonitor, SystemHealth } from '@/lib/health-monitor';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HealthStatusProps {
  compact?: boolean;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const getCheckIcon = (checkName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    network: Wifi,
    supabase: Database,
    performance: Zap,
    memory: HardDrive,
    localStorage: HardDrive,
    googleMaps: Map
  };
  
  return icons[checkName] || Activity;
};

const getStatusColor = (overall: SystemHealth['overall']) => {
  switch (overall) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'degraded':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'unhealthy':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (overall: SystemHealth['overall']) => {
  switch (overall) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'unhealthy':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Activity className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusText = (overall: SystemHealth['overall']) => {
  switch (overall) {
    case 'healthy':
      return 'Sistema Saudável';
    case 'degraded':
      return 'Sistema Degradado';
    case 'unhealthy':
      return 'Sistema com Problemas';
    default:
      return 'Status Desconhecido';
  }
};

export function HealthStatus({ 
  compact = false, 
  showDetails = true, 
  autoRefresh = true,
  refreshInterval = 30000 
}: HealthStatusProps) {
  const { getSystemHealth } = useHealthMonitor();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshHealth = async () => {
    setIsRefreshing(true);
    try {
      const currentHealth = getSystemHealth();
      setHealth(currentHealth);
    } catch (error) {
      console.error('Erro ao obter status de saúde:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshHealth();
    
    if (autoRefresh) {
      const interval = setInterval(refreshHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (!health) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Carregando status de saúde...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon(health.overall)}
        <Badge variant="outline" className={getStatusColor(health.overall)}>
          {getStatusText(health.overall)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshHealth}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  const uptimeHours = Math.floor(health.uptime / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((health.uptime % (1000 * 60 * 60)) / (1000 * 60));

  const healthyChecks = Object.values(health.checks).filter(check => check.healthy).length;
  const totalChecks = Object.keys(health.checks).length;
  const healthPercentage = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            {getStatusIcon(health.overall)}
            <span>Status do Sistema</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getStatusColor(health.overall)}>
              {getStatusText(health.overall)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHealth}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthyChecks}</div>
            <div className="text-sm text-muted-foreground">Checks Saudáveis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalChecks}</div>
            <div className="text-sm text-muted-foreground">Total de Checks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{uptimeHours}h {uptimeMinutes}m</div>
            <div className="text-sm text-muted-foreground">Tempo Ativo</div>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Saúde Geral</span>
            <span>{Math.round(healthPercentage)}%</span>
          </div>
          <Progress value={healthPercentage} className="h-2" />
        </div>

        {/* Detalhes dos Checks */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Detalhes dos Health Checks
            </h4>
            <div className="grid gap-3">
              {Object.entries(health.checks).map(([name, check]) => {
                const IconComponent = getCheckIcon(name);
                const lastRunText = formatDistanceToNow(check.lastRun, {
                  addSuffix: true,
                  locale: ptBR
                });

                return (
                  <div
                    key={name}
                    className={`p-3 rounded-lg border ${
                      check.healthy 
                        ? 'bg-green-50 border-green-200' 
                        : check.critical 
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-5 w-5 ${
                          check.healthy ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <div>
                          <div className="font-medium capitalize">
                            {name.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {check.message}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {check.healthy ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          {check.critical && (
                            <Badge variant="destructive" className="text-xs">
                              Crítico
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {lastRunText}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {check.duration}ms
                        </div>
                      </div>
                    </div>

                    {/* Metadata adicional */}
                    {check.metadata && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(check.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="font-medium">
                                {typeof value === 'number' ? value.toLocaleString() : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Última Atualização */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Última atualização: {formatDistanceToNow(health.lastUpdate, {
            addSuffix: true,
            locale: ptBR
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente compacto para header/navbar
 */
export function HealthStatusBadge() {
  return <HealthStatus compact={true} showDetails={false} />;
}

/**
 * Hook para obter apenas o status geral
 */
export function useSystemHealthStatus() {
  const { getSystemHealth } = useHealthMonitor();
  const [status, setStatus] = useState<SystemHealth['overall']>('healthy');

  useEffect(() => {
    const updateStatus = () => {
      const health = getSystemHealth();
      setStatus(health.overall);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [getSystemHealth]);

  return status;
}
