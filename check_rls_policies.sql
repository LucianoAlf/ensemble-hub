-- =====================================================
-- VERIFICAÇÃO DE POLÍTICAS RLS - Tabelas Financeiras
-- =====================================================
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. VERIFICAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Políticas da tabela transactions
SELECT 
    'transactions' as tabela,
    policyname as politica,
    cmd as comando,
    permissive as permissiva,
    roles as funcoes,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'transactions' AND schemaname = 'public'
ORDER BY policyname;

-- Políticas da tabela payouts
SELECT 
    'payouts' as tabela,
    policyname as politica,
    cmd as comando,
    permissive as permissiva,
    roles as funcoes,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'payouts' AND schemaname = 'public'
ORDER BY policyname;

-- Políticas da tabela financeiro
SELECT 
    'financeiro' as tabela,
    policyname as politica,
    cmd as comando,
    permissive as permissiva,
    roles as funcoes,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'financeiro' AND schemaname = 'public'
ORDER BY policyname;

-- =====================================================
-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVO'
        ELSE 'RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('transactions', 'payouts', 'financeiro')
ORDER BY tablename;

-- =====================================================
-- 3. VERIFICAR ESTRUTURA DAS TABELAS (tenant_id)
-- =====================================================

-- Verificar se as tabelas têm coluna tenant_id
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'payouts', 'financeiro')
    AND column_name LIKE '%tenant%'
ORDER BY table_name, column_name;

-- =====================================================
-- 4. VERIFICAR USUÁRIO ATUAL E CONTEXTO
-- =====================================================

-- Verificar usuário atual
SELECT 
    auth.uid() as user_id,
    auth.role() as user_role,
    current_user as db_user,
    session_user as session_user;

-- Verificar perfil do usuário (se existir)
-- Primeiro, vamos ver a estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Depois verificar o perfil do usuário atual
SELECT 
    id,
    tenant_id,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- =====================================================
-- 5. TESTE DE ACESSO ÀS TABELAS (SOMENTE LEITURA)
-- =====================================================

-- Tentar contar registros em transactions
SELECT 
    'transactions' as tabela,
    COUNT(*) as total_registros,
    'Acesso permitido' as status
FROM public.transactions;

-- Tentar contar registros em payouts
SELECT 
    'payouts' as tabela,
    COUNT(*) as total_registros,
    'Acesso permitido' as status
FROM public.payouts;

-- Tentar contar registros em financeiro
SELECT 
    'financeiro' as tabela,
    COUNT(*) as total_registros,
    'Acesso permitido' as status
FROM public.financeiro;

-- =====================================================
-- 6. VERIFICAR FUNÇÕES RLS PERSONALIZADAS
-- =====================================================

-- Verificar se existem funções relacionadas a tenant
SELECT 
    proname as nome_funcao,
    proargnames as argumentos,
    prosrc as codigo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND (proname LIKE '%tenant%' OR proname LIKE '%rls%')
ORDER BY proname;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Copie e cole cada seção no Supabase SQL Editor
-- 2. Execute uma seção por vez
-- 3. Analise os resultados para identificar problemas
-- 4. Se houver erros de permissão, isso indica que RLS está funcionando
-- 5. Se não houver políticas, será necessário criá-las