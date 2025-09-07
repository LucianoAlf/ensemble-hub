import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Building2 } from "lucide-react";
import { useBandaMetrics } from "@/hooks/useBandaMetrics";

interface UnidadeDistributionChartProps {
  isLoading?: boolean;
}

export function UnidadeDistributionChart({ 
  isLoading: externalLoading = false 
}: UnidadeDistributionChartProps) {
  const { unidadeChartData, isLoading: metricsLoading } = useBandaMetrics();
  const isLoading = externalLoading || metricsLoading;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
            <p className="font-semibold text-foreground">{data.name}</p>
          </div>
          <p className="text-sm text-muted-foreground ml-5">
            <span className="font-medium">{data.count} bandas</span> ({data.value}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Não mostrar label se menor que 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-semibold drop-shadow-sm"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Verificar se os dados estão disponíveis
  if (!unidadeChartData || unidadeChartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Distribuição por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Nenhum dado disponível</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Distribuição por Unidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={unidadeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={110}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {unidadeChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color, fontWeight: 500 }}>
                      {value} ({entry.payload.count} bandas)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
