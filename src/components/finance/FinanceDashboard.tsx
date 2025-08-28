import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditableField } from "./EditableField";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Skeleton } from "@/components/ui/skeleton";

const FinanceDashboard = () => {
  const { summary, payouts, loading, error, updatePayout } = useFinancialData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(dateString));
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

  const kpis = [
    {
      title: "Saldo Total",
      value: formatCurrency(summary.totalBalance),
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      description: "vs. mês anterior"
    },
    {
      title: "Receitas do Mês",
      value: formatCurrency(summary.monthlyIncome),
      change: "+8.2%",
      trend: "up", 
      icon: TrendingUp,
      description: "mês atual"
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(summary.monthlyExpenses),
      change: "-5.1%",
      trend: "down",
      icon: TrendingDown,
      description: "mês atual"
    },
    {
      title: "Cachês Pendentes",
      value: formatCurrency(summary.pendingPayouts),
      change: `${payouts.filter(p => p.status === 'pending').length} pagamentos`,
      trend: "warning",
      icon: AlertCircle,
      description: "próximos 7 dias"
    }
  ];

  // Filtrar payouts pendentes dos próximos 7 dias
  const upcomingPayments = payouts
    .filter(payout => {
      const dueDate = new Date(payout.due_date);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return payout.status === 'pending' && dueDate >= today && dueDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  // TODO: Implementar eventos recentes baseados em dados reais
  const recentEvents: any[] = [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              Erro ao carregar dados financeiros: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
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
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{payment.recipient_name}</p>
                        <p className="text-xs text-muted-foreground">{payment.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <EditableField
                        value={payment.amount}
                        type="currency"
                        onSave={(newValue) => updatePayout(payment.id, { amount: Number(newValue) })}
                        className="font-medium"
                        label="Valor do pagamento"
                      />
                      <p className="text-xs text-muted-foreground">{formatDate(payment.due_date)}</p>
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
                  <div key={event.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.name}</h4>
                      <Badge variant={event.result > 0 ? "default" : "destructive"}>
                        {formatCurrency(event.result)}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDate(event.date)}</span>
                      <span>
                        Receita: {formatCurrency(event.income)} | 
                        Despesas: {formatCurrency(event.expenses)}
                      </span>
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