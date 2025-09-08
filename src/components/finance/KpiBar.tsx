import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useFinancialData";
import { useTenant } from "@/contexts/TenantProvider";

export const KpiBar: React.FC = () => {
  const { tenantId } = useTenant();
  const { metrics, loading, error } = useDashboardMetrics(tenantId || '');

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-destructive p-4">
        Erro ao carregar métricas: {error}
      </div>
    );
  }

  const kpis = {
    balance: metrics.netAmount,
    income: metrics.totalIncome,
    expenses: metrics.totalExpense,
    result: metrics.netAmount,
    toReceive: metrics.monthlyIncome,
    toPay: metrics.pendingPayouts
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.balance)}</div>
          <p className="text-xs text-muted-foreground">
            Receitas - Despesas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.income)}</div>
          <p className="text-xs text-muted-foreground">
            No período filtrado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(kpis.expenses)}</div>
          <p className="text-xs text-muted-foreground">
            No período filtrado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado</CardTitle>
          <Badge variant={kpis.result >= 0 ? "default" : "destructive"} className="text-xs">
            {kpis.result >= 0 ? "↑" : "↓"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${kpis.result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(kpis.result)}
          </div>
          <p className="text-xs text-muted-foreground">
            No período filtrado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A Receber</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.toReceive)}</div>
          <p className="text-xs text-muted-foreground">
            Próximos 7 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(kpis.toPay)}</div>
          <p className="text-xs text-muted-foreground">
            Próximos 7 dias
          </p>
        </CardContent>
      </Card>
    </div>
  );
};