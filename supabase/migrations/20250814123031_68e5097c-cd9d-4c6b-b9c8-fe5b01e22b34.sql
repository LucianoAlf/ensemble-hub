-- Create core tables for the music hub system

-- 1. Create banda table with all required fields
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

-- 2. Create evento table with all required fields
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

-- 3. Create banda_membro table for member management
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

-- 4. Create financeiro table for budget/revenue tracking
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

-- Create RLS policies for banda
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

-- Create RLS policies for evento
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

-- Create RLS policies for banda_membro
CREATE POLICY "Users can view band members from their tenant" ON public.banda_membro
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.banda b 
      JOIN public.profiles p ON p.tenant_id = b.tenant_id
      WHERE b.id = banda_membro.banda_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage band members in their tenant" ON public.banda_membro
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.banda b 
      JOIN public.profiles p ON p.tenant_id = b.tenant_id
      WHERE b.id = banda_membro.banda_id AND p.id = auth.uid()
    )
  );

-- Create RLS policies for financeiro
CREATE POLICY "Users can view financial data from their tenant" ON public.financeiro
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = financeiro.tenant_id
    )
  );

CREATE POLICY "Users can manage financial data in their tenant" ON public.financeiro
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = financeiro.tenant_id
    )
  );

-- Create update triggers
CREATE TRIGGER update_banda_updated_at
  BEFORE UPDATE ON public.banda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evento_updated_at
  BEFORE UPDATE ON public.evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create or replace updated views
CREATE OR REPLACE VIEW public.vw_bandas_lista AS
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

CREATE OR REPLACE VIEW public.vw_eventos_proximos AS
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

-- Create functions for frontend operations
CREATE OR REPLACE FUNCTION public.create_banda(
  p_nome TEXT,
  p_genero TEXT DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  genero TEXT,
  descricao TEXT,
  logo_url TEXT,
  members_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_banda_id UUID;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User must have a tenant_id to create bands';
  END IF;
  
  -- Insert new banda
  INSERT INTO public.banda (tenant_id, nome, genero, descricao, logo_url)
  VALUES (v_tenant_id, p_nome, p_genero, p_descricao, p_logo_url)
  RETURNING banda.id INTO v_banda_id;
  
  -- Add creator as band member
  INSERT INTO public.banda_membro (banda_id, user_id, papel)
  VALUES (v_banda_id, auth.uid(), 'criador');
  
  -- Return the created band data
  RETURN QUERY
  SELECT 
    b.id,
    b.nome,
    b.genero,
    b.descricao,
    b.logo_url,
    COUNT(bm.id) as members_count
  FROM public.banda b
  LEFT JOIN public.banda_membro bm ON b.id = bm.banda_id AND bm.ativo = true
  WHERE b.id = v_banda_id
  GROUP BY b.id, b.nome, b.genero, b.descricao, b.logo_url;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_evento(
  p_titulo TEXT,
  p_tipo TEXT,
  p_inicio TIMESTAMP WITH TIME ZONE,
  p_local TEXT DEFAULT NULL,
  p_banda_id UUID DEFAULT NULL,
  p_orcamento DECIMAL DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  titulo TEXT,
  tipo TEXT,
  inicio TIMESTAMP WITH TIME ZONE,
  local TEXT,
  banda_nome TEXT,
  orcamento DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_evento_id UUID;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User must have a tenant_id to create events';
  END IF;
  
  -- Insert new evento
  INSERT INTO public.evento (tenant_id, titulo, tipo, inicio, local, banda_id, orcamento, descricao)
  VALUES (v_tenant_id, p_titulo, p_tipo, p_inicio, p_local, p_banda_id, p_orcamento, p_descricao)
  RETURNING evento.id INTO v_evento_id;
  
  -- Return the created event data
  RETURN QUERY
  SELECT 
    e.id,
    e.titulo,
    e.tipo,
    e.inicio,
    e.local,
    b.nome as banda_nome,
    e.orcamento
  FROM public.evento e
  LEFT JOIN public.banda b ON e.banda_id = b.id
  WHERE e.id = v_evento_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSON;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RETURN '{"error": "User must have a tenant_id"}'::JSON;
  END IF;
  
  SELECT json_build_object(
    'active_bands', (
      SELECT COUNT(*) FROM public.banda 
      WHERE tenant_id = v_tenant_id AND ativa = true
    ),
    'upcoming_events', (
      SELECT COUNT(*) FROM public.evento 
      WHERE tenant_id = v_tenant_id AND inicio >= now()
    ),
    'total_members', (
      SELECT COUNT(DISTINCT bm.user_id) FROM public.banda_membro bm
      JOIN public.banda b ON bm.banda_id = b.id
      WHERE b.tenant_id = v_tenant_id AND bm.ativo = true
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(valor), 0) FROM public.financeiro
      WHERE tenant_id = v_tenant_id 
      AND tipo = 'receita'
      AND DATE_TRUNC('month', data_transacao) = DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;