-- Fix security issues identified in the linter

-- 1. Add search_path to functions for security
-- Fix get_alunos_participantes function
DROP FUNCTION IF EXISTS public.get_alunos_participantes();
CREATE OR REPLACE FUNCTION public.get_alunos_participantes()
 RETURNS SETOF vw_alunos_participantes
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  select v.*
  from public.vw_alunos_participantes v
  join public.profiles p on p.id = auth.uid()
  where p.tenant_id is not null
    and v.tenant_id = p.tenant_id
$function$;

-- Fix create_banda function
DROP FUNCTION IF EXISTS public.create_banda(text, text, text, text);
CREATE OR REPLACE FUNCTION public.create_banda(p_nome text, p_genero text DEFAULT NULL::text, p_descricao text DEFAULT NULL::text, p_logo_url text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, nome text, genero text, descricao text, logo_url text, members_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Fix create_evento function
DROP FUNCTION IF EXISTS public.create_evento(text, text, timestamp with time zone, text, text, uuid[], numeric, text);
CREATE OR REPLACE FUNCTION public.create_evento(p_titulo text, p_tipo text, p_inicio timestamp with time zone, p_local text DEFAULT NULL::text, p_endereco text DEFAULT NULL::text, p_banda_ids uuid[] DEFAULT NULL::uuid[], p_orcamento numeric DEFAULT NULL::numeric, p_descricao text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, titulo text, tipo text, inicio timestamp with time zone, local text, endereco text, banda_nomes text[], orcamento numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_evento_id UUID;
  v_banda_id UUID;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User must have a tenant_id to create events';
  END IF;
  
  -- Insert new evento
  INSERT INTO public.evento (tenant_id, titulo, tipo, inicio, local, endereco, orcamento, descricao)
  VALUES (v_tenant_id, p_titulo, p_tipo, p_inicio, p_local, p_endereco, p_orcamento, p_descricao)
  RETURNING evento.id INTO v_evento_id;
  
  -- Insert banda relationships if provided
  IF p_banda_ids IS NOT NULL THEN
    FOREACH v_banda_id IN ARRAY p_banda_ids
    LOOP
      -- Verify banda belongs to same tenant
      IF EXISTS (
        SELECT 1 FROM public.banda 
        WHERE banda.id = v_banda_id AND banda.tenant_id = v_tenant_id
      ) THEN
        INSERT INTO public.evento_banda (evento_id, banda_id)
        VALUES (v_evento_id, v_banda_id);
      END IF;
    END LOOP;
  END IF;
  
  -- Return the created event data with band names
  RETURN QUERY
  SELECT 
    e.id,
    e.titulo,
    e.tipo,
    e.inicio,
    e.local,
    e.endereco,
    COALESCE(
      ARRAY_AGG(b.nome) FILTER (WHERE b.nome IS NOT NULL),
      ARRAY[]::text[]
    ) as banda_nomes,
    e.orcamento
  FROM public.evento e
  LEFT JOIN public.evento_banda eb ON e.id = eb.evento_id
  LEFT JOIN public.banda b ON eb.banda_id = b.id
  WHERE e.id = v_evento_id
  GROUP BY e.id, e.titulo, e.tipo, e.inicio, e.local, e.endereco, e.orcamento;
END;
$function$;

-- Fix get_dashboard_metrics function
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;