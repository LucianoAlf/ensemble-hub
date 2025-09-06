/**
 * Serviço centralizado para cálculos financeiros
 * Centralizes all financial calculation logic to ensure consistency across the application
 */

import type { Database } from '../integrations/supabase/types';
import {
  FinancialTransaction,
  FinancialPayout,
  DashboardMetrics,
  CategorySummary,
  MonthlyEvolution,
  sumTransactions,
  filterTransactionsByType,
  filterTransactionsByDateRange,
  calculatePercentage
} from '../types/financial';

export class FinancialCalculationService {
  /**
   * Calcula métricas do dashboard baseado em transações e payouts
   */
  static calculateDashboardMetrics(
    transactions: FinancialTransaction[],
    payouts: FinancialPayout[]
  ): DashboardMetrics {
    // Filtrar transações por tipo
    const incomeTransactions = filterTransactionsByType(transactions, 'income');
    const expenseTransactions = filterTransactionsByType(transactions, 'expense');
    
    // Calcular totais
    const totalIncome = sumTransactions(incomeTransactions);
    const totalExpense = sumTransactions(expenseTransactions);
    const netAmount = totalIncome - totalExpense;
    
    // Calcular payouts pendentes (incluir na contabilidade)
    const pendingPayouts = payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Payouts liquidados devem ser contabilizados como despesas
    const settledPayouts = payouts
      .filter(p => p.status === 'settled')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Calcular métricas mensais (mês atual)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyIncomeTransactions = filterTransactionsByType(currentMonthTransactions, 'income');
    const monthlyExpenseTransactions = filterTransactionsByType(currentMonthTransactions, 'expense');
    
    const monthlyIncome = sumTransactions(monthlyIncomeTransactions);
    const monthlyExpenses = sumTransactions(monthlyExpenseTransactions);
    
    const result = {
      totalIncome,
      totalExpense,
      netAmount,
      pendingPayouts,
      totalTransactions: transactions.length,
      monthlyIncome,
      monthlyExpenses,
      totalBalance: netAmount
    };
    
    console.log('✅ [calculateDashboardMetrics] Resultado final das métricas:', JSON.stringify(result, null, 2));
    
    return result;
  }
  
