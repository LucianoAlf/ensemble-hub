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
        // Para desenvolvimento, não bloquear por usuário não autenticado
        console.log('Usuário não autenticado, usando dados mockados');
      }

      // Por enquanto, usar dados mockados
      // TODO: Implementar queries reais quando dados estiverem disponíveis
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300));

      // Usar dados mockados por enquanto
      setUnidadeChartData(mockUnidadeChartData);
      setCategoriaChartData(mockCategoriaChartData);

      // TODO: Implementar queries reais:
      /*
      const { data: bandas, error: bandasError } = await supabase
        .from('banda')
        .select(`
          id,
          categoria,
          unidade_id,
          ativa,
          unidade:unidade_id (
            id,
            nome
          )
        `)
        .eq('ativa', true);

      if (bandasError) {
        throw bandasError;
      }

      // Processar dados reais aqui quando disponível
      */

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
