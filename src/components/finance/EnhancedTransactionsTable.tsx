import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseOptimized } from '@/hooks/useSupabaseOptimized';
import { useAuth } from '@/contexts/AuthProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, Eye, Edit, Trash2, Users } from 'lucide-react';
import { TransactionCard } from './TransactionCard';
import { AdaptiveConfirmationModal } from '@/components/ui/adaptive-confirmation-modal';

import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface EnhancedTransactionsTableProps {
  filters?: {
    dateRange?: { from: Date; to: Date };
    bandaId?: string;
    eventoId?: string;
    category?: string;
    status?: string;
  };
  onTransactionUpdate?: (transaction: Transaction) => void;
  onTransactionEdit?: (transaction: Transaction) => void;
  onTransactionDelete?: (transactionId: string) => void;
}

export const EnhancedTransactionsTable: React.FC<EnhancedTransactionsTableProps> = ({
  filters = {},
  onTransactionUpdate,
  onTransactionEdit,
  onTransactionDelete,
}) => {
  const { client: supabase } = useSupabaseOptimized();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const categoryOptions = [
    { value: 'show', label: 'Show' },
    { value: 'rehearsal', label: 'Ensaio' },
    { value: 'transport', label: 'Transporte' },
    { value: 'equipment', label: 'Equipamento' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Outro' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-600' },
    { value: 'scheduled', label: 'Agendado', icon: AlertCircle, color: 'text-blue-600' },
    { value: 'settled', label: 'Liquidado', icon: CheckCircle, color: 'text-green-600' },
  ];

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter valor principal da transação
  const getTransactionAmount = (transaction: Transaction) => {
    // Usar net_amount se disponível, senão gross_amount
    return transaction.net_amount ?? transaction.gross_amount ?? 0;
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const typeOptions = [
    { value: 'income', label: 'Receita', icon: TrendingUp, color: 'text-green-600' },
    { value: 'expense', label: 'Despesa', icon: TrendingDown, color: 'text-red-600' },
    { value: 'payout', label: 'Cachê', icon: Users, color: 'text-blue-600' },
  ];

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar transações da tabela transactions
      let transactionsQuery = supabase
        .from('transactions')
        .select('*, banda:banda_id(nome), evento:evento_id(titulo)')
        .eq('tenant_id', 'd93bd1e5-245e-4a40-9027-4bd669ccc390');

      // Buscar cachês da tabela payouts
      let payoutsQuery = supabase
        .from('payouts')
        .select('*, evento:evento_id(titulo)')
        .eq('tenant_id', 'd93bd1e5-245e-4a40-9027-4bd669ccc390');

      // Aplicar filtros
      if (filters.dateRange?.from && filters.dateRange?.to) {
        transactionsQuery = transactionsQuery
          .gte('transaction_date', filters.dateRange.from.toISOString())
          .lte('transaction_date', filters.dateRange.to.toISOString());
        payoutsQuery = payoutsQuery
          .gte('due_date', filters.dateRange.from.toISOString())
          .lte('due_date', filters.dateRange.to.toISOString());
      }

      if (filters.bandaId) {
        transactionsQuery = transactionsQuery.eq('banda_id', filters.bandaId);
      }

      if (filters.eventoId) {
        transactionsQuery = transactionsQuery.eq('evento_id', filters.eventoId);
        payoutsQuery = payoutsQuery.eq('evento_id', filters.eventoId);
      }

      if (filters.category) {
        transactionsQuery = transactionsQuery.eq('category', filters.category);
      }

      if (filters.status) {
        transactionsQuery = transactionsQuery.eq('status', filters.status);
        payoutsQuery = payoutsQuery.eq('status', filters.status);
      }

      // Executar ambas as queries
      const [transactionsResult, payoutsResult] = await Promise.all([
        transactionsQuery.order('created_at', { ascending: false }),
        payoutsQuery.order('created_at', { ascending: false })
      ]);

      if (transactionsResult.error) {
        console.error('Erro ao buscar transações:', transactionsResult.error);
        setError('Erro ao carregar transações');
        return;
      }

      if (payoutsResult.error) {
        console.error('Erro ao buscar cachês:', payoutsResult.error);
        setError('Erro ao carregar cachês');
        return;
      }

      // Converter payouts para formato de transação
      const payoutsAsTransactions = (payoutsResult.data || []).map(payout => ({
        id: payout.id,
        tenant_id: payout.tenant_id,
        type: 'payout' as const,
        category: 'Cachê',
        description: `Pagamento ${payout.beneficiary_name}`,
        banda_id: null,
        evento_id: payout.evento_id,
        counterparty: payout.beneficiary_name,
        gross_amount: payout.amount,
        fee_amount: 0,
        net_amount: payout.amount,
        status: payout.status,
        transaction_date: payout.due_date,
        settled_at: payout.settled_at,
        attachment_url: payout.receipt_url,
        created_at: payout.created_at,
        updated_at: payout.updated_at,
        banda: null,
        evento: payout.evento
      }));

      // Combinar e ordenar por data de criação
      const allTransactions = [...(transactionsResult.data || []), ...payoutsAsTransactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, supabase, user?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTransactionUpdate = useCallback(async (transactionId: string, field: string, value: any) => {
    if (!user?.id) return;
    
    let isSubscribed = true;
    
    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.d93bd1e5-245e-4a40-9027-4bd669ccc390`,
        },
        (payload) => {
          if (!isSubscribed) return;
          
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => 
              prev.map(t => t.id === (payload.new as Transaction).id ? (payload.new as Transaction) : t)
            );
            onTransactionUpdate?.(payload.new as Transaction);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== (payload.old as Transaction).id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Erro no canal de sincronização');
        }
      });

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, onTransactionUpdate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBulkUpdate = async (field: keyof Transaction, value: string | number | boolean | null) => {
    if (selectedTransactions.size === 0) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ [field]: value })
        .in('id', Array.from(selectedTransactions));

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error in bulk update:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar transações');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      // Encontrar a transação para verificar se é um payout
      const transactionToDelete = transactions.find(t => t.id === transactionId);
      
      if (transactionToDelete?.type === 'payout') {
        // Se for um payout, deletar da tabela payouts
        const { error } = await supabase
          .from('payouts')
          .delete()
          .eq('id', transactionId);
          
        if (error) throw error;
      } else {
        // Se for uma transação normal, deletar da tabela transactions
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionId);
          
        if (error) throw error;
      }

      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setShowDeleteConfirm(null);
      onTransactionDelete?.(transactionId);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir transação');
      setShowDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchTransactions} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle className="h-4 w-4" />
          <span>Alterações salvas com sucesso!</span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transações Financeiras</CardTitle>
          {selectedTransactions.size > 0 && !isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Ações em Massa
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkUpdate('status', 'settled')}>
                  Marcar como Liquidado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkUpdate('status', 'pending')}>
                  Marcar como Pendente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {/* Mobile: Cards Layout */}
          {isMobile ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={onTransactionEdit}
                  onDelete={onTransactionDelete}
                />
              ))}
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Nenhuma transação encontrada</h3>
                      <p className="text-sm text-gray-500">Comece criando sua primeira transação</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Desktop: Table Layout */
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pl-4 pr-2 py-2">
                    <Checkbox
                      checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Selecionar todas as transações"
                      className="border-gray-300 data-[state=checked]:bg-white data-[state=checked]:border-gray-400 data-[state=checked]:text-gray-800"
                    />
                  </th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Data</th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Descrição</th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Categoria</th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Tipo</th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Valor</th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Status</th>
                  <th className="text-left pl-4 pr-2 py-2 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const typeOption = typeOptions.find(opt => opt.value === transaction.type);
                  const statusOption = statusOptions.find(opt => opt.value === transaction.status);

                  return (
                    <tr key={transaction.id} className={cn(
                      "border-b transition-colors duration-200",
                      transaction.type === 'income' && "hover:bg-green-500/20",
                      transaction.type === 'expense' && "hover:bg-red-500/20",
                      transaction.type === 'payout' && "hover:bg-blue-500/20"
                    )}>
                      <td className="p-2">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                          aria-label={`Selecionar transação ${transaction.description}`}
                          className="border-gray-300 data-[state=checked]:bg-white data-[state=checked]:border-gray-400 data-[state=checked]:text-gray-800"
                        />
                      </td>
                      <td className="p-2">
                        <span className="text-sm">{formatDate(transaction.transaction_date)}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">{transaction.description || 'Sem descrição'}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">{transaction.category}</span>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={transaction.type === 'income' ? 'default' : transaction.type === 'payout' ? 'default' : 'destructive'}
                          className={cn(
                            transaction.type === 'income' 
                              ? "bg-green-600 text-white border-green-600 hover:bg-green-700" 
                              : transaction.type === 'payout'
                              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                              : "bg-red-600 text-white border-red-600 hover:bg-red-700",
                            "text-xs font-medium"
                          )}
                        >
                          {typeOption?.icon && <typeOption.icon className="h-3 w-3 mr-1" />}
                          {typeOption?.label}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-medium">{formatCurrency(transaction.gross_amount)}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">
                          {statusOptions.find(opt => opt.value === transaction.status)?.label}
                        </span>
                      </td>
                      <td className="pl-4 pr-2 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => onTransactionUpdate?.(transaction)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onTransactionEdit?.(transaction)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setShowDeleteConfirm(transaction.id)}
                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Nenhuma transação encontrada</h3>
                      <p className="text-sm text-gray-500">Comece criando sua primeira transação</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão Adaptativo */}
      <AdaptiveConfirmationModal
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteTransaction(showDeleteConfirm)}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        item={showDeleteConfirm ? {
          type: 'transaction',
          id: showDeleteConfirm,
          description: transactions.find(t => t.id === showDeleteConfirm)?.description || '',
          amount: getTransactionAmount(transactions.find(t => t.id === showDeleteConfirm)!),
          status: transactions.find(t => t.id === showDeleteConfirm)?.status || ''
        } : undefined}
      />
    </div>
  );
};