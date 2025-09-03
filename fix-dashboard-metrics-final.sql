-- Script completo para corrigir a função get_dashboard_metrics
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- PASSO 1: MOSTRAR O CÓDIGO ATUAL DA FUNÇÃO
-- =====================================================

SELECT 
    '=== CÓDIGO ATUAL DA FUNÇÃO get_dashboard_metrics ===' as info,
    pg_get_functiondef(oid) as codigo_atual
FROM pg_proc 
WHERE proname = 'get_dashboard_metrics';

-- =====================================================
-- PASSO 2: RECRIAR A FUNÇÃO COM A CORREÇÃO
-- =====================================================

-- Corrigir função get_dashboard_metrics
-- CORREÇÃO: trocar "ativo" por "ativa" na tabela banda
-- A tabela banda usa a coluna "ativa" (boolean)
-- A tabela banda_integrante usa a coluna "ativo" (boolean)

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
    WHERE ativa = true  -- CORREÇÃO: era "ativo", agora é "ativa"
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
    WHERE ativo = true  -- MANTIDO: tabela banda_integrante usa "ativo"
    AND tenant_id = user_tenant_id;
    
    -- Calcular receita mensal (baseada no orçamento dos eventos)
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
COMMENT ON FUNCTION public.get_dashboard_metrics() IS 'Retorna métricas do dashboard: total de bandas ativas, eventos do mês, integrantes ativos e receita mensal. CORRIGIDO: usa ativa para banda e ativo para banda_integrante';

-- =====================================================
-- PASSO 3: MOSTRAR O CÓDIGO CORRIGIDO DA FUNÇÃO
-- =====================================================

SELECT 
    '=== CÓDIGO CORRIGIDO DA FUNÇÃO get_dashboard_metrics ===' as info,
    pg_get_functiondef(oid) as codigo_corrigido
FROM pg_proc 
WHERE proname = 'get_dashboard_metrics';

-- =====================================================
-- PASSO 4: TESTAR A FUNÇÃO CORRIGIDA
-- =====================================================

SELECT 
    '=== TESTE DA FUNÇÃO CORRIGIDA ===' as info,
    get_dashboard_metrics() as resultado;

-- =====================================================
-- PASSO 5: VERIFICAÇÕES ADICIONAIS
-- =====================================================

-- Verificar estrutura das tabelas para confirmar as colunas
SELECT 
    '=== COLUNAS DA TABELA BANDA ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banda' 
AND table_schema = 'public'
AND column_name IN ('ativo', 'ativa')
ORDER BY column_name;

SELECT 
    '=== COLUNAS DA TABELA BANDA_INTEGRANTE ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banda_integrante' 
AND table_schema = 'public'
AND column_name IN ('ativo', 'ativa')
ORDER BY column_name;

-- Contar registros para verificar se há dados
SELECT 
    '=== CONTAGEM DE DADOS ===' as info,
    'banda' as tabela,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE ativa = true) as ativas
FROM banda
UNION ALL
SELECT 
    '=== CONTAGEM DE DADOS ===' as info,
    'banda_integrante' as tabela,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM banda_integrante;

-- Mensagem final
SELECT '🎉 CORREÇÃO APLICADA! A função get_dashboard_metrics() agora usa "ativa" para banda e "ativo" para banda_integrante.' as resultado_final;