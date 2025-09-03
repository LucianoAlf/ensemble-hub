-- =====================================================
-- AUDITORIA COMPLETA DO BANCO DE DADOS (SCHEMA PUBLIC)
-- =====================================================
-- Este arquivo contém todas as queries para auditoria completa
-- conforme especificado em auditoria.md
-- NÃO EXECUTAR PATCHES - APENAS DIAGNÓSTICO

-- =====================================================
-- 1) INVENTÁRIO DE SCHEMA (PASS/FAIL por tabela)
-- =====================================================

-- 1.1) Verificar existência das tabelas principais
SELECT 
    'INVENTÁRIO SCHEMA' as secao,
    'Tabelas Principais' as item,
    CASE 
        WHEN COUNT(*) = 8 THEN 'PASS'
        ELSE 'FAIL - Faltam ' || (8 - COUNT(*)) || ' tabelas'
    END as status,
    string_agg(table_name, ', ') as evidencia
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade');

-- 1.2) Estrutura detalhada de cada tabela
\echo '\n=== ESTRUTURA DETALHADA DAS TABELAS ==='

-- TABELA: evento
\d+ public.evento

-- TABELA: evento_banda
\d+ public.evento_banda

-- TABELA: banda
\d+ public.banda

-- TABELA: banda_membro
\d+ public.banda_membro

-- TABELA: profiles
\d+ public.profiles

-- TABELA: financeiro
\d+ public.financeiro

-- TABELA: transactions
\d+ public.transactions

-- TABELA: unidade
\d+ public.unidade

-- 1.3) Verificar Primary Keys
SELECT 
    'INVENTÁRIO SCHEMA' as secao,
    'Primary Keys' as item,
    t.table_name,
    CASE 
        WHEN COUNT(kcu.column_name) > 0 THEN 'PASS'
        ELSE 'FAIL - Sem PK'
    END as status,
    string_agg(kcu.column_name, ', ') as pk_columns
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
    ON t.table_name = tc.table_name 
    AND t.table_schema = tc.table_schema 
    AND tc.constraint_type = 'PRIMARY KEY'
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade')
GROUP BY t.table_name
ORDER BY t.table_name;

-- 1.4) Verificar coluna tenant_id
SELECT 
    'INVENTÁRIO SCHEMA' as secao,
    'Tenant ID' as item,
    table_name,
    CASE 
        WHEN column_name IS NOT NULL AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name IS NOT NULL AND is_nullable = 'YES' THEN 'FAIL - tenant_id permite NULL'
        ELSE 'FAIL - tenant_id ausente'
    END as status,
    COALESCE(data_type, 'AUSENTE') as tipo,
    COALESCE(is_nullable, 'N/A') as nullable
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema 
    AND c.column_name = 'tenant_id'
WHERE t.table_schema = 'public' 
AND t.table_name IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade')
ORDER BY t.table_name;

-- 1.5) Verificar Foreign Keys
SELECT 
    'INVENTÁRIO SCHEMA' as secao,
    'Foreign Keys' as item,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name as fk_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column,
    rc.delete_rule,
    rc.update_rule,
    CASE 
        WHEN rc.delete_rule IN ('CASCADE', 'SET NULL', 'RESTRICT') THEN 'PASS'
        ELSE 'FAIL - DELETE rule inadequada: ' || COALESCE(rc.delete_rule, 'NO ACTION')
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade')
ORDER BY tc.table_name, tc.constraint_name;

-- 1.6) Verificar Índices
SELECT 
    'INVENTÁRIO SCHEMA' as secao,
    'Índices' as item,
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE '%_pkey' THEN 'PASS - PK Index'
        WHEN indexname LIKE '%tenant_id%' THEN 'PASS - Tenant Index'
        WHEN indexname LIKE '%_fkey%' THEN 'PASS - FK Index'
        ELSE 'INFO - Custom Index'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade')
ORDER BY tablename, indexname;

