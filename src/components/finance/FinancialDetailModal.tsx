import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobile } from "@/hooks/use-mobile";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Calendar,
  Users,
  Building,
  CreditCard,
  Receipt,
  Target,
  PieChart,
  BarChart3
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  type: 'income' | 'expense';
  status?: 'pending' | 'completed' | 'cancelled';
}

interface Event {
  id: string;
  name: string;
  date: Date;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  venue?: string;
  participants?: number;
}

interface BalanceBreakdown {
  totalBalance: number;
  cashBalance: number;
  bankBalance: number;
  pendingReceivables: number;
  pendingPayables: number;
  investments?: number;
}

interface FinancialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'balance' | 'income' | 'expenses' | 'pending';
  title: string;
  value: string;
  data?: {
    transactions?: Transaction[];
    events?: Event[];
    breakdown?: BalanceBreakdown;
    categories?: Array<{
      name: string;
      amount: number;
      percentage: number;
      color: string;
    }>;
  };
}

const FinancialDetailModal = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  value, 
  data 
}: FinancialDetailModalProps) => {
  const isMobile = useMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      completed: { variant: "default" as const, label: "Concluído" },
      paid: { variant: "default" as const, label: "Pago" },
      cancelled: { variant: "destructive" as const, label: "Cancelado" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderBalanceContent = () => {
    if (!data?.breakdown) return null;

    const { breakdown } = data;
    
    return (
      <div className="space-y-6">
        {/* Resumo Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumo do Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center mb-4">
              {formatCurrency(breakdown.totalBalance)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Dinheiro</div>
                <div className="font-semibold text-green-700">
                  {formatCurrency(breakdown.cashBalance)}
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Banco</div>
                <div className="font-semibold text-blue-700">
                  {formatCurrency(breakdown.bankBalance)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detalhamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                A Receber
              </span>
              <span className="font-semibold text-green-600">
                {formatCurrency(breakdown.pendingReceivables)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                A Pagar
              </span>
              <span className="font-semibold text-red-600">
                {formatCurrency(breakdown.pendingPayables)}
              </span>
            </div>
            {breakdown.investments && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  Investimentos
                </span>
                <span className="font-semibold text-purple-600">
                  {formatCurrency(breakdown.investments)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTransactionsContent = () => {
    if (!data?.transactions) return null;

    const { transactions } = data;
    const isIncome = type === 'income';

    return (
      <div className="space-y-4">
        {/* Resumo por Categoria */}
        {data.categories && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(category.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Transações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transações Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{transaction.description}</span>
                        {transaction.status && getStatusBadge(transaction.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{transaction.category}</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEventsContent = () => {
    if (!data?.events) return null;

    const { events } = data;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{event.name}</h4>
                        {event.venue && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Building className="h-3 w-3" />
                            {event.venue}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.date)}
                        </div>
                        {event.participants && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.participants} pessoas
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-lg">
                        {formatCurrency(event.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'balance':
        return renderBalanceContent();
      case 'income':
      case 'expenses':
        return renderTransactionsContent();
      case 'pending':
        return renderEventsContent();
      default:
        return <div>Conteúdo não disponível</div>;
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold mb-2">{value}</div>
        <div className="text-muted-foreground">
          {type === 'balance' && 'Saldo atual consolidado'}
          {type === 'income' && 'Total de receitas no mês'}
          {type === 'expenses' && 'Total de despesas no mês'}
          {type === 'pending' && 'Valores aguardando pagamento'}
        </div>
      </div>
      <Separator />
      {renderContent()}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>
              Detalhamento completo dos valores
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ScrollArea className="h-[70vh]">
              {content}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detalhamento completo dos valores
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialDetailModal;
