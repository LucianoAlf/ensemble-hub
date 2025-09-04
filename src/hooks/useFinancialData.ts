/**
 * Custom hooks for financial data management
 * Hooks personalizados para gerenciamento de dados financeiros
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';
import {
  FinancialTransaction,
  FinancialPayout,
  DashboardMetrics,
  Financeiro
} from '../types/financial';
import { financialCalculations } from '../services/financialCalculationService';

// Importar serviços mockados temporariamente (desabilitados)
import {
  mockTransactionService,
  mockPayoutService,
  mockFinanceiroService,
  mockDashboardMetrics,
  type MockTransaction,
  type MockPayout,
  type MockFinanceiro
} from '../services/mockFinancialService';

// Desabilitar modo mock para usar dados reais
const IS_MOCK_MODE = false;

// Tipos do banco de dados
type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

type Payout = Database['public']['Tables']['payouts']['Row'];
type PayoutInsert = Database['public']['Tables']['payouts']['Insert'];
type PayoutUpdate = Database['public']['Tables']['payouts']['Update'];

type FinanceiroRow = Database['public']['Tables']['financeiro']['Row'];
type FinanceiroInsert = Database['public']['Tables']['financeiro']['Insert'];
type FinanceiroUpdate = Database['public']['Tables']['financeiro']['Update'];

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface TransactionFilters {
  evento_id?: string;
  banda_id?: string;
  status?: string;
  type?: 'income' | 'expense';
}

interface PayoutFilters {
  evento_id?: string;
  status?: string;
  beneficiary_type?: string;
}

interface FinanceiroFilters {
  evento_id?: string;
  tipo?: 'receita' | 'despesa';
  categoria?: string;
}

// Interface DashboardMetrics agora é importada de @/types/financial

// Função utilitária para validar UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Função utilitária para tratamento de erros
const handleError = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// Hook para Transações
export const useTransactions = (tenantId: string, filters: TransactionFilters = {}, pagination: PaginationOptions = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Validação robusta do tenantId
  useEffect(() => {
    if (!tenantId) {
      // Não mostrar toast quando tenantId está vazio (ainda carregando)
      setError(null);
      setLoading(true);
      return;
    }
    
    if (!isValidUUID(tenantId)) {
      const errorMsg = 'Formato de tenantId inválido';
      setError(errorMsg);
      toast({
        title: 'Erro de Validação',
        description: errorMsg,
        variant: 'destructive'
      });
      return;
    }
    
    // Se chegou aqui, tenantId é válido
    setError(null);
  }, [tenantId, toast]);

  const loadTransactions = useCallback(async () => {
    if (!tenantId || !isValidUUID(tenantId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data, count, supabaseError;
      
      if (IS_MOCK_MODE) {
        console.log('🎭 Usando dados mockados para transações');
        const result = await mockTransactionService.getAll(tenantId);
        data = result.data;
        supabaseError = result.error;
        count = result.count;
      } else {
        let query = supabase
          .from('transactions')
          .select('*', { count: 'exact' })
          .eq('tenant_id', tenantId);

        // Aplicar filtros
        if (filters.evento_id) {
          query = query.eq('evento_id', filters.evento_id);
        }
        if (filters.banda_id) {
          query = query.eq('banda_id', filters.banda_id);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }

        // Paginação
        if (pagination.page && pagination.limit) {
          const from = (pagination.page - 1) * pagination.limit;
          const to = from + pagination.limit - 1;
          query = query.range(from, to);
        }

        const result = await query.order('created_at', { ascending: false });
        data = result.data;
        count = result.count;
        supabaseError = result.error;
      }

      if (supabaseError) throw supabaseError;

      setTransactions(data || []);
      setTotal(count || 0);
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao carregar transações');
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, JSON.stringify(filters), JSON.stringify(pagination), toast]);

  const createTransaction = useCallback(async (transaction: TransactionInsert): Promise<ApiResponse<Transaction>> => {
    try {
      if (!transaction.tenant_id || transaction.tenant_id !== tenantId) {
        throw new Error('tenant_id inválido ou não fornecido');
      }

      if (!isValidUUID(transaction.tenant_id)) {
        throw new Error('Formato de tenant_id inválido');
      }

      let data, supabaseError;
      
      if (IS_MOCK_MODE) {
        console.log('🎭 Criando transação com dados mockados');
        const result = await mockTransactionService.create(transaction as MockTransaction);
        data = result.data;
        supabaseError = result.error;
      } else {
        const result = await supabase
          .from('transactions')
          .insert(transaction)
          .select()
          .single();
        
        data = result.data;
        supabaseError = result.error;
      }

      if (supabaseError) throw supabaseError;

      setTransactions(prev => [data, ...prev]);
      setTotal(prev => prev + 1);

      toast({
        title: 'Sucesso',
        description: 'Transação criada com sucesso'
      });

      return { data, success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao criar transação');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const updateTransaction = useCallback(async (id: string, updates: TransactionUpdate): Promise<ApiResponse<Transaction>> => {
    try {
      if (updates.tenant_id && updates.tenant_id !== tenantId) {
        throw new Error('Não é possível alterar o tenant_id');
      }

      let data, supabaseError;
      
      if (IS_MOCK_MODE) {
        console.log('🎭 Atualizando transação com dados mockados');
        const result = await mockTransactionService.update(id, updates as MockTransaction);
        data = result.data;
        supabaseError = result.error;
      } else {
        const result = await supabase
          .from('transactions')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        data = result.data;
        supabaseError = result.error;
      }

      if (supabaseError) throw supabaseError;

      setTransactions(prev => prev.map(t => t.id === id ? data : t));

      toast({
        title: 'Sucesso',
        description: 'Transação atualizada com sucesso'
      });

      return { data, success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao atualizar transação');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const deleteTransaction = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    try {
      let supabaseError;
      
      if (IS_MOCK_MODE) {
        console.log('🎭 Removendo transação com dados mockados');
        const result = await mockTransactionService.delete(id);
        supabaseError = result.error;
      } else {
        const result = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        
        supabaseError = result.error;
      }

      if (supabaseError) throw supabaseError;

      setTransactions(prev => prev.filter(t => t.id !== id));
      setTotal(prev => prev - 1);

      toast({
        title: 'Sucesso',
        description: 'Transação removida com sucesso'
      });

      return { success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao remover transação');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const refreshTransactions = useCallback(() => {
    return loadTransactions();
  }, [loadTransactions]);

  // Sincronização em tempo real
  useEffect(() => {
    if (!tenantId || !isValidUUID(tenantId)) {
      return;
    }

    const channel = supabase
      .channel(`transactions:${tenantId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setTransactions(prev => [payload.new as Transaction, ...prev]);
              setTotal(prev => prev + 1);
              break;
            case 'UPDATE':
              setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
              break;
            case 'DELETE':
              setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
              setTotal(prev => prev - 1);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  // Carregar transações quando tenantId, filtros ou paginação mudarem
  useEffect(() => {
    if (tenantId && isValidUUID(tenantId)) {
      loadTransactions();
    }
  }, [tenantId, loadTransactions]);

  return {
    transactions,
    loading,
    error,
    total,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions
  };
};

// Hook para métricas do dashboard
export const useDashboardMetrics = (tenantId: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validação do tenantId
  useEffect(() => {
    if (!tenantId) {
      setError(null);
      setLoading(true);
      return;
    }
    
    if (!isValidUUID(tenantId)) {
      const errorMsg = 'Formato de tenantId inválido';
      setError(errorMsg);
      toast({
        title: 'Erro de Validação',
        description: errorMsg,
        variant: 'destructive'
      });
      return;
    }
    
    setError(null);
  }, [tenantId, toast]);

  const loadMetrics = useCallback(async () => {
    if (!tenantId || !isValidUUID(tenantId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar transações e payouts para calcular métricas
      const [transactionsResult, payoutsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('tenant_id', tenantId),
        supabase
          .from('payouts')
          .select('*')
          .eq('tenant_id', tenantId)
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (payoutsResult.error) throw payoutsResult.error;

      const transactions = transactionsResult.data || [];
      const payouts = payoutsResult.data || [];

      // Calcular métricas usando o serviço de cálculo
      const calculatedMetrics = financialCalculations.calculateDashboardMetrics(
        transactions.map(t => ({
          ...t,
          amount: t.gross_amount,
          date: t.created_at
        })) as FinancialTransaction[],
        payouts.map(payout => ({
          ...payout,
          description: payout.notes || '',
          scheduled_date: payout.due_date
        })) as FinancialPayout[]
      );

      setMetrics(calculatedMetrics);
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao carregar métricas do dashboard');
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  // Carregar métricas quando tenantId mudar
  useEffect(() => {
    if (tenantId && isValidUUID(tenantId)) {
      loadMetrics();
    }
  }, [tenantId, loadMetrics]);

  const refreshMetrics = useCallback(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics
  };
};

// Hook para Payouts
export const usePayouts = (tenantId: string, filters: PayoutFilters = {}, pagination: PaginationOptions = {}) => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Validação do tenantId
  useEffect(() => {
    if (!tenantId) {
      setError(null);
      setLoading(true);
      return;
    }
    
    if (!isValidUUID(tenantId)) {
      const errorMsg = 'Formato de tenantId inválido';
      setError(errorMsg);
      return;
    }
    
    setError(null);
  }, [tenantId]);

  const loadPayouts = useCallback(async () => {
    if (!tenantId || !isValidUUID(tenantId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('payouts')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      // Aplicar filtros
      if (filters.evento_id) {
        query = query.eq('evento_id', filters.evento_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Aplicar paginação
      if (pagination.page && pagination.limit) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) throw supabaseError;

      setPayouts(data || []);
      setTotal(count || 0);
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao carregar payouts');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, pagination]);

  const createPayout = useCallback(async (payout: PayoutInsert): Promise<ApiResponse<Payout>> => {
    try {
      if (!payout.tenant_id || payout.tenant_id !== tenantId) {
        throw new Error('tenant_id inválido ou não fornecido');
      }

      const { data, error: supabaseError } = await supabase
        .from('payouts')
        .insert(payout)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setPayouts(prev => [data, ...prev]);
      setTotal(prev => prev + 1);

      toast({
        title: 'Sucesso',
        description: 'Payout criado com sucesso'
      });

      return { data, success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao criar payout');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const updatePayout = useCallback(async (id: string, updates: PayoutUpdate): Promise<ApiResponse<Payout>> => {
    try {
      if (updates.tenant_id && updates.tenant_id !== tenantId) {
        throw new Error('Não é possível alterar o tenant_id');
      }

      const { data, error: supabaseError } = await supabase
        .from('payouts')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setPayouts(prev => prev.map(p => p.id === id ? data : p));

      toast({
        title: 'Sucesso',
        description: 'Payout atualizado com sucesso'
      });

      return { data, success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao atualizar payout');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const deletePayout = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error: supabaseError } = await supabase
        .from('payouts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (supabaseError) throw supabaseError;

      setPayouts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);

      toast({
        title: 'Sucesso',
        description: 'Payout removido com sucesso'
      });

      return { success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao remover payout');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const refreshPayouts = useCallback(() => {
    return loadPayouts();
  }, [loadPayouts]);

  useEffect(() => {
    if (tenantId && isValidUUID(tenantId)) {
      loadPayouts();
    }
  }, [tenantId, loadPayouts]);

  return {
    payouts,
    loading,
    error,
    total,
    createPayout,
    updatePayout,
    deletePayout,
    refreshPayouts
  };
};

// Hook para Financeiro
export const useFinanceiro = (tenantId: string, filters: FinanceiroFilters = {}, pagination: PaginationOptions = {}) => {
  const [financeiro, setFinanceiro] = useState<FinanceiroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Validação do tenantId
  useEffect(() => {
    if (!tenantId) {
      setError(null);
      setLoading(true);
      return;
    }
    
    if (!isValidUUID(tenantId)) {
      const errorMsg = 'Formato de tenantId inválido';
      setError(errorMsg);
      return;
    }
    
    setError(null);
  }, [tenantId]);

  const loadFinanceiro = useCallback(async () => {
    if (!tenantId || !isValidUUID(tenantId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('financeiro')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      // Aplicar filtros
      if (filters.evento_id) {
        query = query.eq('evento_id', filters.evento_id);
      }
      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      // Aplicar paginação
      if (pagination.page && pagination.limit) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) throw supabaseError;

      setFinanceiro(data || []);
      setTotal(count || 0);
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao carregar dados financeiros');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, pagination]);

  const createFinanceiro = useCallback(async (financeiro: FinanceiroInsert): Promise<ApiResponse<FinanceiroRow>> => {
    try {
      if (!financeiro.tenant_id || financeiro.tenant_id !== tenantId) {
        throw new Error('tenant_id inválido ou não fornecido');
      }

      const { data, error: supabaseError } = await supabase
        .from('financeiro')
        .insert(financeiro)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setFinanceiro(prev => [data, ...prev]);
      setTotal(prev => prev + 1);

      toast({
        title: 'Sucesso',
        description: 'Registro financeiro criado com sucesso'
      });

      return { data, success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao criar registro financeiro');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const updateFinanceiro = useCallback(async (id: string, updates: FinanceiroUpdate): Promise<ApiResponse<FinanceiroRow>> => {
    try {
      if (updates.tenant_id && updates.tenant_id !== tenantId) {
        throw new Error('Não é possível alterar o tenant_id');
      }

      const { data, error: supabaseError } = await supabase
        .from('financeiro')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setFinanceiro(prev => prev.map(f => f.id === id ? data : f));

      toast({
        title: 'Sucesso',
        description: 'Registro financeiro atualizado com sucesso'
      });

      return { data, success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao atualizar registro financeiro');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const deleteFinanceiro = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error: supabaseError } = await supabase
        .from('financeiro')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (supabaseError) throw supabaseError;

      setFinanceiro(prev => prev.filter(f => f.id !== id));
      setTotal(prev => prev - 1);

      toast({
        title: 'Sucesso',
        description: 'Registro financeiro removido com sucesso'
      });

      return { success: true };
    } catch (err) {
      const errorMessage = handleError(err, 'Erro ao remover registro financeiro');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [tenantId, toast]);

  const refreshFinanceiro = useCallback(() => {
    return loadFinanceiro();
  }, [loadFinanceiro]);

  useEffect(() => {
    if (tenantId && isValidUUID(tenantId)) {
      loadFinanceiro();
    }
  }, [tenantId, loadFinanceiro]);

  return {
    financeiro,
    loading,
    error,
    total,
    createFinanceiro,
    updateFinanceiro,
    deleteFinanceiro,
    refreshFinanceiro
  };
};
