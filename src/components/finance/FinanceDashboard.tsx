import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealFinancialData } from "@/hooks/useRealFinancialData";
import { useTenant } from "@/hooks/useTenant";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FinanceDashboard = () => {
  // Obter tenant_id do usuário autenticado
  const { tenantId, loading: tenantLoading, error: tenantError, hasTenant } = useTenant();
  
  const {
    summary,
    upcomingPayments,
    recentEvents,
    loading,
    error,
    refreshData
  } = useRealFinancialData(tenantId || '');

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular mudanças percentuais (simuladas por enquanto)
  const calculateChange = (current: number, type: 'income' | 'expense' | 'balance') => {
    // Em um cenário real, isso compararia com o mês anterior
    const changes = {
      income: "+8.2%",
      expense: "-5.1%", 
      balance: "+12.5%"
    };
    return changes[type] || "0%";
  };

  // Gerar KPIs baseados nos dados reais
  const kpis = summary ? [
    {
      title: "Saldo Total",
      value: formatCurrency(summary.totalBalance),
      change: calculateChange(summary.totalBalance, 'balance'),
      trend: summary.totalBalance > 0 ? "up" : "down",
      icon: DollarSign,
      description: "vs. mês anterior"
    },
    {
      title: "Receitas do Mês",
      value: formatCurrency(summary.monthlyIncome),
      change: calculateChange(summary.monthlyIncome, 'income'),
      trend: "up", 
      icon: TrendingUp,
      description: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(summary.monthlyExpenses),
      change: calculateChange(summary.monthlyExpenses, 'expense'),
      trend: "down",
      icon: TrendingDown,
      description: "redução vs. mês anterior"
    },
    {
      title: "Cachês Pendentes",
      value: formatCurrency(summary.pendingPayouts),
      change: `${upcomingPayments.length} pagamentos`,
      trend: "warning",
      icon: AlertCircle,
      description: "próximos 7 dias"
    }
  ] : [];

  // Dados reais já vêm do hook useRealFinancialData

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      case "warning": return "text-yellow-600";
      default: return "text-muted-foreground";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4" />;
      case "down": return <TrendingDown className="h-4 w-4" />;
      case "warning": return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  // Tenant loading state
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verificando acesso...</span>
      </div>
    );
  }

  // Tenant error state
  if (tenantError || !hasTenant) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {tenantError || 'Usuário não possui acesso ao sistema financeiro. Entre em contato com o administrador.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Carregando dados financeiros...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados financeiros: {error}
            <button 
              onClick={refreshData}
              className="ml-2 underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="group cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/20 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-primary">
                {kpi.title}
              </CardTitle>
              <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1 transition-colors duration-300 group-hover:text-primary">{kpi.value}</div>
              <div className={`flex items-center gap-1 text-xs ${getTrendColor(kpi.trend)}`}>
                {getTrendIcon(kpi.trend)}
                <span>{kpi.change}</span>
                <span className="text-muted-foreground ml-1">{kpi.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pagamentos Próximos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pagamentos Próximos
            </CardTitle>
            <CardDescription>
              Cachês e repasses vencendo nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum pagamento pendente
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{payment.beneficiary}</p>
                        <p className="text-xs text-muted-foreground">{payment.event}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eventos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Eventos Recentes
            </CardTitle>
            <CardDescription>
              Resumo financeiro dos últimos eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum evento encontrado
              </p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">Resultado: {event.result >= 0 ? 'Positivo' : 'Negativo'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(event.result)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;