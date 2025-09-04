import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FinancialPayout } from "@/types/financial";
import { financialCalculations } from "@/services/financialCalculationService";

// Interface removida - usando FinancialPayout do types/financial.ts

export const PendingPayoutsPanel = () => {
  const [pendingPayouts, setPendingPayouts] = useState<FinancialPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPendingPayouts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar payouts pendentes do Supabase
        const { data: payoutsData, error: payoutsError } = await supabase
          .from('payouts')
          .select('*')
          .eq('status', 'pending')
          .order('scheduled_date', { ascending: true });

        if (payoutsError) {
          throw payoutsError;
        }

        // Converter para formato padronizado
        const standardPayouts = financialCalculations.convertDatabasePayouts(payoutsData || []);
        setPendingPayouts(standardPayouts);
      } catch (err) {
        console.error('Erro ao carregar payouts pendentes:', err);
        setError('Erro ao carregar payouts pendentes');
      } finally {
        setLoading(false);
      }
    };

    loadPendingPayouts();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pendências de Cachê/Repasse
        </CardTitle>
        <CardDescription>
          Pagamentos pendentes e próximos vencimentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Carregando payouts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-destructive">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
          </div>
        ) : pendingPayouts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum pagamento pendente</p>
          </div>
        ) : (
          pendingPayouts.map((payout) => {
            const scheduledDate = new Date(payout.scheduled_date);
            const now = new Date();
            const daysUntilDue = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const overdue = daysUntilDue < 0;
            
            return (
              <div key={payout.id} className="space-y-3 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{payout.recipient || 'Destinatário não informado'}</span>
                  </div>
                  <Badge variant={overdue ? "destructive" : daysUntilDue <= 3 ? "default" : "secondary"}>
                    {overdue ? "Atrasado" : daysUntilDue <= 0 ? "Hoje" : `${daysUntilDue}d`}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{payout.description}</span>
                  <span>•</span>
                  <span>{format(scheduledDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(payout.amount)}
                  </div>
                  <Button size="sm" variant="outline">
                    Pagar
                  </Button>
                </div>
              </div>
            );
          })
        )}
        
        {pendingPayouts.length > 0 && (
          <Button variant="outline" className="w-full mt-4">
            Ver Todos os Pagamentos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};