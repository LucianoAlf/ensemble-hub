-- Fix get_dashboard_metrics function to use banda_integrante instead of banda_membro
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
      SELECT COUNT(*) FROM public.banda_integrante bi
      JOIN public.banda b ON bi.banda_id = b.id
      WHERE b.tenant_id = v_tenant_id AND bi.ativo = true
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