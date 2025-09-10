import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users } from "lucide-react";
import { useBandaMetrics } from "@/hooks/useBandaMetrics";
import { detectMobileDevice } from "@/hooks/use-mobile";

interface CategoriaBarChartProps {
  isLoading?: boolean;
}

export function CategoriaBarChart({ 
  isLoading: externalLoading = false 
}: CategoriaBarChartProps) {
  const { categoriaChartData, isLoading: metricsLoading } = useBandaMetrics();
  const isLoading = externalLoading || metricsLoading;
  const isMobile = detectMobileDevice();

  // Verificar se os dados estão disponíveis
  if (!categoriaChartData || categoriaChartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bandas por Categoria e Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Nenhum dado disponível</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2 text-foreground">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: item.color }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              {item.dataKey}: <span className="font-medium">{item.value} bandas</span>
            </p>
          ))}
          <div className="border-t pt-2 mt-2">
            <p className="text-sm font-semibold text-foreground">Total: {total} bandas</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bandas por Categoria e Unidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        ) : (
          <div className="h-[300px] sm:h-[400px] p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoriaChartData}
                margin={{
                  top: 20,
                  right: isMobile ? 10 : 30,
                  left: isMobile ? 10 : 20,
                  bottom: isMobile ? 30 : 40,
                }}
                barCategoryGap={isMobile ? "10%" : "20%"}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="categoria"
                  stroke="#888888"
                  fontSize={isMobile ? 11 : 13}
                  tickLine={false}
                  axisLine={false}
                  fontWeight={500}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 40}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={isMobile ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 30 : 40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: isMobile ? '10px' : '15px',
                    fontSize: isMobile ? '11px' : '13px'
                  }}
                />
                <Bar 
                  dataKey="Campo Grande" 
                  stackId="a" 
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="Recreio" 
                  stackId="a" 
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="Barra" 
                  stackId="a" 
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
