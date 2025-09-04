-- =====================================================
-- DIAGNÓSTICO COMPLETO - AUTENTICAÇÃO E RLS
-- =====================================================
-- Execute no Supabase SQL Editor para diagnosticar problemas

-- =====================================================
-- 1. VERIFICAR ESTADO ATUAL DO RLS
-- =====================================================

-- Verificar se RLS está habilitado nas tabelas financeiras
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('transactions', 'payouts', 'financeiro')
ORDER BY tablename;

-- =====================================================
-- 2. CONTAR POLÍTICAS EXISTENTES
-- =====================================================

-- Contar políticas por tabela
SELECT 
    tablename,
    COUNT(*) as total_politicas,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ SEM POLÍTICAS'
        WHEN COUNT(*) < 4 THEN '⚠️ POLÍTICAS INCOMPLETAS'
        ELSE '✅ POLÍTICAS CONFIGURADAS'
    END as status_politicas
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('transactions', 'payouts', 'financeiro')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 3. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar se as tabelas têm tenant_id
SELECT 
    table_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ TEM TENANT_ID'
        ELSE '❌ SEM TENANT_ID'
    END as tem_tenant_id
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'payouts', 'financeiro')
    AND column_name LIKE '%tenant%'
GROUP BY table_name
ORDER BY table_name;

-- =====================================================
-- 4. VERIFICAR USUÁRIO E AUTENTICAÇÃO
-- =====================================================

-- Verificar contexto de autenticação atual
SELECT 
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ NÃO AUTENTICADO'
        ELSE '✅ AUTENTICADO'
    END as status_auth,
    auth.role() as user_role,
    current_user as db_user;

-- =====================================================
-- 5. VERIFICAR TABELA PROFILES
-- =====================================================

-- Verificar se a tabela profiles existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ TABELA PROFILES EXISTE'
        ELSE '❌ TABELA PROFILES NÃO EXISTE'
    END as status_profiles
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'profiles';

-- Verificar estrutura da tabela profiles (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'tenant_id' THEN '✅ TENANT_ID ENCONTRADO'
        WHEN column_name = 'id' THEN '✅ ID ENCONTRADO'
        ELSE '📋 COLUNA PADRÃO'
    END as importancia
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- 6. TESTE DE ACESSO (SEGURO)
-- =====================================================

-- Tentar acessar as tabelas (apenas contagem)
DO $$
DECLARE
    resultado TEXT;
BEGIN
    -- Teste transactions
    BEGIN
        PERFORM COUNT(*) FROM public.transactions;
        RAISE NOTICE '✅ ACESSO À TRANSACTIONS: PERMITIDO';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ACESSO À TRANSACTIONS: NEGADO - %', SQLERRM;
    END;
    
    -- Teste payouts
    BEGIN
        PERFORM COUNT(*) FROM public.payouts;
        RAISE NOTICE '✅ ACESSO À PAYOUTS: PERMITIDO';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ACESSO À PAYOUTS: NEGADO - %', SQLERRM;
    END;
    
    -- Teste financeiro
    BEGIN
        PERFORM COUNT(*) FROM public.financeiro;
        RAISE NOTICE '✅ ACESSO À FINANCEIRO: PERMITIDO';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ACESSO À FINANCEIRO: NEGADO - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- 7. RESUMO DO DIAGNÓSTICO
-- =====================================================

-- Criar um resumo dos problemas encontrados
SELECT 
    'DIAGNÓSTICO COMPLETO' as titulo,
    CASE 
        WHEN auth.uid() IS NULL THEN 'CRÍTICO: Usuário não autenticado'
        ELSE 'OK: Usuário autenticado'
    END as status_usuario,
    (
        SELECT COUNT(*) 
        FROM pg_tables 
        WHERE schemaname = 'public' 
            AND tablename IN ('transactions', 'payouts', 'financeiro')
            AND rowsecurity = true
    ) as tabelas_com_rls,
    (
        SELECT COUNT(DISTINCT tablename) 
        FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename IN ('transactions', 'payouts', 'financeiro')
    ) as tabelas_com_politicas;

-- =====================================================
-- PRÓXIMOS PASSOS RECOMENDADOS:
-- =====================================================
-- 1. Se RLS estiver desabilitado: Execute setup_rls_policies.sql
-- 2. Se não houver políticas: Execute setup_rls_policies.sql
-- 3. Se usuário não estiver autenticado: Configure Auth no Dashboard
-- 4. Se tabela profiles não existir: Crie a tabela profiles
-- 5. Se não houver tenant_id: Adicione a coluna tenant_id às tabelas