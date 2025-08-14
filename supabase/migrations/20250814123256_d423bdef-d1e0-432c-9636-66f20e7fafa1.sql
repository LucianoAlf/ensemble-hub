-- Drop existing views that have naming conflicts
DROP VIEW IF EXISTS public.vw_bandas_lista CASCADE;
DROP VIEW IF EXISTS public.vw_eventos_proximos CASCADE;
DROP VIEW IF EXISTS public.vw_bandas_ativas CASCADE;
DROP VIEW IF EXISTS public.vw_proximos_eventos CASCADE;

-- Create core tables for the music hub system
CREATE TABLE IF NOT EXISTS public.banda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  unidade_id UUID,
  nome TEXT NOT NULL,
  genero TEXT,
  descricao TEXT,
  logo_url TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  unidade_id UUID,
  banda_id UUID REFERENCES public.banda(id),
  sala_id UUID,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'show',
  status TEXT DEFAULT 'agendado',
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE,
  local TEXT,
  endereco TEXT,
  orcamento DECIMAL(10,2),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banda_membro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banda_id UUID REFERENCES public.banda(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  papel TEXT DEFAULT 'membro',
  instrumento TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(banda_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  evento_id UUID REFERENCES public.evento(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_transacao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.banda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banda_membro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view bands from their tenant" ON public.banda;
DROP POLICY IF EXISTS "Users can create bands in their tenant" ON public.banda;
DROP POLICY IF EXISTS "Users can update bands in their tenant" ON public.banda;
DROP POLICY IF EXISTS "Users can view events from their tenant" ON public.evento;
DROP POLICY IF EXISTS "Users can create events in their tenant" ON public.evento;
DROP POLICY IF EXISTS "Users can update events in their tenant" ON public.evento;

-- Create RLS policies
CREATE POLICY "Users can view bands from their tenant" ON public.banda
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = banda.tenant_id
    )
  );

CREATE POLICY "Users can create bands in their tenant" ON public.banda
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = banda.tenant_id
    )
  );

CREATE POLICY "Users can update bands in their tenant" ON public.banda
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = banda.tenant_id
    )
  );

CREATE POLICY "Users can view events from their tenant" ON public.evento
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = evento.tenant_id
    )
  );

CREATE POLICY "Users can create events in their tenant" ON public.evento
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = evento.tenant_id
    )
  );

CREATE POLICY "Users can update events in their tenant" ON public.evento
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = evento.tenant_id
    )
  );

-- Create update triggers
DROP TRIGGER IF EXISTS update_banda_updated_at ON public.banda;
DROP TRIGGER IF EXISTS update_evento_updated_at ON public.evento;

CREATE TRIGGER update_banda_updated_at
  BEFORE UPDATE ON public.banda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evento_updated_at
  BEFORE UPDATE ON public.evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate views with correct structure
CREATE VIEW public.vw_bandas_lista AS
SELECT 
  b.id,
  b.tenant_id,
  b.unidade_id,
  b.nome,
  b.genero,
  b.descricao,
  b.logo_url,
  b.ativa,
  b.created_at,
  COUNT(bm.id) as membros_count
FROM public.banda b
LEFT JOIN public.banda_membro bm ON b.id = bm.banda_id AND bm.ativo = true
GROUP BY b.id, b.tenant_id, b.unidade_id, b.nome, b.genero, b.descricao, b.logo_url, b.ativa, b.created_at;

CREATE VIEW public.vw_eventos_proximos AS
SELECT 
  e.id,
  e.tenant_id,
  e.unidade_id,
  e.banda_id,
  e.sala_id,
  e.titulo,
  e.tipo,
  e.status,
  e.inicio,
  e.fim,
  e.local,
  e.endereco,
  e.orcamento,
  e.descricao,
  e.created_at,
  b.nome as banda_nome
FROM public.evento e
LEFT JOIN public.banda b ON e.banda_id = b.id
WHERE e.inicio >= now()
ORDER BY e.inicio;

CREATE VIEW public.vw_bandas_ativas AS
SELECT 
  tenant_id,
  unidade_id,
  COUNT(*) as total_ativas
FROM public.banda
WHERE ativa = true
GROUP BY tenant_id, unidade_id;

CREATE VIEW public.vw_proximos_eventos AS
SELECT 
  tenant_id,
  unidade_id,
  COUNT(*) as total_proximos
FROM public.evento
WHERE inicio >= now()
GROUP BY tenant_id, unidade_id;