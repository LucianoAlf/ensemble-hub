import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Unidade } from '@/types/banda';

interface UseUnidadesReturn {
  unidades: Unidade[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUnidades(): UseUnidadesReturn {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnidades = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('unidade')
        .select('*')
        .order('nome');

      if (fetchError) {
        throw fetchError;
      }

      setUnidades(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar unidades';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar unidades",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  return {
    unidades,
    isLoading,
    error,
    refetch: fetchUnidades,
  };
}
