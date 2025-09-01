import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './use-toast';

// Configuração do Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

export interface Transaction {
  id: string;
  tenant_id: string;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  banda_id: string | null;
  evento_id: string | null;
  counterparty: string | null;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  status: 'pending' | 'scheduled' | 'settled';
  transaction_date: string;
  settled_at: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  tenant_id: string;
  evento_id: string;
  transaction_id: string | null;
  beneficiary_type: 'band' | 'member' | 'crew' | 'manager';
  beneficiary_name: string;
  beneficiary_id: string | null;
  amount: number;
  due_date: string;
  status: 'pending' | 'settled';
  payment_method: string | null;
  settled_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  pendingPayouts: number;
}

export const useFinancialData = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    pendingPayouts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar transações do Supabase
  const loadTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      throw err;
    }
  }, []);

  // Carregar payouts do Supabase
  const loadPayouts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao carregar payouts:', err);
      throw err;
    }
  }, []);

  // Carregar dados financeiros
  const loadFinancialData = useCallback(async () => {
     try {
      setLoading(true);
      setError(null);

      const [transactionsData, payoutsData] = await Promise.all([
        loadTransactions(),
        loadPayouts()
      ]);

      setTransactions(transactionsData);
      setPayouts(payoutsData);

      // Calcular resumo financeiro
      calculateSummary(transactionsData, payoutsData);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      setError('Falha ao carregar dados financeiros');
      toast({
        title: "Erro",
        description: "Falha ao carregar dados financeiros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, loadPayouts, toast]);

  // Calcular resumo financeiro
  const calculateSummary = (transactionsData: Transaction[], payoutsData: Payout[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyIncome = transactionsData
      .filter(t => {
        const date = new Date(t.transaction_date);
        return t.type === 'income' && 
               t.status === 'settled' &&
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.net_amount, 0);

    const monthlyExpenses = transactionsData
      .filter(t => {
        const date = new Date(t.transaction_date);
        return t.type === 'expense' && 
               t.status === 'settled' &&
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.net_amount, 0);

    const totalBalance = transactionsData
      .filter(t => t.status === 'settled')
      .reduce((sum, t) => {
        return t.type === 'income' ? sum + t.net_amount : sum - t.net_amount;
      }, 0);

    const pendingPayouts = payoutsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    setSummary({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      pendingPayouts
    });
  };

  // Atualizar transação
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Atualizar estado local
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...data } : t)
    );

    // Recalcular resumo
    const updatedTransactions = transactions.map(t => t.id === id ? { ...t, ...data } : t);
    calculateSummary(updatedTransactions, payouts);

    return data;
  };

  // Atualizar payout
  const updatePayout = async (id: string, updates: Partial<Payout>) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    const { data, error } = await supabase
      .from('payouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Atualizar estado local
    setPayouts(prev => 
      prev.map(p => p.id === id ? { ...p, ...data } : p)
    );

    // Recalcular resumo
    const updatedPayouts = payouts.map(p => p.id === id ? { ...p, ...data } : p);
    calculateSummary(transactions, updatedPayouts);

    return data;
  };

  // Criar nova transação
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'net_amount'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;

    // Atualizar estado local
    setTransactions(prev => [data, ...prev]);
    calculateSummary([data, ...transactions], payouts);

    return data;
  };

  // Criar novo payout
  const createPayout = async (payout: Omit<Payout, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('payouts')
      .insert(payout)
      .select()
      .single();

    if (error) throw error;

    // Atualizar estado local
    setPayouts(prev => [...prev, data]);
    calculateSummary(transactions, [...payouts, data]);

    return data;
  };

  // Deletar transação
  const deleteTransaction = async (id: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Atualizar estado local
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    calculateSummary(updatedTransactions, payouts);
  };

  // Deletar payout
  const deletePayout = async (id: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    const { error } = await supabase
      .from('payouts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Atualizar estado local
    const updatedPayouts = payouts.filter(p => p.id !== id);
    setPayouts(updatedPayouts);
    calculateSummary(transactions, updatedPayouts);
  };

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  return {
    transactions,
    payouts,
    summary,
    loading,
    error,
    updateTransaction,
    updatePayout,
    createTransaction,
    createPayout,
    deleteTransaction,
    deletePayout,
    refreshData: loadFinancialData
  };
};