-- 1.7) Verificar UNIQUE constraints em tabelas N:N
SELECT 
    'INVENTÁRIO SCHEMA' as secao,
    'UNIQUE Constraints N:N' as item,
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as unique_columns,
    CASE 
        WHEN tc.table_name = 'evento_banda' AND string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%evento_id%banda_id%' THEN 'PASS'
        WHEN tc.table_name = 'banda_membro' AND string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%banda_id%' THEN 'PASS'
        ELSE 'FAIL - UNIQUE constraint inadequada'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
AND tc.table_name IN ('evento_banda', 'banda_membro')
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- =====================================================
-- 2) RLS & POLÍTICAS (PASS/FAIL por tabela/view)
-- =====================================================

-- 2.1) Verificar RLS habilitado
SELECT 
    'RLS & POLÍTICAS' as secao,
    'RLS Habilitado' as item,
    tablename,
    CASE 
        WHEN rowsecurity THEN 'PASS'
        ELSE 'FAIL - RLS desabilitado'
    END as status,
    rowsecurity as evidencia
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade')
ORDER BY tablename;

-- 2.2) Listar todas as políticas RLS
SELECT 
    'RLS & POLÍTICAS' as secao,
    'Políticas Existentes' as item,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check,
    CASE 
        WHEN qual LIKE '%tenant_id%' OR qual LIKE '%auth.uid()%' THEN 'PASS - Isolamento tenant'
        ELSE 'FAIL - Política muito ampla'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles', 'financeiro', 'transactions', 'unidade')
ORDER BY tablename, policyname;

-- 2.3) Verificar Views e se respeitam RLS
SELECT 
    'RLS & POLÍTICAS' as secao,
    'Views e RLS' as item,
    table_name as view_name,
    view_definition,
    CASE 
        WHEN view_definition LIKE '%public.evento%' OR view_definition LIKE '%public.banda%' THEN 'PASS - Usa tabelas com RLS'
        ELSE 'INFO - Verificar manualmente'
    END as status
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name LIKE 'vw_%'
ORDER BY table_name;

-- =====================================================
-- 3) RPCs/FUNÇÕES/Triggers (Segurança e Contrato)
-- =====================================================

-- 3.1) Listar assinaturas das funções principais
SELECT 
    'RPCs/FUNÇÕES' as secao,
    'Assinaturas Principais' as item,
    routine_name,
    routine_type,
    data_type as return_type,
    security_type,
    CASE 
        WHEN routine_name IN ('get_evento_full', 'update_evento_full') AND security_type = 'INVOKER' THEN 'PASS'
        WHEN routine_name IN ('get_evento_full', 'update_evento_full') AND security_type = 'DEFINER' THEN 'FAIL - SECURITY DEFINER inadequado'
        WHEN routine_name IN ('get_evento_full', 'update_evento_full') THEN 'FAIL - Função não encontrada'
        ELSE 'INFO - Outras funções'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (routine_name LIKE '%evento%' OR routine_name LIKE '%banda%' OR routine_name LIKE '%dashboard%')
ORDER BY routine_name;

-- 3.2) Parâmetros das funções principais
SELECT 
    'RPCs/FUNÇÕES' as secao,
    'Parâmetros' as item,
    specific_name,
    parameter_name,
    ordinal_position,
    parameter_mode,
    data_type,
    parameter_default
FROM information_schema.parameters 
WHERE specific_schema = 'public'
AND specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_evento_full', 'update_evento_full')
)
ORDER BY specific_name, ordinal_position;

-- 3.3) Verificar triggers
SELECT 
    'RPCs/FUNÇÕES' as secao,
    'Triggers' as item,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement,
    CASE 
        WHEN trigger_name LIKE '%handle_new_user%' THEN 'PASS - Sistema'
        WHEN trigger_name LIKE '%tenant%' THEN 'PASS - Tenant validation'
        ELSE 'INFO - Verificar manualmente'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 4) INTEGRIDADE REFERENCIAL & ORFÃOS
-- =====================================================

-- 4.1) Verificar orfãos em evento_banda (eventos inexistentes)
SELECT 
    'INTEGRIDADE REFERENCIAL' as secao,
    'Orfãos evento_banda -> evento' as item,
    COUNT(*) as count_orfaos,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' registros órfãos'
    END as status
