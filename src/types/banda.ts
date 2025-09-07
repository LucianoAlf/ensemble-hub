// Tipos para o sistema de bandas com unidades e categorias
export interface Unidade {
  id: string;
  nome: string;
  created_at: string;
}

export interface Banda {
  id: string;
  tenant_id: string;
  unidade_id: string | null;
  nome: string;
  genero: string | null;
  categoria: 'kids' | 'teen' | 'adulto' | null;
  descricao: string | null;
  logo_url: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  unidade?: Unidade;
}

export interface BandaFormData {
  nome: string;
  genero: string;
  categoria: 'kids' | 'teen' | 'adulto';
  unidade_id: string;
  descricao?: string;
  logo_url?: string;
  ativa?: boolean;
}

// Tipos para métricas da dashboard
export interface UnidadeMetrics {
  unidade_id: string;
  unidade_nome: string;
  total_bandas: number;
  bandas_ativas: number;
  bandas_por_categoria: {
    kids: number;
    teen: number;
    adulto: number;
  };
}

export interface CategoriaMetrics {
  categoria: 'kids' | 'teen' | 'adulto';
  total_bandas: number;
  distribuicao_por_unidade: {
    [unidade_nome: string]: number;
  };
}

// Tipos para os gráficos da dashboard
export interface UnidadeChartData {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface CategoriaChartData {
  categoria: string;
  "Campo Grande": number;
  "Recreio": number;
  "Barra": number;
  total: number;
}
