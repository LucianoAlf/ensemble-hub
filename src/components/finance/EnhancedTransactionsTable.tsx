import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseOptimized } from '@/hooks/useSupabaseOptimized';
import { useAuth } from '@/contexts/AuthProvider';
import { EditableField } from './editablefield';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
}

export const EnhancedTransactionsTable: React.FC<EnhancedTransactionsTableProps> = ({
  filters = {},
  onTransactionUpdate,
}) => {
  const { client: supabase } = useSupabaseOptimized();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

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

  const typeOptions = [
    { value: 'income', label: 'Receita', icon: TrendingUp, color: 'text-green-600' },
    { value: 'expense', label: 'Despesa', icon: TrendingDown, color: 'text-red-600' },
  ];

  const loadTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('transactions')
        .select('*, banda:banda_id(nome), evento:evento_id(titulo)')
        .eq('tenant_id', user.id);

      if (filters.dateRange?.from && filters.dateRange?.to) {
        query = query
          .gte('transaction_date', filters.dateRange.from.toISOString())
          .lte('transaction_date', filters.dateRange.to.toISOString());
      }

      if (filters.bandaId) {
        query = query.eq('banda_id', filters.bandaId);
      }

      if (filters.eventoId) {
        query = query.eq('evento_id', filters.eventoId);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Validate and sanitize data
      const validatedData = (data || []).map(transaction => ({
        ...transaction,
        banda_nome: transaction.banda?.nome || 'Banda não especificada',
        evento_titulo: transaction.evento?.titulo || 'Evento não especificado',
        gross_amount: Number(transaction.gross_amount) || 0,
        transaction_date: transaction.transaction_date || new Date().toISOString(),
      }));

      setTransactions(validatedData);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, supabase, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id, filters, loadTransactions]);

  useEffect(() => {
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
          filter: `tenant_id=eq.${user.id}`,
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
          <Button onClick={loadTransactions} className="mt-4">
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
          {selectedTransactions.size > 0 && (
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Checkbox
                      checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Selecionar todas as transações"
                    />
                  </th>
                  <th className="text-left p-2 text-sm font-medium">Data</th>
                  <th className="text-left p-2 text-sm font-medium">Descrição</th>
                  <th className="text-left p-2 text-sm font-medium">Categoria</th>
                  <th className="text-left p-2 text-sm font-medium">Tipo</th>
                  <th className="text-right p-2 text-sm font-medium">Valor</th>
                  <th className="text-left p-2 text-sm font-medium">Status</th>
                  <th className="text-left p-2 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const typeOption = typeOptions.find(opt => opt.value === transaction.type);
                  const statusOption = statusOptions.find(opt => opt.value === transaction.status);

                  return (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                          aria-label={`Selecionar transação ${transaction.description}`}
                        />
                      </td>
                      <td className="p-2">
                        <EditableField
                          id={transaction.id}
                          field="transaction_date"
                          value={transaction.transaction_date}
                          type="date"
                          table="transactions"
                          className="w-32"
                        />
                      </td>
                      <td className="p-2">
                        <EditableField
                          id={transaction.id}
                          field="description"
                          value={transaction.description}
                          type="text"
                          table="transactions"
                          className="w-48"
                          placeholder="Descrição da transação"
                        />
                      </td>
                      <td className="p-2">
                        <EditableField
                          id={transaction.id}
                          field="category"
                          value={transaction.category}
                          type="select"
                          table="transactions"
                          className="w-32"
                          options={categoryOptions}
                        />
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={transaction.type === 'income' ? 'default' : 'destructive'}
                          className={cn(
                            typeOption?.color,
                            "text-xs"
                          )}
                        >
                          {typeOption?.icon && <typeOption.icon className="h-3 w-3 mr-1" />}
                          {typeOption?.label}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <EditableField
                          id={transaction.id}
                          field="gross_amount"
                          value={transaction.gross_amount}
                          type="currency"
                          table="transactions"
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <EditableField
                          id={transaction.id}
                          field="status"
                          value={transaction.status}
                          type="select"
                          table="transactions"
                          className="w-32"
                          options={statusOptions}
                        />
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onTransactionUpdate?.(transaction)}>
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma transação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};