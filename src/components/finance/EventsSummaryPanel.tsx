import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, Music } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTransactions } from "@/hooks/useFinancialData";
import { useTenant } from "@/hooks/useTenant";
import { useMemo } from "react";

interface EventSummary {
  id: string;
  name: string;
  date: Date;
  income: number;
  expenses: number;
  result: number;
}

export const EventsSummaryPanel = () => {
  const { tenantId } = useTenant();
  const { transactions, loading, error } = useTransactions(tenantId || '', {});

  const eventsSummary = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const eventsMap = new Map<string, EventSummary>();

    transactions.forEach(transaction => {
      const eventName = transaction.event || 'Sem evento';
      
      if (!eventsMap.has(eventName)) {
        eventsMap.set(eventName, {
          id: eventName,
          name: eventName,
          date: transaction.date,
          income: 0,
          expenses: 0,
          result: 0
        });
      }

      const event = eventsMap.get(eventName)!;
      
      if (transaction.type === 'income') {
        event.income += transaction.amount;
      } else {
        event.expenses += transaction.amount;
      }
      
      event.result = event.income - event.expenses;
    });

    return Array.from(eventsMap.values());
  }, [transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Carregando eventos...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Erro ao carregar eventos: {error}</div>
        </CardContent>
      </Card>
    );
  }

  // Usar dados reais calculados do useMemo acima

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  const getResultBadge = (result: number) => {
    if (result > 0) {
      return (
        <Badge variant="default" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          +{formatCurrency(result)}
        </Badge>
      );
    } else if (result < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          -{formatCurrency(result)}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {formatCurrency(0)}
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Resumo por Evento
        </CardTitle>
        <CardDescription>
          Top 5 eventos no período filtrado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {eventsSummary.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum evento encontrado</p>
          </div>
        ) : (
          eventsSummary.map((event, index) => (
            <div key={event.id} className="space-y-3 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{event.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                {getResultBadge(event.result)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Receitas</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(event.income)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Despesas</div>
                  <div className="font-medium text-red-600">
                    {formatCurrency(event.expenses)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};