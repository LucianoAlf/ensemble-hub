/**
 * Serviço para buscar dados reais da tabela transactions do Supabase
 * Real financial data service for Supabase transactions table
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  FinancialTransaction,
  FinancialPayout,
  DashboardMetrics
} from '@/types/financial';
import { financialCalculations } from './financialCalculationService';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Payout = Database['public']['Tables']['payouts']['Row'];

// Interface para compatibilidade com código existente
export interface FinancialSummary extends DashboardMetrics {
  uniqueCounterparties: number;
}

export interface UpcomingPayment {
  id: string;
  beneficiary: string;
  event: string;
  amount: number;
  dueDate: Date;
  type: 'musician' | 'service' | 'venue';
}

export interface RecentEvent {
  id: string;
  name: string;
  date: Date;
  income: number;
  expenses: number;
  result: number;
}

class RealFinancialService {
  /**
   * Busca resumo financeiro baseado nos dados reais da tabela transactions
   */
  async getFinancialSummary(tenantId: string): Promise<FinancialSummary> {
    console.log('🏦 realFinancialService.getFinancialSummary iniciado com tenantId:', tenantId);
    
    try {
      // Buscar transações
      console.log('📊 Buscando transações para tenantId:', tenantId);
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId);

      console.log('📊 Resultado transações:', { data: transactionsData, error: transactionsError });
      if (transactionsError) throw transactionsError;

      // Buscar payouts
      console.log('💰 Buscando payouts para tenantId:', tenantId);
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('tenant_id', tenantId);

      console.log('💰 Resultado payouts:', { data: payoutsData, error: payoutsError });
      if (payoutsError) throw payoutsError;

      // Converter para formato padronizado usando serviço centralizado
      console.log('🔄 Convertendo transações para formato padronizado...');
      const standardTransactions = financialCalculations.convertDatabaseTransactions(transactionsData || []);
      console.log('🔄 Transações convertidas:', standardTransactions);
      
      console.log('🔄 Convertendo payouts para formato padronizado...');
      const standardPayouts = financialCalculations.convertDatabasePayouts(payoutsData || []);
      console.log('🔄 Payouts convertidos:', standardPayouts);

      // Calcular métricas usando serviço centralizado
      console.log('📈 Calculando métricas do dashboard...');
      const metrics = financialCalculations.calculateDashboardMetrics(standardTransactions, standardPayouts);
      console.log('📈 Métricas calculadas:', metrics);

      // Calcular métricas adicionais específicas deste serviço
      const uniqueCounterparties = new Set(
        standardTransactions.map(t => t.description)
      ).size;
      console.log('👥 Contrapartes únicas:', uniqueCounterparties);

      const finalResult = {
        ...metrics,
        uniqueCounterparties
      };
      console.log('✅ Resultado final getFinancialSummary:', finalResult);
      
      return finalResult;
    } catch (error) {
      console.error('❌ Erro no getFinancialSummary:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  /**
   * Busca pagamentos próximos baseados nos payouts pendentes
   */
  async getUpcomingPayments(tenantId: string): Promise<UpcomingPayment[]> {
    console.log('💳 realFinancialService.getUpcomingPayments iniciado com tenantId:', tenantId);
    
    try {
      // Buscar payouts pendentes dos próximos 7 dias
      console.log('💳 Buscando payouts pendentes para tenantId:', tenantId);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: payouts, error } = await supabase
        .from('payouts')
        .select('*, evento:evento_id(titulo)')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      console.log('💳 Resultado busca payouts pendentes:', { data: payouts, error });
      if (error) {
        console.error('❌ Erro ao buscar payouts:', error);
        throw error;
      }

      if (!payouts) return [];

      // Converter payouts em pagamentos próximos
      const upcomingPayments = payouts.map((payout) => ({
        id: payout.id,
        beneficiary: payout.beneficiary_name,
        event: payout.evento?.titulo || 'Evento não especificado',
        amount: payout.amount,
        dueDate: new Date(payout.due_date),
        type: this.determinePaymentType(payout.beneficiary_type)
      }));
      
      console.log('✅ Pagamentos próximos processados:', upcomingPayments);
      return upcomingPayments;
    } catch (error) {
      console.error('❌ Erro no getUpcomingPayments:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return [];
    }
  }

  /**
   * Busca eventos recentes baseados nas transações
   */
  async getRecentEvents(tenantId: string): Promise<RecentEvent[]> {
    console.log('📅 realFinancialService.getRecentEvents iniciado com tenantId:', tenantId);
    
    try {
      console.log('📅 Buscando todas as transações para tenantId:', tenantId);
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('transaction_date', { ascending: false });

      console.log('📅 Resultado busca eventos:', { data: transactions, error });
      if (error) {
        console.error('❌ Erro ao buscar eventos:', error);
        throw error;
      }

      if (!transactions) return [];

      // Agrupar transações por evento (baseado na descrição)
      const eventGroups = new Map<string, Transaction[]>();
      
      transactions.forEach(transaction => {
        const eventKey = transaction.description || 'Evento sem nome';
        if (!eventGroups.has(eventKey)) {
          eventGroups.set(eventKey, []);
        }
        eventGroups.get(eventKey)!.push(transaction);
      });

      // Converter grupos em eventos recentes
      const recentEvents: RecentEvent[] = [];
      let eventId = 1;

      for (const [eventName, eventTransactions] of eventGroups) {
        if (recentEvents.length >= 3) break; // Limitar a 3 eventos

        const income = eventTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.gross_amount || 0), 0);

        const expenses = eventTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.gross_amount || 0), 0);

        const mostRecentDate = eventTransactions
          .map(t => new Date(t.transaction_date))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        recentEvents.push({
          id: eventId.toString(),
          name: eventName,
          date: mostRecentDate,
          income,
          expenses,
          result: income - expenses
        });

        eventId++;
      }

      console.log('✅ Eventos recentes processados:', recentEvents);
      return recentEvents;
    } catch (error) {
      console.error('❌ Erro no getRecentEvents:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return [];
    }
  }

  /**
   * Determina o tipo de pagamento baseado no tipo de beneficiário
   */
  private determinePaymentType(beneficiaryType: string): 'musician' | 'service' | 'venue' {
    const type = beneficiaryType.toLowerCase();
    
    if (type.includes('musician') || type.includes('músico') || type.includes('banda') || type.includes('artista')) {
      return 'musician';
    }
    
    if (type.includes('crew') || type.includes('técnico') || type.includes('som') || type.includes('luz') || type.includes('equipamento') || type.includes('service')) {
      return 'service';
    }
    
    if (type.includes('venue') || type.includes('local') || type.includes('espaço') || type.includes('aluguel')) {
      return 'venue';
    }
    
    return 'service'; // Default
  }

  /**
   * Busca todas as transações de um tenant
   */
  async getAllTransactions(tenantId: string): Promise<Transaction[]> {
    console.log('📋 realFinancialService.getAllTransactions iniciado com tenantId:', tenantId);
    
    try {
      console.log('📋 Buscando todas as transações para tenantId:', tenantId);
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('transaction_date', { ascending: false });

      console.log('📋 Resultado busca todas transações:', { data: transactions, error });
      if (error) {
        console.error('❌ Erro ao buscar todas as transações:', error);
        throw error;
      }

      console.log('✅ Todas as transações processadas:', transactions?.length || 0, 'transações');
      return transactions || [];
    } catch (error) {
      console.error('❌ Erro no getAllTransactions:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return [];
    }
  }
}

export const realFinancialService = new RealFinancialService();
export default realFinancialService;