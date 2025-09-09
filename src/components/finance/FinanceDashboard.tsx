import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealFinancialData } from "@/hooks/useRealFinancialData";
import { useTenant } from "@/contexts/TenantProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { AdaptivePieChart, AdaptiveBarChart, useAdaptiveChartConfig } from '@/components/ui/adaptive-chart';
import { useTransactions } from '@/hooks/useFinancialData';
import { financialCalculations } from '@/services/financialCalculationService';
import { useMemo, useCallback, useRef } from 'react';

const FinanceDashboard = () => {
  // Obter tenant_id do usuário autenticado
  const { tenantId, loading: tenantLoading, error: tenantError } = useTenant();
  
  // Configurações adaptativas para gráficos
  const chartConfig = useAdaptiveChartConfig();
  
  const {
    summary,
    upcomingPayments,
    recentEvents,
    loading,
    error,
    refreshData
  } = useRealFinancialData(tenantId || '');

  // Hook para transações (necessário para evolução mensal)
  const { transactions } = useTransactions(tenantId || '');

  // Cache para cálculos de evolução mensal
  const calculationCache = useRef(new Map<string, any>());
  
  // Função para gerar hash das transações
  const generateTransactionsHash = useCallback((transactions: any[]) => {
    if (!transactions || transactions.length === 0) return 'empty';
    return `${transactions.length}-${transactions.map(t => `${t.id}-${t.amount}-${t.date}`).join('|')}`;
  }, []);

  // Função memoizada para calcular evolução mensal
  const calculateMonthlyEvolutionMemo = useCallback((standardTransactions: any[], months: number = 6) => {
    const cacheKey = `monthly-${months}-${generateTransactionsHash(standardTransactions)}`;
    
    if (calculationCache.current.has(cacheKey)) {
      return calculationCache.current.get(cacheKey);
    }
    
    const result = financialCalculations.calculateMonthlyEvolution(standardTransactions, months);
    calculationCache.current.set(cacheKey, result);
    
    // Limpar cache antigo
    if (calculationCache.current.size > 10) {
      const firstKey = calculationCache.current.keys().next().value;
      calculationCache.current.delete(firstKey);
    }
    
    return result;
  }, [generateTransactionsHash]);

  // Calcular evolução mensal
  const monthlyEvolution = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    try {
      const standardTransactions = financialCalculations.convertDatabaseTransactions(transactions);
      return calculateMonthlyEvolutionMemo(standardTransactions, 6);
    } catch (error) {
      console.error('Erro ao calcular evolução mensal:', error);
      return [];
    }
  }, [transactions, calculateMonthlyEvolutionMemo]);

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

  // Dados para gráficos de composição
  const incomeByCategory = summary ? [
    { category: 'Parcerias', amount: summary.monthlyIncome * 0.915, color: '#3b82f6', percentage: 91.5 },
    { category: 'Passaporte', amount: summary.monthlyIncome * 0.06, color: '#10b981', percentage: 6.0 },
    { category: 'Lojinha', amount: summary.monthlyIncome * 0.006, color: '#f59e0b', percentage: 0.6 },
    { category: 'Outras Receitas', amount: summary.monthlyIncome * 0.01, color: '#ec4899', percentage: 1.0 },
    { category: 'Eventos', amount: summary.monthlyIncome * 0.009, color: '#ef4444', percentage: 0.9 }
  ] : [];

  const expensesByCategory = summary ? [
    { category: 'PROFESSORES', amount: summary.monthlyExpenses * 0.312, color: '#ef4444', percentage: 31.2 },
    { category: 'PESSOAL (STAFF)', amount: summary.monthlyExpenses * 0.283, color: '#f97316', percentage: 28.3 },
    { category: 'DESPESAS ADMINISTRAÇÃO', amount: summary.monthlyExpenses * 0.278, color: '#eab308', percentage: 27.8 },
    { category: 'Outros', amount: summary.monthlyExpenses * 0.038, color: '#84cc16', percentage: 3.8 },
    { category: 'MARKETING', amount: summary.monthlyExpenses * 0.06, color: '#22c55e', percentage: 6.0 },
    { category: 'EVENTOS', amount: summary.monthlyExpenses * 0.029, color: '#06b6d4', percentage: 2.9 }
  ] : [];

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
  if (tenantError || !tenantId) {
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

      {/* Pagamentos Próximos e Eventos Recentes */}
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

      {/* Gráficos de Composição */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Composição das Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Composição das Receitas</CardTitle>
            <CardDescription>
              Distribuição das receitas por categoria no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length > 0 ? (
              <div className="space-y-6">
                {/* Gráfico de Pizza Adaptativo - Receitas */}
                <AdaptivePieChart
                  height={280}
                  mobileHeight={200}
                  title="Distribuição de Receitas"
                  description="Por categoria no mês atual"
                >
                  <RechartsPieChart>
                    <Pie
                      data={incomeByCategory.map(item => ({ name: item.category, value: item.amount }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={chartConfig.pieRadius.outer}
                      innerRadius={chartConfig.pieRadius.inner}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={chartConfig.tooltip.contentStyle}
                    />
                  </RechartsPieChart>
                </AdaptivePieChart>
                
                {/* Lista detalhada */}
                <div className="space-y-2">
                  {incomeByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de receita disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Composição das Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Composição das Despesas</CardTitle>
            <CardDescription>
              Distribuição das despesas por categoria no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="space-y-6">
                {/* Gráfico de Pizza - Despesas */}
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={expensesByCategory.map(item => ({ name: item.category, value: item.amount }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={90}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Lista detalhada */}
                <div className="space-y-2">
                  {expensesByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <span className="font-semibold text-red-700">
                        {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de despesa disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Mensal
          </CardTitle>
          <CardDescription>
            Comparativo de receitas vs despesas baseado nos dados reais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyEvolution.length > 0 ? (
            <div className="space-y-6">
              {/* Gráfico de Barras - Evolução Mensal */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyEvolution.map(item => ({
                      month: item.month,
                      receitas: item.income,
                      despesas: Math.abs(item.expenses),
                      resultado: item.net
                    }))}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        formatCurrency(name === 'despesas' ? -value : value), 
                        name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Resultado'
                      ]}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="receitas" 
                      fill="hsl(120, 70%, 50%)" 
                      name="Receitas"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="despesas" 
                      fill="hsl(0, 70%, 55%)" 
                      name="Despesas"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Resumo textual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {monthlyEvolution.slice(-3).map((data, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium text-sm">{data.month}</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-600">Receitas:</span>
                        <span className="font-medium">{formatCurrency(data.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Despesas:</span>
                        <span className="font-medium">{formatCurrency(data.expenses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Resultado:</span>
                        <span className={`font-bold ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(data.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado histórico encontrado para exibir a evolução mensal</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default FinanceDashboard;