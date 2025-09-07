import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

interface BandaData {
  nome: string;
  unidade: string;
  categoria: string;
  descricao?: string;
  membros_count: number;
}

interface EventoData {
  titulo: string;
  tipo: string;
  inicio: string;
  local?: string;
  endereco?: string;
  orcamento?: number;
}

interface MembroData {
  nome: string;
  telefone?: string;
  instrumento?: string;
  banda?: string;
}

interface ReceitaData {
  origem: string;
  valor: number;
  data: string;
  descricao?: string;
}

interface DespesaData {
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
}

export interface StatCardModalData {
  bandas?: BandaData[];
  eventos?: EventoData[];
  membros?: MembroData[];
  receitas?: ReceitaData[];
  despesas?: DespesaData[];
  total?: number;
}

export function useStatCardData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBandasData = async (): Promise<StatCardModalData> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('vw_bandas_lista')
        .select('nome, genero, descricao, membros_count')
        .eq('ativa', true);

      if (error) throw error;

      // Mock data para unidades e categorias até ter os dados reais
      const bandasWithDetails = data?.map(banda => ({
        nome: banda.nome,
        unidade: ['Campo Grande', 'Recreio', 'Barra'][Math.floor(Math.random() * 3)],
        categoria: ['Kids', 'Teen', 'Adulto'][Math.floor(Math.random() * 3)],
        descricao: banda.descricao,
        membros_count: banda.membros_count || 0
      })) || [];

      return { bandas: bandasWithDetails };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar bandas');
      return { bandas: [] };
    } finally {
      setLoading(false);
    }
  };

  const fetchEventosData = async (): Promise<StatCardModalData> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('evento')
        .select('titulo, tipo, inicio, local, endereco, orcamento')
        .gte('inicio', new Date().toISOString())
        .order('inicio', { ascending: true });

      if (error) throw error;

      return { eventos: data || [] };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
      return { eventos: [] };
    } finally {
      setLoading(false);
    }
  };

  const fetchMembrosData = async (): Promise<StatCardModalData> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('banda_integrante')
        .select(`
          nome,
          telefone,
          instrumento,
          banda_id,
          banda!banda_integrante_banda_id_fkey (
            nome
          )
        `);

      if (error) throw error;

      const membros = data?.map((membro: any) => ({
        nome: membro.nome,
        telefone: membro.telefone,
        instrumento: membro.instrumento,
        banda: membro.banda?.nome || 'Sem banda'
      })) || [];

      return { membros };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
      return { membros: [] };
    } finally {
      setLoading(false);
    }
  };

  const fetchReceitasData = async (): Promise<StatCardModalData> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('description, gross_amount, created_at, category')
        .eq('type', 'income')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const receitas = data?.map(receita => ({
        origem: receita.category || 'Receita',
        valor: receita.gross_amount,
        data: new Date(receita.created_at).toLocaleDateString('pt-BR'),
        descricao: receita.description
      })) || [];

      const total = receitas.reduce((sum, receita) => sum + receita.valor, 0);

      return { receitas, total };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar receitas');
      return { receitas: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  const fetchDespesasData = async (): Promise<StatCardModalData> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('description, gross_amount, created_at, category')
        .eq('type', 'expense')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const despesas = data?.map(despesa => ({
        descricao: despesa.description,
        valor: despesa.gross_amount,
        data: new Date(despesa.created_at).toLocaleDateString('pt-BR'),
        categoria: despesa.category || 'Despesa'
      })) || [];

      const total = despesas.reduce((sum, despesa) => sum + despesa.valor, 0);

      return { despesas, total };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar despesas');
      return { despesas: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchBandasData,
    fetchEventosData,
    fetchMembrosData,
    fetchReceitasData,
    fetchDespesasData,
    loading,
    error
  };
}
