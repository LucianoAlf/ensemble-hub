import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Building
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  className?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  className
}) => {
  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter valor principal da transação
  const getTransactionAmount = (transaction: Transaction) => {
    return transaction.net_amount ?? transaction.gross_amount ?? 0;
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Configurações de tipo
  const typeConfig = {
    income: { 
      icon: TrendingUp, 
      label: 'Receita', 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    expense: { 
      icon: TrendingDown, 
      label: 'Despesa', 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    payout: { 
      icon: Users, 
      label: 'Cachê', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  };

  // Configurações de status
  const statusConfig = {
    pending: { 
      icon: Clock, 
      label: 'Pendente', 
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-muted'
    },
    scheduled: { 
      icon: AlertCircle, 
      label: 'Agendado', 
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300'
    },
    settled: { 
      icon: CheckCircle, 
      label: 'Liquidado', 
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    }
  };

  const typeInfo = typeConfig[transaction.type as keyof typeof typeConfig];
  const statusInfo = statusConfig[transaction.status as keyof typeof statusConfig];
  const TypeIcon = typeInfo?.icon || TrendingUp;
  const StatusIcon = statusInfo?.icon || Clock;

  const amount = getTransactionAmount(transaction);
  const isPositive = transaction.type === 'income';

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md border-l-4",
      typeInfo?.borderColor,
      className
    )}>
      <CardContent className="p-4">
        {/* Header com tipo e valor */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              typeInfo?.bgColor
            )}>
              <TypeIcon className={cn("h-4 w-4", typeInfo?.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                {transaction.description}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {typeInfo?.label}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={cn(
              "font-bold text-lg",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? '+' : '-'}{formatCurrency(Math.abs(amount))}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(transaction)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Informações principais */}
        <div className="space-y-2">
          {/* Data */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(transaction.transaction_date || transaction.created_at)}</span>
          </div>

          {/* Categoria */}
          {transaction.category && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Tag className="h-4 w-4" />
              <span className="capitalize">{transaction.category}</span>
            </div>
          )}

          {/* Banda/Evento */}
          {(transaction as any).banda?.nome && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>{(transaction as any).banda.nome}</span>
            </div>
          )}

          {/* Evento */}
          {(transaction as any).evento?.titulo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="truncate">{(transaction as any).evento.titulo}</span>
            </div>
          )}
        </div>

        {/* Footer com status */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <Badge 
            variant="secondary" 
            className={cn(
              "flex items-center gap-1 text-xs",
              statusInfo?.color,
              statusInfo?.bgColor,
              statusInfo?.borderColor
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo?.label}
          </Badge>

          {/* Informações adicionais */}
          <div className="text-xs text-gray-500">
            {transaction.net_amount && transaction.gross_amount && 
             transaction.net_amount !== transaction.gross_amount && (
              <span>Bruto: {formatCurrency(transaction.gross_amount)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
