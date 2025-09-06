import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface ChartDataPoint {
  name: string;
  receita: number;
  despesas: number;
  saldo: number;
}

export interface FinancialChartData {
  chartData: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

export const useFinancialChartData = (tenantId: string): FinancialChartData => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    if (!tenantId) {
      setError('Tenant ID é obrigatório');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar transações dos últimos 6 meses agrupadas por mês
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('transaction_date', sixMonthsAgo.toISOString())
        .order('transaction_date', { ascending: true });

      if (transactionsError) {
        throw new Error(`Erro ao buscar transações: ${transactionsError.message}`);
      }

      // Agrupar dados por mês
      const monthlyData = new Map<string, { receita: number; despesas: number }>();

      // Inicializar últimos 6 meses com valores zero
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        }).replace('.', '');
        
        monthlyData.set(monthKey, { receita: 0, despesas: 0 });
      }

      // Processar transações
      transactions?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthKey = date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        }).replace('.', '');

        const existing = monthlyData.get(monthKey) || { receita: 0, despesas: 0 };
        
        if (transaction.type === 'income') {
          existing.receita += transaction.net_amount || 0;
        } else if (transaction.type === 'expense') {
          existing.despesas += Math.abs(transaction.net_amount || 0);
        }
        
        monthlyData.set(monthKey, existing);
      });

      // Converter para array de ChartDataPoint
      const chartDataArray: ChartDataPoint[] = Array.from(monthlyData.entries()).map(
        ([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalizar primeira letra
          receita: data.receita,
          despesas: data.despesas,
          saldo: data.receita - data.despesas
        })
      );

      setChartData(chartDataArray);
    } catch (err) {
      console.error('Erro ao buscar dados do gráfico financeiro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const refreshData = useCallback(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return {
    chartData,
    loading,
    error,
    refreshData
  };
};
