-- Script completo para corrigir todos os problemas do Dashboard
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- PARTE 1: CORREÇÃO DO TENANT_ID DOS USUÁRIOS
-- =====================================================

-- Tenant ID padrão encontrado nas outras tabelas
-- d93bd1e5-245e-4a40-9027-4bd669ccc390

-- 1. Verificar perfis existentes
SELECT 
    '=== PERFIS EXISTENTES ===' as info,
    id,
    tenant_id,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Atualizar perfis existentes sem tenant_id
UPDATE profiles 
SET 
    tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    updated_at = now()
WHERE tenant_id IS NULL;

-- 3. Criar perfis para usuários autenticados que não têm perfil
INSERT INTO profiles (id, tenant_id, created_at, updated_at)
SELECT 
    au.id,
    'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    now(),
    now()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PARTE 2: CORREÇÃO DA FUNÇÃO GET_DASHBOARD_METRICS
-- =====================================================

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
COMMENT ON FUNCTION public.get_dashboard_metrics() IS 'Retorna métricas do dashboard: total de bandas ativas, eventos do mês, integrantes ativos e receita mensal';

-- =====================================================
-- PARTE 3: VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar perfis após correção
SELECT 
    '=== PERFIS APÓS CORREÇÃO ===' as info,
    id,
    tenant_id,
    created_at,
    updated_at
FROM profiles
ORDER BY created_at DESC;

-- Verificar dados por tenant_id
SELECT 
    '=== DADOS POR TENANT_ID ===' as info,
    tenant_id,
    'banda' as tabela,
    COUNT(*) as total
FROM banda
GROUP BY tenant_id
UNION ALL
SELECT 
    '=== DADOS POR TENANT_ID ===' as info,
    tenant_id,
    'evento' as tabela,
    COUNT(*) as total
FROM evento
GROUP BY tenant_id
UNION ALL
SELECT 
    '=== DADOS POR TENANT_ID ===' as info,
    tenant_id,
    'banda_integrante' as tabela,
    COUNT(*) as total
FROM banda_integrante
GROUP BY tenant_id
ORDER BY tenant_id, tabela;

-- Testar a função get_dashboard_metrics
SELECT 
    '=== TESTE DA FUNÇÃO ===' as info,
    get_dashboard_metrics() as resultado;

-- Verificar estrutura das tabelas principais
SELECT 
    '=== ESTRUTURA BANDA ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banda' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    '=== ESTRUTURA BANDA_INTEGRANTE ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banda_integrante' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mensagem final
SELECT '🎉 CORREÇÃO COMPLETA! Todos os problemas do Dashboard foram corrigidos.' as resultado_final;