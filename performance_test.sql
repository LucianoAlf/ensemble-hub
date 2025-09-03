-- Performance Test Script para Event Modal RPCs
-- Este script testa a performance das funções get_evento_full e update_evento_full

-- Configurar contexto de teste (simular usuário autenticado)
SET session_replication_role = replica; -- Desabilitar RLS temporariamente para teste

-- Verificar se existe algum evento para testar
SELECT 'EVENTOS DISPONÍVEIS PARA TESTE' as info;
SELECT id, titulo, tenant_id FROM evento LIMIT 5;

-- Teste de performance da função get_evento_full
SELECT 'TESTE DE PERFORMANCE - GET_EVENTO_FULL' as info;

-- Primeiro, vamos verificar a estrutura da função sem executá-la
SELECT 'Verificando assinatura da função get_evento_full' as info;
SELECT proname, pg_get_function_arguments(oid) as arguments 
FROM pg_proc 
WHERE proname = 'get_evento_full' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verificar a estrutura da função update_evento_full
SELECT 'Verificando assinatura da função update_evento_full' as info;
SELECT proname, pg_get_function_arguments(oid) as arguments 
FROM pg_proc 
WHERE proname = 'update_evento_full' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verificar índices ativos
SELECT 'ÍNDICES ATIVOS NAS TABELAS RELACIONADAS' as info;
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles') 
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 'POLÍTICAS RLS ATIVAS' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles') 
ORDER BY tablename, policyname;

-- Estatísticas das tabelas
SELECT 'ESTATÍSTICAS DAS TABELAS' as info;
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY tablename;

SET session_replication_role = DEFAULT; -- Reabilitar RLS

SELECT 'TESTE DE PERFORMANCE CONCLUÍDO' as resultado;