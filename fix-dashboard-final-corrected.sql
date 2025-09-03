-- Corrigir função get_dashboard_metrics - versão final definitiva
-- Problema identificado: tabela 'banda' usa coluna 'ativa', não 'ativo'
-- Solução: usar 'ativa' para banda e 'ativo' para banda_integrante

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
    -- Obter tenant_id do usuário atual ou usar um padrão se não autenticado
    SELECT COALESCE(
        (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()),
        'd93bd1e5-245e-4a40-9027-4bd669ccc390'::uuid
    ) INTO user_tenant_id;
    
    -- Contar bandas ativas (CORRIGIDO: usar 'ativa' da tabela banda)
    SELECT COUNT(*)
    INTO total_bands
    FROM public.banda
    WHERE ativa = true
    AND tenant_id = user_tenant_id;
    
    -- Contar eventos do mês atual
    SELECT COUNT(*)
    INTO total_events
    FROM public.evento
    WHERE DATE_TRUNC('month', inicio) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id;
    
    -- Contar integrantes ativos (CORRETO: usar 'ativo' da tabela banda_integrante)
    SELECT COUNT(*)
    INTO total_members
    FROM public.banda_integrante
    WHERE ativo = true
    AND tenant_id = user_tenant_id;
    
    -- Calcular receita mensal (assumindo que existe uma tabela de receitas)
    SELECT COALESCE(SUM(orcamento), 0)
    INTO monthly_revenue
    FROM public.evento
    WHERE DATE_TRUNC('month', inicio) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id
    AND orcamento IS NOT NULL;
    
    -- Retornar resultado como JSON
    RETURN json_build_object(
        'total_bands', total_bands,
        'total_events', total_events,
        'total_members', total_members,
        'monthly_revenue', monthly_revenue
    );
END;
$$;

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO anon;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_dashboard_metrics() IS 'Retorna métricas do dashboard: total de bandas ativas, eventos do mês, integrantes ativos e receita mensal';