/**
 * Hook para buscar dados financeiros reais da tabela transactions
 * Real financial data hook for transactions table
 */

import { useState, useEffect, useCallback } from 'react';
import { realFinancialService } from '@/services/realFinancialService';
import type { 
  FinancialSummary, 
  UpcomingPayment, 
  RecentEvent 
} from '@/services/realFinancialService';
import { useToast } from '@/hooks/use-toast';
import { supabaseWithTimeout as supabase } from '@/lib/supabase-with-timeout';

export interface UseRealFinancialDataReturn {
  // Data
  summary: FinancialSummary | null;
  upcomingPayments: UpcomingPayment[];
  recentEvents: RecentEvent[];
  
  // Loading states
  loading: boolean;
  summaryLoading: boolean;
  paymentsLoading: boolean;
  eventsLoading: boolean;
  
  // Error states
  error: string | null;
  summaryError: string | null;
  paymentsError: string | null;
  eventsError: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshEvents: () => Promise<void>;
}

/**
 * Hook principal para dados financeiros reais
 */
export const useRealFinancialData = (tenantId: string): UseRealFinancialDataReturn => {
  // Debug básico apenas
  console.log('useRealFinancialData iniciado com tenantId:', tenantId);

  // Estados dos dados
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  
  // Estados de loading
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  
  // Estados de erro
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Loading geral
  const loading = summaryLoading || paymentsLoading || eventsLoading;
  
  // Erro geral
  const error = summaryError || paymentsError || eventsError;

  /**
   * Busca resumo financeiro
   */
  const refreshSummary = useCallback(async () => {
    console.log('🔍 refreshSummary iniciado');
    console.log('1) tenantId recebido:', tenantId);
    
    if (!tenantId) {
      console.log('❌ tenantId não fornecido');
      setSummaryError('Tenant ID é obrigatório');
      setSummaryLoading(false);
      return;
    }

    try {
      setSummaryLoading(true);
      setSummaryError(null);
      
      console.log('2) Chamando realFinancialService.getFinancialSummary com tenantId:', tenantId);
      const summaryData = await realFinancialService.getFinancialSummary(tenantId);
      console.log('3) Dados retornados do realFinancialService:', summaryData);
      
      setSummary(summaryData);
      console.log('✅ Summary atualizado com sucesso');
    } catch (err) {
      console.log('4) Erro capturado em refreshSummary:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar resumo financeiro';
      setSummaryError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSummaryLoading(false);
      console.log('🏁 refreshSummary finalizado');
    }
  }, [tenantId, toast]);

  /**
   * Busca pagamentos próximos
   */
  const refreshPayments = useCallback(async () => {
    console.log('💳 refreshPayments iniciado');
    console.log('1) tenantId recebido:', tenantId);
    
    if (!tenantId) {
      console.log('❌ tenantId não fornecido para payments');
      setPaymentsError('Tenant ID é obrigatório');
      setPaymentsLoading(false);
      return;
    }

    try {
      setPaymentsLoading(true);
      setPaymentsError(null);
      
      console.log('2) Chamando realFinancialService.getUpcomingPayments com tenantId:', tenantId);
      const paymentsData = await realFinancialService.getUpcomingPayments(tenantId);
      console.log('3) Dados de payments retornados:', paymentsData);
      
      setUpcomingPayments(paymentsData);
      console.log('✅ Payments atualizados com sucesso');
    } catch (err) {
      console.log('4) Erro capturado em refreshPayments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pagamentos';
      setPaymentsError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setPaymentsLoading(false);
      console.log('🏁 refreshPayments finalizado');
    }
  }, [tenantId, toast]);

  /**
   * Busca eventos recentes
   */
  const refreshEvents = useCallback(async () => {
    console.log('📅 refreshEvents iniciado');
    console.log('1) tenantId recebido:', tenantId);
    
    if (!tenantId) {
      console.log('❌ tenantId não fornecido para events');
      setEventsError('Tenant ID é obrigatório');
      setEventsLoading(false);
      return;
    }

    try {
      setEventsLoading(true);
      setEventsError(null);
      
      console.log('2) Chamando realFinancialService.getRecentEvents com tenantId:', tenantId);
      const eventsData = await realFinancialService.getRecentEvents(tenantId);
      console.log('3) Dados de events retornados:', eventsData);
      
      setRecentEvents(eventsData);
      console.log('✅ Events atualizados com sucesso');
    } catch (err) {
      console.log('4) Erro capturado em refreshEvents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar eventos recentes';
      setEventsError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setEventsLoading(false);
      console.log('🏁 refreshEvents finalizado');
    }
  }, [tenantId, toast]);

  /**
   * Atualiza todos os dados
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      refreshSummary(),
      refreshPayments(),
      refreshEvents()
    ]);
  }, [refreshSummary, refreshPayments, refreshEvents]);

  // Carrega dados iniciais
  useEffect(() => {
    if (tenantId) {
      refreshData();
    }
  }, [tenantId, refreshData]);

  return {
    // Data
    summary,
    upcomingPayments,
    recentEvents,
    
    // Loading states
    loading,
    summaryLoading,
    paymentsLoading,
    eventsLoading,
    
    // Error states
    error,
    summaryError,
    paymentsError,
    eventsError,
    
    // Actions
    refreshData,
    refreshSummary,
    refreshPayments,
    refreshEvents
  };
};

/**
 * Hook simplificado apenas para o resumo financeiro
 */
export const useFinancialSummary = (tenantId: string) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadSummary = useCallback(async () => {
    if (!tenantId) {
      setError('Tenant ID é obrigatório');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const summaryData = await realFinancialService.getFinancialSummary(tenantId);
      setSummary(summaryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar resumo financeiro';
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

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary
  };
};

export default useRealFinancialData;