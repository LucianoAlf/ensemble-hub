-- Fix search path security for create_evento function
CREATE OR REPLACE FUNCTION public.create_evento(
  p_titulo text, 
  p_tipo text, 
  p_inicio timestamp with time zone, 
  p_local text DEFAULT NULL::text, 
  p_endereco text DEFAULT NULL::text,
  p_banda_ids uuid[] DEFAULT NULL::uuid[],
  p_orcamento numeric DEFAULT NULL::numeric, 
  p_descricao text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, titulo text, tipo text, inicio timestamp with time zone, local text, endereco text, banda_nomes text[], orcamento numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_evento_id UUID;
  v_banda_id UUID;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
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
        WHERE id = v_banda_id AND tenant_id = v_tenant_id
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