FROM public.evento_banda eb
WHERE NOT EXISTS (
    SELECT 1 FROM public.evento e WHERE e.id = eb.evento_id
);

-- 4.2) Verificar orfãos em evento_banda (bandas inexistentes)
SELECT 
    'INTEGRIDADE REFERENCIAL' as secao,
    'Orfãos evento_banda -> banda' as item,
    COUNT(*) as count_orfaos,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' registros órfãos'
    END as status
FROM public.evento_banda eb
WHERE NOT EXISTS (
    SELECT 1 FROM public.banda b WHERE b.id = eb.banda_id
);

-- 4.3) Verificar orfãos em banda_membro (bandas inexistentes)
SELECT 
    'INTEGRIDADE REFERENCIAL' as secao,
    'Orfãos banda_membro -> banda' as item,
    COUNT(*) as count_orfaos,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' registros órfãos'
    END as status
FROM public.banda_membro bm
WHERE NOT EXISTS (
    SELECT 1 FROM public.banda b WHERE b.id = bm.banda_id
);

-- 4.4) Verificar orfãos em banda_membro (profiles inexistentes)
SELECT 
    'INTEGRIDADE REFERENCIAL' as secao,
    'Orfãos banda_membro -> profiles' as item,
    COUNT(*) as count_orfaos,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' registros órfãos'
    END as status
FROM public.banda_membro bm
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = bm.profile_id
);

-- =====================================================
-- 5) CONSISTÊNCIA DE TENANT
-- =====================================================

-- 5.1) Verificar consistência tenant_id entre evento e evento_banda
SELECT 
    'CONSISTÊNCIA TENANT' as secao,
    'evento <-> evento_banda' as item,
    COUNT(*) as count_inconsistencias,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' inconsistências de tenant'
    END as status
FROM public.evento_banda eb
JOIN public.evento e ON e.id = eb.evento_id
WHERE e.tenant_id != eb.tenant_id;

-- 5.2) Verificar consistência tenant_id entre banda e evento_banda
SELECT 
    'CONSISTÊNCIA TENANT' as secao,
    'banda <-> evento_banda' as item,
    COUNT(*) as count_inconsistencias,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' inconsistências de tenant'
    END as status
FROM public.evento_banda eb
JOIN public.banda b ON b.id = eb.banda_id
WHERE b.tenant_id != eb.tenant_id;

-- 5.3) Verificar consistência tenant_id entre banda e banda_membro
SELECT 
    'CONSISTÊNCIA TENANT' as secao,
    'banda <-> banda_membro' as item,
    COUNT(*) as count_inconsistencias,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' inconsistências de tenant'
    END as status
FROM public.banda_membro bm
JOIN public.banda b ON b.id = bm.banda_id
WHERE b.tenant_id != bm.tenant_id;

-- =====================================================
-- 6) DATA/HORA & TIMEZONE
-- =====================================================

-- 6.1) Verificar tipos de data/hora em evento
SELECT 
    'DATA/HORA & TIMEZONE' as secao,
    'Tipos timestamp em evento' as item,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'timestamp with time zone' THEN 'PASS'
        WHEN data_type = 'timestamp without time zone' THEN 'FAIL - Usar timestamptz'
        ELSE 'INFO - Outro tipo'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'evento'
AND column_name IN ('inicio', 'fim', 'created_at', 'updated_at')
ORDER BY column_name;

-- 6.2) Verificar timezone atual do banco
SELECT 
    'DATA/HORA & TIMEZONE' as secao,
    'Configuração Timezone' as item,
    name as setting_name,
    setting as current_value,
    CASE 
        WHEN setting = 'UTC' THEN 'PASS'
        ELSE 'FAIL - Timezone não é UTC: ' || setting
    END as status
FROM pg_settings 
WHERE name = 'timezone';

-- =====================================================
-- 7) PERFORMANCE & ÍNDICES CRÍTICOS
-- =====================================================

