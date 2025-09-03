-- Corrigir função get_dashboard_metrics para usar banda_integrante
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_tenant_id uuid;
    total_bands integer;
    total_events integer;
    total_members integer;
    monthly_revenue numeric;
BEGIN
    -- Obter tenant_id do usuário atual
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Verificar se o usuário tem tenant_id
    IF user_tenant_id IS NULL THEN
        RETURN json_build_object('error', 'User must have a tenant_id');
    END IF;
    
    -- Contar bandas ativas
    SELECT COUNT(*)
    INTO total_bands
    FROM public.banda
    WHERE ativo = true
    AND tenant_id = user_tenant_id;
    
    -- Contar eventos do mês atual
    SELECT COUNT(*)
    INTO total_events
    FROM public.evento
    WHERE DATE_TRUNC('month', data_evento) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id;
    
    -- Contar integrantes ativos (CORRIGIDO: usando banda_integrante)
    SELECT COUNT(*)
    INTO total_members
    FROM public.banda_integrante
    WHERE ativo = true
    AND tenant_id = user_tenant_id;
    
    -- Calcular receita mensal
    SELECT COALESCE(SUM(valor), 0)
    INTO monthly_revenue
    FROM public.evento
    WHERE DATE_TRUNC('month', data_evento) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id;
    
    -- Retornar métricas
    RETURN json_build_object(
        'total_bands', total_bands,
        'total_events', total_events,
        'total_members', total_members,
        'monthly_revenue', monthly_revenue
    );
END;
$$;

-- Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO anon;

-- Comentário para documentar a correção
COMMENT ON FUNCTION public.get_dashboard_metrics() IS 'Função corrigida para contar integrantes da tabela banda_integrante ao invés de banda_membro';