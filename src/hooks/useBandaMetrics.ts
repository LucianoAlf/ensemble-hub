import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import type { UnidadeMetrics, CategoriaMetrics, UnidadeChartData, CategoriaChartData } from '@/types/banda';

interface UseBandaMetricsReturn {
  unidadeMetrics: UnidadeMetrics[];
  categoriaMetrics: CategoriaMetrics[];
  unidadeChartData: UnidadeChartData[];
  categoriaChartData: CategoriaChartData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Dados mockados para demonstração - estrutura preparada para integração real
const mockUnidadeChartData: UnidadeChartData[] = [
  { name: "Campo Grande", value: 40, count: 14, color: "#10b981" },
  { name: "Recreio", value: 25, count: 9, color: "#3b82f6" },
  { name: "Barra", value: 35, count: 12, color: "#f59e0b" }
];

const mockCategoriaChartData: CategoriaChartData[] = [
  {
    categoria: "Kids",
    "Campo Grande": 3,
    "Recreio": 2,
    "Barra": 3,
    total: 8
  },
  {
    categoria: "Teen", 
    "Campo Grande": 5,
    "Recreio": 3,
    "Barra": 4,
    total: 12
  },
  {
    categoria: "Adulto",
    "Campo Grande": 6,
    "Recreio": 4,
    "Barra": 5,
    total: 15
  }
];

export function useBandaMetrics(): UseBandaMetricsReturn {
  const [unidadeMetrics, setUnidadeMetrics] = useState<UnidadeMetrics[]>([]);
  const [categoriaMetrics, setCategoriaMetrics] = useState<CategoriaMetrics[]>([]);
  const [unidadeChartData, setUnidadeChartData] = useState<UnidadeChartData[]>(mockUnidadeChartData);
  const [categoriaChartData, setCategoriaChartData] = useState<CategoriaChartData[]>(mockCategoriaChartData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBandaMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        console.log('Usuário não autenticado, usando dados mockados');
        // Fallback para dados mockados se não autenticado
        setUnidadeChartData(mockUnidadeChartData);
        setCategoriaChartData(mockCategoriaChartData);
        return;
      }

      // Query real para distribuição por unidade
      const { data: unidadeData, error: unidadeError } = await supabase
        .from('unidade')
        .select(`
          id,
          nome,
          banda!inner(id, ativa)
        `)
        .eq('banda.ativa', true);

      if (unidadeError) {
        throw unidadeError;
      }

      // Processar dados de unidade
      const unidadeStats: Record<string, number> = unidadeData?.reduce((acc: Record<string, number>, unidade: any) => {
        const nome = unidade.nome.replace('Unidade ', ''); // Remove "Unidade" do nome
        const count = unidade.banda?.length || 0;
        acc[nome] = count;
        return acc;
      }, {}) || {};

      const totalBandas = Object.values(unidadeStats).reduce((sum: number, count: number) => sum + count, 0);

      // Cores para cada unidade
      const cores = {
        'Campo Grande': '#10b981',
        'Recreio': '#3b82f6', 
        'Barra': '#f59e0b'
      };

      const realUnidadeChartData: UnidadeChartData[] = Object.entries(unidadeStats).map(([nome, count]: [string, number]) => ({
        name: nome,
        value: totalBandas > 0 ? Math.round((count / totalBandas) * 100) : 0,
        count: count,
        color: cores[nome as keyof typeof cores] || '#6b7280'
      }));

      // Query para distribuição por categoria (usando dados mockados por enquanto, pois não temos campo categoria)
      // TODO: Implementar quando campo categoria for adicionado à tabela banda
      const realCategoriaChartData = mockCategoriaChartData;

      setUnidadeChartData(realUnidadeChartData);
      setCategoriaChartData(realCategoriaChartData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar métricas de bandas';
      setError(errorMessage);
      
      // Não mostrar toast para dados mockados
      if (!errorMessage.includes('mockado')) {
        toast({
          title: "Erro ao carregar métricas",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBandaMetrics();
  }, [user?.id]);

  return {
    unidadeMetrics,
    categoriaMetrics,
    unidadeChartData,
    categoriaChartData,
    isLoading,
    error,
    refetch: fetchBandaMetrics,
  };
}