  /**
   * Calcula resumo por categoria
   */
  static calculateCategorySummary(
    transactions: FinancialTransaction[],
    type?: 'income' | 'expense'
  ): CategorySummary[] {
    // Filtrar por tipo se especificado
    const filteredTransactions = type 
      ? filterTransactionsByType(transactions, type)
      : transactions;
    
    // Agrupar por categoria
    const categoryGroups = filteredTransactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Outros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
      return groups;
    }, {} as Record<string, FinancialTransaction[]>);
    
    // Calcular totais
    const totalAmount = sumTransactions(filteredTransactions);
    
    // Criar resumo por categoria
    return Object.entries(categoryGroups).map(([category, categoryTransactions]) => {
      const amount = sumTransactions(categoryTransactions);
      const percentage = calculatePercentage(amount, totalAmount);
      
      return {
        category,
        amount,
        percentage,
        count: categoryTransactions.length
      };
    }).sort((a, b) => b.amount - a.amount); // Ordenar por valor decrescente
  }
  
  /**
   * Calcula evolução mensal
   */
  static calculateMonthlyEvolution(
    transactions: FinancialTransaction[],
    monthsBack: number = 12
  ): MonthlyEvolution[] {
    const now = new Date();
    const months: MonthlyEvolution[] = [];
    
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Filtrar transações do mês
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === date.getFullYear() &&
               transactionDate.getMonth() === date.getMonth();
      });
      
      // Calcular totais do mês
      const incomeTransactions = filterTransactionsByType(monthTransactions, 'income');
      const expenseTransactions = filterTransactionsByType(monthTransactions, 'expense');
      
      const income = sumTransactions(incomeTransactions);
      const expenses = sumTransactions(expenseTransactions);
      const net = income - expenses;
      
      months.push({
        month: monthKey,
        income,
        expenses,
        net
      });
    }
    
    return months;
  }
  
  /**
   * Calcula estatísticas de transações
   */
  static calculateTransactionStats(transactions: FinancialTransaction[]) {
    if (transactions.length === 0) {
      return {
        averageAmount: 0,
        medianAmount: 0,
        maxAmount: 0,
        minAmount: 0,
        totalCount: 0,
        incomeCount: 0,
        expenseCount: 0
      };
    }
    
    const amounts = transactions.map(t => t.amount).sort((a, b) => a - b);
    const incomeTransactions = filterTransactionsByType(transactions, 'income');
    const expenseTransactions = filterTransactionsByType(transactions, 'expense');
    
    const totalAmount = sumTransactions(transactions);
    const averageAmount = totalAmount / transactions.length;
    
    const medianAmount = amounts.length % 2 === 0
      ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
      : amounts[Math.floor(amounts.length / 2)];
    
    return {
      averageAmount,
      medianAmount,
      maxAmount: Math.max(...amounts),
      minAmount: Math.min(...amounts),
      totalCount: transactions.length,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length
    };
  }
  
  /**
   * Calcula projeções financeiras baseadas em dados históricos
   */
  static calculateProjections(
    transactions: FinancialTransaction[],
    monthsToProject: number = 3
  ) {
    // Calcular médias dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentTransactions = filterTransactionsByDateRange(
      transactions,
      sixMonthsAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    
    const monthlyEvolution = this.calculateMonthlyEvolution(recentTransactions, 6);
    
    // Calcular médias
    const avgMonthlyIncome = monthlyEvolution.reduce((sum, month) => sum + month.income, 0) / monthlyEvolution.length;
    const avgMonthlyExpenses = monthlyEvolution.reduce((sum, month) => sum + month.expenses, 0) / monthlyEvolution.length;
    const avgMonthlyNet = avgMonthlyIncome - avgMonthlyExpenses;
    
    // Gerar projeções
    const projections = [];
    const now = new Date();
    
    for (let i = 1; i <= monthsToProject; i++) {
      const projectionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${projectionDate.getFullYear()}-${String(projectionDate.getMonth() + 1).padStart(2, '0')}`;
      
      projections.push({
        month: monthKey,
        projectedIncome: avgMonthlyIncome,
        projectedExpenses: avgMonthlyExpenses,
        projectedNet: avgMonthlyNet,
        confidence: Math.max(0.5, 1 - (i * 0.15)) // Confiança diminui com o tempo
      });
    }
    
    return {
      projections,
      baseMetrics: {
        avgMonthlyIncome,
        avgMonthlyExpenses,
        avgMonthlyNet
      }
    };
  }
  
  /**
   * Valida consistência de dados financeiros
   */
  static validateFinancialData(
    transactions: FinancialTransaction[],
    payouts: FinancialPayout[]
  ) {
    const issues: string[] = [];
    
    // Verificar transações com valores negativos
    const negativeAmountTransactions = transactions.filter(t => t.amount < 0);
    if (negativeAmountTransactions.length > 0) {
      issues.push(`${negativeAmountTransactions.length} transações com valores negativos encontradas`);
    }
    
    // Verificar transações sem categoria
    const uncategorizedTransactions = transactions.filter(t => !t.category || t.category.trim() === '');
    if (uncategorizedTransactions.length > 0) {
      issues.push(`${uncategorizedTransactions.length} transações sem categoria`);
    }
    
    // Verificar payouts com valores negativos
    const negativePayouts = payouts.filter(p => p.amount < 0);
    if (negativePayouts.length > 0) {
      issues.push(`${negativePayouts.length} payouts com valores negativos`);
    }
    
    // Verificar datas futuras
    const now = new Date();
    const futureTransactions = transactions.filter(t => new Date(t.date) > now);
    if (futureTransactions.length > 0) {
      issues.push(`${futureTransactions.length} transações com datas futuras`);
    }
    
    // Verificar inconsistências entre gross_amount e amount
    const inconsistentAmounts = transactions.filter(t => 
      t.gross_amount && t.amount && t.gross_amount < t.amount
    );
    if (inconsistentAmounts.length > 0) {
      issues.push(`${inconsistentAmounts.length} transações com gross_amount menor que amount`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      summary: {
        totalTransactions: transactions.length,
        totalPayouts: payouts.length,
        issuesFound: issues.length
      }
    };
  }
  
  /**
   * Valida se um valor monetário é válido
   */
  private static validateMonetaryValue(value: number | string | null | undefined, fieldName: string): number {
    if (value === null || value === undefined) {
      console.warn(`Null or undefined monetary value for ${fieldName}, defaulting to 0`);
      return 0;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue) || !isFinite(numValue)) {
      console.warn(`Invalid monetary value for ${fieldName}:`, value);
      return 0;
    }
    
    return numValue;
  }

  /**
   * Mapeia status do banco para status da aplicação
   * ATUALIZADO para usar status corretos do banco
   */
  private static mapDatabaseStatus(dbStatus: string | null): 'pending' | 'scheduled' | 'settled' {
    if (!dbStatus) return 'pending';
    
    const statusMap: Record<string, 'pending' | 'scheduled' | 'settled'> = {
      'pending': 'pending',
      'scheduled': 'scheduled', 
      'settled': 'settled',
      // Mapeamentos de compatibilidade
      'completed': 'settled',
      'cancelled': 'pending', // Mapear cancelled para pending por enquanto
      'failed': 'pending'
    };
    
    return statusMap[dbStatus.toLowerCase()] || 'pending';
  }

  /**
   * Valida e normaliza dados de transação do banco de dados
   */
  private static validateTransactionData(t: Database['public']['Tables']['transactions']['Row']): Database['public']['Tables']['transactions']['Row'] {
    if (!t || typeof t !== 'object') {
      throw new Error('Invalid transaction object');
    }
    
    // Validações obrigatórias
    if (!t.id) {
      throw new Error('Transaction ID is required');
    }
    
    if (!t.tenant_id) {
      throw new Error('Tenant ID is required');
    }
    
    // Validar gross_amount (obrigatório no banco)
    const grossAmount = this.validateMonetaryValue(t.gross_amount, 'gross_amount');
    if (grossAmount === 0 && t.gross_amount !== 0) {
      console.warn('Transaction with invalid gross_amount:', t.id, t.gross_amount);
    }
    
    // Validar net_amount (opcional, pode ser calculado)
    const netAmount = this.validateMonetaryValue(t.net_amount, 'net_amount');
    
    // Validar tipo de transação - aceitar tanto inglês quanto português
    const validTypes = ['income', 'expense', 'receita', 'despesa'];
    let transactionType = t.type;
    
    if (t.type === 'receita') transactionType = 'income';
    else if (t.type === 'despesa') transactionType = 'expense';
    
    if (!validTypes.includes(t.type)) {
      console.warn(`Invalid transaction type: ${t.type}, defaulting to 'expense'`);
      transactionType = 'expense';
    }
    
    // Validar status usando o mapeamento correto
    const status = this.mapDatabaseStatus(t.status);
    
    return {
      ...t,
      gross_amount: grossAmount,
      net_amount: netAmount,
      type: transactionType,
      status: status
    };
  }

  /**
   * Converte dados da tabela transactions do banco para o formato padronizado
   * ATUALIZADO para usar campos corretos do banco
   */
  static convertDatabaseTransactions(dbTransactions: Database['public']['Tables']['transactions']['Row'][]): FinancialTransaction[] {
    console.log('🔄 [convertDatabaseTransactions] Convertendo transações do banco:', dbTransactions.length);
    
    if (!Array.isArray(dbTransactions)) {
      console.warn('convertDatabaseTransactions: Input is not an array:', dbTransactions);
      return [];
    }

    return dbTransactions.map(t => {
      try {
        // Validar dados antes da conversão
        const validatedTransaction = this.validateTransactionData(t);
        
        const converted: FinancialTransaction = {
          id: validatedTransaction.id,
          tenant_id: validatedTransaction.tenant_id,
          description: validatedTransaction.description || undefined,
          gross_amount: this.validateMonetaryValue(validatedTransaction.gross_amount, 'gross_amount'),
          fee_amount: this.validateMonetaryValue(validatedTransaction.fee_amount, 'fee_amount') || 0,
          net_amount: this.validateMonetaryValue(validatedTransaction.net_amount, 'net_amount'),
          type: validatedTransaction.type as 'income' | 'expense',
          category: validatedTransaction.category || 'Outros',
          transaction_date: validatedTransaction.transaction_date || new Date().toISOString().split('T')[0],
          status: this.mapDatabaseStatus(validatedTransaction.status),
          counterparty: validatedTransaction.counterparty || undefined,
          banda_id: validatedTransaction.banda_id || undefined,
          evento_id: validatedTransaction.evento_id || undefined,
          settled_at: validatedTransaction.settled_at || undefined,
          attachment_url: validatedTransaction.attachment_url || undefined,
          created_at: validatedTransaction.created_at || new Date().toISOString(),
          updated_at: validatedTransaction.updated_at || new Date().toISOString(),
          
          // Campos de compatibilidade (deprecated)
          amount: this.validateMonetaryValue(validatedTransaction.gross_amount, 'gross_amount'),
          date: validatedTransaction.transaction_date || new Date().toISOString().split('T')[0],
          payment_method: validatedTransaction.counterparty || undefined,
          notes: validatedTransaction.description || undefined
        };
        
        console.log('✅ [convertDatabaseTransactions] Transação convertida:', {
          id: converted.id,
          gross_amount: converted.gross_amount,
          type: converted.type,
          status: converted.status
        });
        
        return converted;
      } catch (error) {
        console.error('❌ [convertDatabaseTransactions] Erro ao converter transação:', error, t);
        throw error;
      }
    }).filter(Boolean) as FinancialTransaction[];
  }
  
  /**
   * Valida e normaliza dados de payout do banco de dados
   */
  private static validatePayoutData(p: Database['public']['Tables']['payouts']['Row']): Database['public']['Tables']['payouts']['Row'] {
    if (!p || typeof p !== 'object') {
      throw new Error('Invalid payout object');
    }
    
    // Validações obrigatórias
    if (!p.id) {
      throw new Error('Payout ID is required');
    }
    
    if (!p.tenant_id) {
      throw new Error('Tenant ID is required');
    }
    
    // Validar amount (obrigatório)
    const amount = this.validateMonetaryValue(p.amount, 'amount');
    if (amount === 0 && p.amount !== 0) {
      console.warn('Payout with invalid amount:', p.id, p.amount);
    }
    
    // Validar status
    if (p.status && !['pending', 'processing', 'completed', 'failed'].includes(p.status)) {
      console.warn(`Invalid payout status: ${p.status}, defaulting to 'pending'`);
    }
    
    return {
      ...p,
      amount: amount,
      status: ['pending', 'processing', 'completed', 'failed'].includes(p.status) ? p.status : 'pending'
    };
  }

  /**
   * Converte payouts do formato do banco para o formato padronizado
   */
  static convertDatabasePayouts(dbPayouts: Database['public']['Tables']['payouts']['Row'][]): FinancialPayout[] {
    if (!Array.isArray(dbPayouts)) {
      console.warn('convertDatabasePayouts: Input is not an array:', dbPayouts);
      return [];
    }

    return dbPayouts.map(p => {
      try {
        const validatedPayout = this.validatePayoutData(p);
        
        return {
          id: validatedPayout.id,
          tenant_id: validatedPayout.tenant_id,
          created_at: validatedPayout.created_at || new Date().toISOString(),
          updated_at: validatedPayout.updated_at || undefined,
          amount: validatedPayout.amount,
          description: validatedPayout.notes || `Cachê - ${validatedPayout.beneficiary_name}`,
          date: validatedPayout.due_date,
          processedDate: validatedPayout.settled_at || null,
          recipient: validatedPayout.beneficiary_name,
          type: 'payout' as const,
          reference_id: validatedPayout.evento_id || null,
          notes: validatedPayout.notes || undefined,
          evento_id: validatedPayout.evento_id,
          beneficiary_type: validatedPayout.beneficiary_type,
          beneficiary_name: validatedPayout.beneficiary_name,
          due_date: validatedPayout.due_date,
          status: validatedPayout.status,
          payment_method: validatedPayout.payment_method || null,
          settled_at: validatedPayout.settled_at || null,
          receipt_url: validatedPayout.receipt_url || null,
          beneficiary_id: validatedPayout.beneficiary_id || null
        } as FinancialPayout;
      } catch (error) {
        console.error('Error converting payout:', error, p);
        return null;
      }
    }).filter(Boolean) as FinancialPayout[];
  }
}

// Exportar instância singleton para uso direto
export const financialCalculations = FinancialCalculationService;

// Exportar funções utilitárias individuais para compatibilidade
export const {
  calculateDashboardMetrics,
  calculateCategorySummary,
  calculateMonthlyEvolution,
  calculateTransactionStats,
  calculateProjections,
  validateFinancialData,
  convertDatabaseTransactions,
  convertDatabasePayouts
} = FinancialCalculationService;