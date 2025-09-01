import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FinanceDashboard = () => {
  // Mock data - substituir por dados reais
  const kpis = [
    {
      title: "Saldo Total",
      value: "R$ 45.230,50",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      description: "vs. mês anterior"
    },
    {
      title: "Receitas do Mês",
      value: "R$ 28.450,00",
      change: "+8.2%",
      trend: "up", 
      icon: TrendingUp,
      description: "abril 2024"
    },
    {
      title: "Despesas do Mês",
      value: "R$ 15.220,00",
      change: "-5.1%",
      trend: "down",
      icon: TrendingDown,
      description: "redução vs. março"
    },
    {
      title: "Cachês Pendentes",
      value: "R$ 8.500,00",
      change: "3 pagamentos",
      trend: "warning",
      icon: AlertCircle,
      description: "próximos 7 dias"
    }
  ];

  const upcomingPayments = [
    {
      id: 1,
      beneficiary: "João Silva",
      event: "Show Acústico - Bar Central",
      amount: 2500,
      dueDate: new Date(2024, 3, 28),
      type: "musician"
    },
    {
      id: 2,
      beneficiary: "Maria Santos",
      event: "Festa Corporativa - Hotel Plaza",
      amount: 3000,
      dueDate: new Date(2024, 3, 30),
      type: "musician"
    },
    {
      id: 3,
      beneficiary: "Técnico Som & Luz",
      event: "Festival de Verão",
      amount: 3000,
      dueDate: new Date(2024, 4, 2),
      type: "service"
    }
  ];

  const recentEvents = [
    {
      id: 1,
      name: "Show Beneficente - Teatro Municipal",
      date: new Date(2024, 3, 20),
      income: 12000,
      expenses: 4500,
      result: 7500
    },
    {
      id: 2,
      name: "Festa de Casamento - Sitio das Flores",
      date: new Date(2024, 3, 18),
      income: 8500,
      expenses: 2800,
      result: 5700
    },
    {
      id: 3,
      name: "Aniversário Corporativo - Empresa XYZ",
      date: new Date(2024, 3, 15),
      income: 6000,
      expenses: 1200,
      result: 4800
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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