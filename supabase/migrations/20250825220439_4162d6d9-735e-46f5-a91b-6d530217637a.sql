-- Corrigir função create_banda para resolver ambiguidade de coluna 'id'
CREATE OR REPLACE FUNCTION public.create_banda(p_nome text, p_genero text DEFAULT NULL::text, p_descricao text DEFAULT NULL::text, p_logo_url text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, nome text, genero text, descricao text, logo_url text, members_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_banda_id UUID;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
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
  
  -- Return the created band data with explicit column references
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
$function$