import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, DollarSign } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingPayout {
  id: string;
  beneficiary: string;
  event: string;
  dueDate: Date;
  amount: number;
  type: 'band' | 'member' | 'crew' | 'manager';
}

export const PendingPayoutsPanel = () => {
  // TODO: Load real data from database
  const pendingPayouts: PendingPayout[] = [
    {
      id: "1",
      beneficiary: "João Silva",
      event: "Show do Rock",
      dueDate: addDays(new Date(), 2),
      amount: 1500.00,
      type: "member"
    },
    {
      id: "2", 
      beneficiary: "Banda XYZ",
      event: "Festival de Verão",
      dueDate: addDays(new Date(), 5),
      amount: 3000.00,
      type: "band"
    },
    {
      id: "3",
      beneficiary: "Sound Engineer",
      event: "Show Acústico",
      dueDate: addDays(new Date(), 1),
      amount: 800.00,
      type: "crew"
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBeneficiaryIcon = (type: string) => {
    const icons = {
      band: Users,
      member: Users,
      crew: Users,
      manager: Users
    };
    const Icon = icons[type as keyof typeof icons] || Users;
    return <Icon className="h-4 w-4" />;
  };

  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date();
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        {pendingPayouts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum pagamento pendente</p>
          </div>
        ) : (
          pendingPayouts.map((payout) => {
            const daysUntilDue = getDaysUntilDue(payout.dueDate);
            const overdue = isOverdue(payout.dueDate);
            
            return (
              <div key={payout.id} className="space-y-3 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBeneficiaryIcon(payout.type)}
                    <span className="font-medium">{payout.beneficiary}</span>
                  </div>
                  <Badge variant={overdue ? "destructive" : daysUntilDue <= 3 ? "default" : "secondary"}>
                    {overdue ? "Atrasado" : daysUntilDue <= 0 ? "Hoje" : `${daysUntilDue}d`}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{payout.event}</span>
                  <span>•</span>
                  <span>{format(payout.dueDate, "dd/MM/yyyy", { locale: ptBR })}</span>
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