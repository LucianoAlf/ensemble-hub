/**
 * Componente de feedback visual para operações financeiras
 * Visual feedback component for financial operations
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react';

// Status de operação
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error' | 'warning';

// Tipos de feedback
export interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Props do componente de status
interface OperationStatusProps {
  status: OperationStatus;
  message?: string;
  progress?: number;
  className?: string;
}

// Componente de status de operação
export const OperationStatus: React.FC<OperationStatusProps> = ({
  status,
  message,
  progress,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 border-blue-200',
          defaultMessage: 'Processando...'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50 border-green-200',
          defaultMessage: 'Operação concluída com sucesso'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50 border-red-200',
          defaultMessage: 'Erro na operação'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 border-yellow-200',
          defaultMessage: 'Atenção necessária'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config || status === 'idle') return null;

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-lg border',
      config.bgColor,
      className
    )}>
      <div className={config.color}>
        {config.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {message || config.defaultMessage}
        </p>
        {progress !== undefined && status === 'loading' && (
          <Progress value={progress} className="mt-2 h-2" />
        )}
      </div>
    </div>
  );
};

// Props do resumo de transação
interface TransactionSummaryProps {
  type: 'transaction' | 'payout' | 'financeiro';
  data: {
    id?: string;
    amount: number;
    description?: string;
    status?: string;
    date?: Date;
    category?: string;
    beneficiaryType?: string;
    paymentMethod?: string;
  };
  className?: string;
}

// Componente de resumo de transação
export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  type,
  data,
  className
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'transaction':
        return {
          title: 'Transação',
          icon: <DollarSign className="h-4 w-4" />,
          color: 'text-blue-500'
        };
      case 'payout':
        return {
          title: 'Payout',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-green-500'
        };
      case 'financeiro':
        return {
          title: 'Registro Financeiro',
          icon: <FileText className="h-4 w-4" />,
          color: 'text-purple-500'
        };
    }
  };

  const config = getTypeConfig();
  const isNegative = data.amount < 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={config.color}>
            {config.icon}
          </div>
          {config.title}
          {data.id && (
            <Badge variant="outline" className="ml-auto text-xs">
              {data.id.slice(0, 8)}...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Valor */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor:</span>
          <div className="flex items-center gap-1">
            {isNegative ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            <span className={cn(
              'font-medium',
              isNegative ? 'text-red-600' : 'text-green-600'
            )}>
              R$ {Math.abs(data.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Descrição */}
        {data.description && (
          <div>
            <span className="text-sm text-muted-foreground">Descrição:</span>
            <p className="text-sm mt-1 line-clamp-2">{data.description}</p>
          </div>
        )}

        {/* Status */}
        {data.status && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge 
              variant={data.status === 'settled' || data.status === 'completed' ? 'default' : 'secondary'}
            >
              {data.status}
            </Badge>
          </div>
        )}

        {/* Data */}
        {data.date && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data:</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {data.date.toLocaleDateString('pt-BR')}
            </div>
          </div>
        )}

        {/* Categoria */}
        {data.category && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Categoria:</span>
            <Badge variant="outline">{data.category}</Badge>
          </div>
        )}

        {/* Tipo de Beneficiário */}
        {data.beneficiaryType && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Beneficiário:</span>
            <div className="flex items-center gap-1 text-sm">
              <User className="h-3 w-3" />
              {data.beneficiaryType}
            </div>
          </div>
        )}

        {/* Método de Pagamento */}
        {data.paymentMethod && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pagamento:</span>
            <Badge variant="outline">{data.paymentMethod}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Props do componente de feedback de lista
interface FeedbackListProps {
  messages: FeedbackMessage[];
  onDismiss?: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

// Componente de lista de feedback
export const FeedbackList: React.FC<FeedbackListProps> = ({
  messages,
  onDismiss,
  onRetry,
  className
}) => {
  if (messages.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {messages.map((message) => (
        <FeedbackItem
          key={message.id}
          message={message}
          onDismiss={onDismiss}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
};

// Props do item de feedback
interface FeedbackItemProps {
  message: FeedbackMessage;
  onDismiss?: (id: string) => void;
  onRetry?: (id: string) => void;
}

// Componente de item de feedback
const FeedbackItem: React.FC<FeedbackItemProps> = ({
  message,
  onDismiss,
  onRetry
}) => {
  const getTypeConfig = () => {
    switch (message.type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50 border-red-200'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 border-yellow-200'
        };
      case 'info':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 border-blue-200'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border',
      config.bgColor
    )}>
      <div className={cn('mt-0.5', config.color)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{message.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString('pt-BR')}
          </span>
          {message.action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={message.action.onClick}
            >
              {message.action.label}
            </Button>
          )}
          {message.type === 'error' && onRetry && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => onRetry(message.id)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1"
          onClick={() => onDismiss(message.id)}
        >
          <XCircle className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default {
  OperationStatus,
  TransactionSummary,
  FeedbackList,
  FeedbackItem
};