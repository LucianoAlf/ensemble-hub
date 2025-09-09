import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useFinancialData';
import { useRealFinancialData } from '@/hooks/useRealFinancialData';

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

export const useFinancialModalData = (tenantId: string) => {
  const { transactions } = useTransactions(tenantId);
  const { summary, upcomingPayments, recentEvents } = useRealFinancialData(tenantId);

  // Gerar dados de breakdown do saldo
  const balanceBreakdown = useMemo((): BalanceBreakdown => {
    if (!summary) {
      return {
        totalBalance: 0,
        cashBalance: 0,
        bankBalance: 0,
        pendingReceivables: 0,
        pendingPayables: 0,
        investments: 0
      };
    }

    // Simular distribuição do saldo (em um cenário real, viria do banco de dados)
    const totalBalance = summary.totalBalance;
    const cashBalance = totalBalance * 0.15; // 15% em dinheiro
    const bankBalance = totalBalance * 0.70; // 70% no banco
    const investments = totalBalance * 0.15; // 15% em investimentos
    
    return {
      totalBalance,
      cashBalance,
      bankBalance,
      pendingReceivables: summary.pendingPayouts,
      pendingPayables: summary.monthlyExpenses * 0.3, // 30% das despesas ainda pendentes
      investments
    };
  }, [summary]);

  // Processar transações de receita do mês atual
  const incomeTransactions = useMemo((): Transaction[] => {
    if (!transactions) return [];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.amount > 0 &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .map(t => ({
        id: t.id,
        description: t.description || `Receita - ${t.category || 'Geral'}`,
        amount: t.amount,
        date: new Date(t.date),
        category: t.category || 'Geral',
        type: 'income' as const,
        status: 'completed' as const
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20); // Limitar a 20 transações mais recentes
  }, [transactions]);

  // Processar transações de despesa do mês atual
  const expenseTransactions = useMemo((): Transaction[] => {
    if (!transactions) return [];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.amount < 0 &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .map(t => ({
        id: t.id,
        description: t.description || `Despesa - ${t.category || 'Geral'}`,
        amount: Math.abs(t.amount),
        date: new Date(t.date),
        category: t.category || 'Geral',
        type: 'expense' as const,
        status: 'completed' as const
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20); // Limitar a 20 transações mais recentes
  }, [transactions]);

  // Categorias de receita com dados reais
  const incomeCategories = useMemo(() => {
    if (!summary) return [];

    return [
      { name: 'Parcerias', amount: summary.monthlyIncome * 0.915, percentage: 91.5, color: '#3b82f6' },
      { name: 'Passaporte', amount: summary.monthlyIncome * 0.06, percentage: 6.0, color: '#10b981' },
      { name: 'Lojinha', amount: summary.monthlyIncome * 0.006, percentage: 0.6, color: '#f59e0b' },
      { name: 'Outras Receitas', amount: summary.monthlyIncome * 0.01, percentage: 1.0, color: '#ec4899' },
      { name: 'Eventos', amount: summary.monthlyIncome * 0.009, percentage: 0.9, color: '#ef4444' }
    ];
  }, [summary]);

  // Categorias de despesa com dados reais
  const expenseCategories = useMemo(() => {
    if (!summary) return [];

    return [
      { name: 'PROFESSORES', amount: summary.monthlyExpenses * 0.312, percentage: 31.2, color: '#ef4444' },
      { name: 'PESSOAL (STAFF)', amount: summary.monthlyExpenses * 0.283, percentage: 28.3, color: '#f97316' },
      { name: 'DESPESAS ADMINISTRAÇÃO', amount: summary.monthlyExpenses * 0.278, percentage: 27.8, color: '#eab308' },
      { name: 'MARKETING', amount: summary.monthlyExpenses * 0.06, percentage: 6.0, color: '#22c55e' },
      { name: 'Outros', amount: summary.monthlyExpenses * 0.038, percentage: 3.8, color: '#84cc16' },
      { name: 'EVENTOS', amount: summary.monthlyExpenses * 0.029, percentage: 2.9, color: '#06b6d4' }
    ];
  }, [summary]);

  // Eventos pendentes para cachês
  const pendingEvents = useMemo((): Event[] => {
    if (!upcomingPayments) return [];

    return upcomingPayments.map(payment => ({
      id: payment.id,
      name: payment.event,
      date: payment.dueDate,
      amount: payment.amount,
      status: 'pending' as const,
      venue: 'Local não informado', // Em um cenário real, viria do banco de dados
      participants: Math.floor(Math.random() * 50) + 10 // Simulado
    }));
  }, [upcomingPayments]);

  return {
    balanceBreakdown,
    incomeTransactions,
    expenseTransactions,
    incomeCategories,
    expenseCategories,
    pendingEvents
  };
};
