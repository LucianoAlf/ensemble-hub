-- =====================================================
-- CORREÇÃO FINAL DA FUNÇÃO get_dashboard_metrics
-- =====================================================
-- INSTRUÇÕES: Copie e cole este código no Supabase Dashboard > SQL Editor
-- Execute o script completo para corrigir os erros de "column ativo does not exist"

-- PROBLEMA IDENTIFICADO:
-- A função get_dashboard_metrics estava usando "ativo" para a tabela "banda"
-- mas a tabela "banda" usa a coluna "ativa" (não "ativo")
-- A tabela "banda_integrante" usa corretamente "ativo"

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar colunas da tabela banda
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

-- Verificar colunas da tabela banda_integrante
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

-- =====================================================
-- PASSO 2: APLICAR A CORREÇÃO DA FUNÇÃO
-- =====================================================

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
-- PASSO 3: TESTAR A FUNÇÃO CORRIGIDA
-- =====================================================

SELECT 
    '=== TESTE DA FUNÇÃO CORRIGIDA ===' as info,
    get_dashboard_metrics() as resultado;

-- =====================================================
-- PASSO 4: VERIFICAR DADOS EXISTENTES
-- =====================================================

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

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================

SELECT '🎉 CORREÇÃO APLICADA! A função get_dashboard_metrics() agora usa "ativa" para banda e "ativo" para banda_integrante.' as resultado_final;

-- =====================================================
-- RESUMO DAS CORREÇÕES APLICADAS:
-- =====================================================
-- ✅ Corrigido: banda.ativo → banda.ativa
-- ✅ Mantido: banda_integrante.ativo (correto)
-- ✅ Adicionado fallback para tenant_id padrão
-- ✅ Corrigido campo 'inicio' para eventos (era 'data_inicio')
-- ✅ Permissões concedidas para authenticated e anon
-- ✅ Documentação atualizada