-- 7.1) Verificar índices recomendados para evento
SELECT 
    'PERFORMANCE & ÍNDICES' as secao,
    'Índices recomendados evento' as item,
    indexname,
    indexdef,
    CASE 
        WHEN indexdef LIKE '%tenant_id%inicio%' OR indexdef LIKE '%inicio%tenant_id%' THEN 'PASS - Índice temporal'
        WHEN indexdef LIKE '%id%tenant_id%' THEN 'PASS - Índice lookup'
        WHEN indexdef LIKE '%tenant_id%' THEN 'PARTIAL PASS - Só tenant'
        ELSE 'INFO - Outros índices'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'evento'
ORDER BY indexname;

-- 7.2) Verificar índices em evento_banda
SELECT 
    'PERFORMANCE & ÍNDICES' as secao,
    'Índices evento_banda' as item,
    indexname,
    indexdef,
    CASE 
        WHEN indexdef LIKE '%evento_id%banda_id%' THEN 'PASS - Índice N:N'
        WHEN indexdef LIKE '%evento_id%' OR indexdef LIKE '%banda_id%' THEN 'PASS - Índice FK'
        ELSE 'INFO - Outros índices'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'evento_banda'
ORDER BY indexname;

-- =====================================================
-- 8) CHECKLIST FRONTEND ⇄ BACKEND (Contrato de Dados)
-- =====================================================

-- 8.1) Verificar campos esperados em evento
SELECT 
    'FRONTEND ⇄ BACKEND' as secao,
    'Campos evento esperados' as item,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'titulo', 'tipo', 'inicio', 'local') AND is_nullable = 'NO' THEN 'PASS - Campo obrigatório'
        WHEN column_name IN ('fim', 'endereco', 'orcamento') AND is_nullable = 'YES' THEN 'PASS - Campo opcional'
        WHEN column_name IN ('observacoes', 'descricao') THEN 'PASS - Campo texto longo'
        WHEN column_name = 'tenant_id' AND is_nullable = 'NO' THEN 'PASS - Tenant obrigatório'
        ELSE 'INFO - Outros campos'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'evento'
ORDER BY 
    CASE 
        WHEN column_name IN ('id', 'titulo', 'tipo', 'inicio', 'fim', 'local', 'endereco', 'orcamento', 'observacoes', 'descricao') THEN 1
        ELSE 2
    END,
    column_name;

-- 8.2) Verificar qual campo de texto longo existe (observacoes vs descricao)
SELECT 
    'FRONTEND ⇄ BACKEND' as secao,
    'Campo texto longo (observacoes vs descricao)' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evento' AND column_name = 'observacoes') 
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evento' AND column_name = 'descricao') 
        THEN 'FAIL - Ambos campos existem, definir padrão'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evento' AND column_name = 'observacoes') 
        THEN 'PASS - Campo observacoes existe'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evento' AND column_name = 'descricao') 
        THEN 'PASS - Campo descricao existe'
        ELSE 'FAIL - Nenhum campo de texto longo'
    END as status,
    string_agg(column_name, ', ') as campos_encontrados
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'evento'
AND column_name IN ('observacoes', 'descricao');

-- =====================================================
-- QUERIES DE TESTE PARA RPCs (se existirem)
-- =====================================================

-- Teste get_evento_full (apenas se a função existir)
-- SELECT public.get_evento_full('00000000-0000-0000-0000-000000000001'::uuid);

-- Teste update_evento_full (apenas se a função existir)
-- SELECT public.update_evento_full(
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     'Teste Evento',
--     'show',
--     '2024-12-01 20:00:00+00'::timestamptz,
--     'Local Teste',
--     '2024-12-01 23:00:00+00'::timestamptz,
--     'Endereço Teste',
--     1000.00,
--     'Observações teste',
--     '{}'
-- );

\echo '\n=== AUDITORIA COMPLETA FINALIZADA ==='
\echo 'Analise os resultados acima para gerar o relatório final com PASS/FAIL'
\echo 'Patches SQL serão sugeridos baseados nos itens FAIL encontrados'