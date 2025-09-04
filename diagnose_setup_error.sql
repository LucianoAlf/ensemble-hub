-- =====================================================
-- DIAGNÓSTICO: Por que setup_rls_policies.sql falha?
-- =====================================================
-- Execute no Supabase SQL Editor para identificar problemas

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS EXISTENTES
-- =====================================================

-- Verificar quais tabelas existem no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR ESTRUTURA DA TABELA PROFILES
-- =====================================================

-- Verificar se a tabela profiles existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR ESTRUTURA DAS TABELAS FINANCEIRAS
-- =====================================================

-- Verificar estrutura da tabela transactions
SELECT 
    'transactions' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela payouts
SELECT 
    'payouts' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'payouts'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela financeiro
SELECT 
    'financeiro' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'financeiro'
ORDER BY ordinal_position;

-- =====================================================
-- 4. VERIFICAR ESTADO ATUAL DO RLS
-- =====================================================

-- Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    'Verificar manualmente no Dashboard' as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 5. VERIFICAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Listar todas as políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. VERIFICAR FUNÇÕES EXISTENTES
-- =====================================================

-- Verificar se a função get_user_tenant_id já existe
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%tenant%'
ORDER BY routine_name;

-- =====================================================
-- 7. VERIFICAR USUÁRIOS E AUTENTICAÇÃO
-- =====================================================

-- Verificar se há usuários na tabela auth.users
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as usuarios_confirmados
FROM auth.users;

-- Verificar se há perfis na tabela profiles
SELECT 
    COUNT(*) as total_perfis
FROM public.profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public');

-- =====================================================
-- 8. TESTAR SINTAXE ESPECÍFICA DO SCRIPT ORIGINAL
-- =====================================================

-- Testar se a sintaxe INSERT INTO profiles funciona
-- (sem executar, apenas validar)
EXPLAIN (FORMAT TEXT) 
SELECT 1 
WHERE EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'email'
);

-- =====================================================
-- 9. VERIFICAR PERMISSÕES DO USUÁRIO ATUAL
-- =====================================================

-- Verificar role e permissões do usuário atual
SELECT 
    current_user as usuario_atual,
    session_user as usuario_sessao,
    current_database() as database_atual,
    current_schema() as schema_atual;

-- Verificar se o usuário tem permissões para criar políticas
SELECT 
    has_table_privilege('public.profiles', 'SELECT') as pode_select_profiles,
    has_table_privilege('public.profiles', 'INSERT') as pode_insert_profiles,
    has_table_privilege('public.profiles', 'UPDATE') as pode_update_profiles,
    has_schema_privilege('public', 'CREATE') as pode_criar_no_public;

-- =====================================================
-- 10. IDENTIFICAR PROBLEMAS ESPECÍFICOS
-- =====================================================

-- Verificar se o erro é relacionado à coluna 'email'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
                AND table_schema = 'public' 
                AND column_name = 'email'
        ) THEN 'COLUNA EMAIL EXISTE'
        ELSE 'ERRO: COLUNA EMAIL NÃO EXISTE NA TABELA PROFILES'
    END as status_coluna_email;

-- Verificar se as tabelas financeiras têm a coluna tenant_id
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = t.table_name 
                AND table_schema = 'public' 
                AND column_name = 'tenant_id'
        ) THEN 'TEM TENANT_ID'
        ELSE 'FALTA TENANT_ID'
    END as status_tenant_id
FROM (
    SELECT 'transactions' as table_name
    UNION ALL
    SELECT 'payouts'
    UNION ALL
    SELECT 'financeiro'
) t;

-- =====================================================
-- RESUMO DO DIAGNÓSTICO
-- =====================================================

SELECT 
    'DIAGNÓSTICO COMPLETO' as status,
    'Verifique os resultados acima para identificar:' as instrucoes,
    '1. Se a tabela profiles existe e tem as colunas corretas' as passo_1,
    '2. Se as tabelas financeiras existem e têm tenant_id' as passo_2,
    '3. Se há erros de sintaxe ou permissões' as passo_3,
    '4. Se RLS já está configurado' as passo_4;

-- =====================================================
-- PRÓXIMOS PASSOS BASEADOS NO DIAGNÓSTICO:
-- =====================================================
-- 1. Se a coluna 'email' não existe em profiles:
--    → Use o script setup_rls_policies_corrigido.sql
--
-- 2. Se as tabelas financeiras não existem:
--    → Execute primeiro a criação das tabelas
--
-- 3. Se há problemas de permissão:
--    → Execute como administrador do projeto
--
-- 4. Se RLS já está configurado:
--    → Verifique se as políticas estão funcionando corretamente

-- Diagnóstico concluído. Analise os resultados para identificar o problema específico.
SELECT 'Diagnóstico concluído. Analise os resultados acima para identificar o problema específico.' as status_final;