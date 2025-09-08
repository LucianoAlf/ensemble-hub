/**
 * Componentes de gráficos acessíveis com suporte a screen readers
 * Implementa descrições textuais, navegação por teclado e ARIA labels
 */

import React, { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para dados de gráficos acessíveis
export interface AccessibleChartData {
  name: string;
  value: number;
  color?: string;
  description?: string;
  percentage?: number;
}

export interface AccessibleChartProps {
  data: AccessibleChartData[];
  title: string;
  description?: string;
  type: 'pie' | 'bar';
  className?: string;
  showTable?: boolean;
  showNavigation?: boolean;
  colors?: string[];
  formatValue?: (value: number) => string;
  ariaLabel?: string;
}

// Cores padrão acessíveis (alto contraste)
const ACCESSIBLE_COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#9333ea', // purple-600
  '#c2410c', // orange-600
  '#0891b2', // cyan-600
  '#be123c', // rose-600
];

// Hook para navegação por teclado nos dados
const useChartNavigation = (data: AccessibleChartData[], enabled: boolean = true) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setIsNavigating(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setIsNavigating(true);
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < data.length) {
      setCurrentIndex(index);
      setIsNavigating(true);
    }
  };

  useEffect(() => {
    if (!enabled || !isNavigating) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPrevious();
          break;
        case 'Home':
          event.preventDefault();
          goToIndex(0);
          break;
        case 'End':
          event.preventDefault();
          goToIndex(data.length - 1);
          break;
        case 'Escape':
          setIsNavigating(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isNavigating, data.length]);

  return {
    currentIndex,
    isNavigating,
    setIsNavigating,
    goToNext,
    goToPrevious,
    goToIndex,
    currentItem: data[currentIndex],
  };
};

// Componente de tabela de dados acessível
const ChartDataTable: React.FC<{
  data: AccessibleChartData[];
  formatValue?: (value: number) => string;
  colors?: string[];
}> = ({ data, formatValue = (v) => v.toString(), colors = ACCESSIBLE_COLORS }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Dados do gráfico em formato tabular">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2" scope="col">Item</th>
            <th className="text-left p-2" scope="col">Valor</th>
            <th className="text-left p-2" scope="col">Percentual</th>
            <th className="text-left p-2" scope="col">Cor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.name} className="border-b hover:bg-muted/50">
              <td className="p-2 font-medium">{item.name}</td>
              <td className="p-2">{formatValue(item.value)}</td>
              <td className="p-2">{item.percentage?.toFixed(1)}%</td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: item.color || colors[index % colors.length] }}
                    aria-label={`Cor: ${item.color || colors[index % colors.length]}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.color || colors[index % colors.length]}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente principal de gráfico acessível
export const AccessibleChart: React.FC<AccessibleChartProps> = ({
  data,
  title,
  description,
  type,
  className,
  showTable = false,
  showNavigation = true,
  colors = ACCESSIBLE_COLORS,
  formatValue = (v) => v.toString(),
  ariaLabel,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Calcular percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: item.color || colors[index % colors.length],
  }));

  const navigation = useChartNavigation(dataWithPercentages, showNavigation);

  // Gerar descrição textual do gráfico
  const generateTextualDescription = () => {
    const sortedData = [...dataWithPercentages].sort((a, b) => b.value - a.value);
    const descriptions = sortedData.map((item, index) => {
      const position = index === 0 ? 'maior' : index === sortedData.length - 1 ? 'menor' : `${index + 1}º maior`;
      return `${item.name}: ${formatValue(item.value)} (${item.percentage?.toFixed(1)}%), ${position} valor`;
    });
    
    return `${title}. ${description || ''}. Total de ${data.length} itens. ${descriptions.join('. ')}.`;
  };

  // Componente de navegação por teclado
  const NavigationControls = () => (
    <div className="flex items-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={navigation.goToPrevious}
        disabled={!navigation.isNavigating}
        aria-label="Item anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex-1 text-center">
        {navigation.isNavigating && navigation.currentItem && (
          <div className="text-sm">
            <strong>{navigation.currentItem.name}</strong>
            <br />
            {formatValue(navigation.currentItem.value)} ({navigation.currentItem.percentage?.toFixed(1)}%)
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={navigation.goToNext}
        disabled={!navigation.isNavigating}
        aria-label="Próximo item"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  // Renderizar gráfico de pizza
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={dataWithPercentages}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
        >
          {dataWithPercentages.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke={navigation.currentIndex === index && navigation.isNavigating ? '#000' : 'none'}
              strokeWidth={navigation.currentIndex === index && navigation.isNavigating ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [formatValue(value), 'Valor']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  // Renderizar gráfico de barras
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dataWithPercentages}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatValue} />
        <Tooltip formatter={(value: number) => [formatValue(value), 'Valor']} />
        <Legend />
        <Bar
          dataKey="value"
          fill={colors[0]}
          stroke={navigation.isNavigating ? '#000' : 'none'}
          strokeWidth={navigation.isNavigating ? 1 : 0}
        >
          {dataWithPercentages.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke={navigation.currentIndex === index && navigation.isNavigating ? '#000' : 'none'}
              strokeWidth={navigation.currentIndex === index && navigation.isNavigating ? 3 : 0}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {type === 'pie' ? <PieChartIcon className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
              aria-label="Visualizar como gráfico"
            >
              {type === 'pie' ? <PieChartIcon className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Visualizar como tabela"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Descrição textual para screen readers */}
        <div className="sr-only" aria-live="polite">
          {generateTextualDescription()}
        </div>

        {/* Instruções de navegação */}
        {showNavigation && viewMode === 'chart' && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Navegação:</strong> Clique no gráfico e use as setas do teclado para navegar pelos dados. 
              Pressione Escape para sair do modo de navegação.
            </p>
          </div>
        )}

        {/* Conteúdo principal */}
        <div
          ref={chartRef}
          role="img"
          aria-label={ariaLabel || generateTextualDescription()}
          tabIndex={showNavigation ? 0 : -1}
          onFocus={() => navigation.setIsNavigating(true)}
          onBlur={() => navigation.setIsNavigating(false)}
          className={showNavigation ? "focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 rounded" : ""}
        >
          {viewMode === 'chart' ? (
            type === 'pie' ? renderPieChart() : renderBarChart()
          ) : (
            <ChartDataTable
              data={dataWithPercentages}
              formatValue={formatValue}
              colors={colors}
            />
          )}
        </div>

        {/* Controles de navegação */}
        {showNavigation && viewMode === 'chart' && <NavigationControls />}

        {/* Resumo dos dados */}
        <div className="mt-4 flex flex-wrap gap-2">
          {dataWithPercentages.slice(0, 3).map((item, index) => (
            <Badge
              key={item.name}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {item.name}: {formatValue(item.value)}
            </Badge>
          ))}
          {dataWithPercentages.length > 3 && (
            <Badge variant="outline">
              +{dataWithPercentages.length - 3} mais
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
