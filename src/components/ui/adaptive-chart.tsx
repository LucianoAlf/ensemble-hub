import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from 'recharts';

interface AdaptiveChartProps {
  children: React.ReactElement;
  height?: number;
  mobileHeight?: number;
  className?: string;
  title?: string;
  description?: string;
}

export function AdaptiveChart({
  children,
  height = 320,
  mobileHeight = 240,
  className = "",
  title,
  description,
}: AdaptiveChartProps) {
  const isMobile = useIsMobile();
  
  const chartHeight = isMobile ? mobileHeight : height;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {description}
            </p>
          )}
        </div>
      )}
      
      <div 
        className="w-full overflow-hidden rounded-lg"
        style={{ height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {React.cloneElement(children as React.ReactElement, {
            margin: isMobile 
              ? { top: 20, right: 15, left: 15, bottom: 30 }
              : { top: 20, right: 30, left: 20, bottom: 20 }
          })}
        </ResponsiveContainer>
      </div>
      
      {/* Indicador de interação touch para mobile */}
      {isMobile && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            👆 Toque no gráfico para ver detalhes
          </p>
        </div>
      )}
    </div>
  );
}

interface AdaptivePieChartProps {
  children: React.ReactElement;
  height?: number;
  mobileHeight?: number;
  className?: string;
  title?: string;
  description?: string;
  showLegend?: boolean;
  legendPosition?: 'bottom' | 'right';
}

export function AdaptivePieChart({
  children,
  height = 280,
  mobileHeight = 200,
  showLegend = true,
  legendPosition = 'bottom',
  className = "",
  title,
  description,
}: AdaptivePieChartProps) {
  const isMobile = useIsMobile();
  
  // No mobile, sempre usar legenda embaixo
  const finalLegendPosition = isMobile ? 'bottom' : legendPosition;
  const chartHeight = isMobile ? mobileHeight : height;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {description}
            </p>
          )}
        </div>
      )}
      
      <div 
        className={`w-full overflow-hidden rounded-lg ${
          finalLegendPosition === 'right' && !isMobile ? 'flex gap-4' : ''
        }`}
      >
        <div 
          className={`${
            finalLegendPosition === 'right' && !isMobile ? 'flex-1' : 'w-full'
          }`}
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Indicador de interação touch para mobile */}
      {isMobile && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            👆 Toque nas fatias para ver valores
          </p>
        </div>
      )}
    </div>
  );
}

interface AdaptiveBarChartProps {
  children: React.ReactElement;
  height?: number;
  mobileHeight?: number;
  className?: string;
  title?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
  mobileOrientation?: 'vertical' | 'horizontal';
}

export function AdaptiveBarChart({
  children,
  height = 320,
  mobileHeight = 240,
  orientation = 'vertical',
  mobileOrientation,
  className = "",
  title,
  description,
}: AdaptiveBarChartProps) {
  const isMobile = useIsMobile();
  
  const finalOrientation = isMobile && mobileOrientation ? mobileOrientation : orientation;
  const chartHeight = isMobile ? mobileHeight : height;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {description}
            </p>
          )}
        </div>
      )}
      
      <div 
        className="w-full overflow-hidden rounded-lg"
        style={{ height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {React.cloneElement(children as React.ReactElement, {
            margin: isMobile 
              ? { top: 20, right: 15, left: 15, bottom: 30 }
              : { top: 20, right: 30, left: 20, bottom: 20 }
          })}
        </ResponsiveContainer>
      </div>
      
      {/* Indicador de interação touch para mobile */}
      {isMobile && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            👆 Toque nas barras para comparar valores
          </p>
        </div>
      )}
    </div>
  );
}

// Hook para configurações de gráfico otimizadas para mobile
export function useAdaptiveChartConfig() {
  const isMobile = useIsMobile();
  
  return {
    // Margens otimizadas
    margin: isMobile 
      ? { top: 10, right: 10, left: 10, bottom: 20 }
      : { top: 20, right: 30, left: 20, bottom: 5 },
    
    // Tamanhos de fonte
    fontSize: isMobile ? 10 : 12,
    
    // Configurações de tooltip
    tooltip: {
      contentStyle: {
        fontSize: isMobile ? '12px' : '14px',
        padding: isMobile ? '8px' : '12px',
        borderRadius: '8px',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }
    },
    
    // Configurações de legenda
    legend: {
      wrapperStyle: {
        fontSize: isMobile ? '11px' : '12px',
        paddingTop: isMobile ? '8px' : '16px',
      }
    },
    
    // Raios para gráficos de pizza
    pieRadius: {
      outer: isMobile ? 60 : 90,
      inner: isMobile ? 20 : 30,
    },
    
    // Configurações de eixos
    axis: {
      tick: { fontSize: isMobile ? 10 : 12 },
      tickMargin: isMobile ? 4 : 8,
    }
  };
}
