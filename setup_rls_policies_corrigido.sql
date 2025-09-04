-- =====================================================
-- CONFIGURAÇÃO DE POLÍTICAS RLS - Tabelas Financeiras (CORRIGIDO)
-- =====================================================
-- Execute no Supabase SQL Editor (como administrador)
-- ATENÇÃO: Este script fará alterações no banco de dados

-- =====================================================
-- 0. VERIFICAR SE AS TABELAS EXISTEM ANTES DE CONFIGURAR RLS
-- =====================================================

-- Verificar se as tabelas financeiras existem
DO $$
BEGIN
    -- Verificar se a tabela transactions existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
        RAISE NOTICE 'AVISO: Tabela transactions não existe. Criando estrutura básica...';
        
        CREATE TABLE IF NOT EXISTS public.transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL,
            evento_id UUID,
            banda_id UUID,
            gross_amount NUMERIC(10,2),
            fee_amount NUMERIC(10,2),
            net_amount NUMERIC(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- Verificar se a tabela payouts existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts' AND table_schema = 'public') THEN
        RAISE NOTICE 'AVISO: Tabela payouts não existe. Criando estrutura básica...';
        
        CREATE TABLE IF NOT EXISTS public.payouts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID,
            due_date DATE,
            settled_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- Verificar se a tabela financeiro existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financeiro' AND table_schema = 'public') THEN
        RAISE NOTICE 'AVISO: Tabela financeiro não existe. Criando estrutura básica...';
        
        CREATE TABLE IF NOT EXISTS public.financeiro (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL,
            evento_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- =====================================================
-- 1. VERIFICAR E CRIAR TABELA PROFILES SE NECESSÁRIO
-- =====================================================

-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para profiles: usuários só veem seu próprio perfil
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    USING (id = auth.uid());

-- Política para profiles: usuários só podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =====================================================
-- 2. HABILITAR RLS NAS TABELAS FINANCEIRAS
-- =====================================================

-- Habilitar RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela financeiro
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. REMOVER POLÍTICAS EXISTENTES (se houver conflitos)
-- =====================================================

-- Remover políticas existentes da tabela transactions
DROP POLICY IF EXISTS "transactions_tenant_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;

-- Remover políticas existentes da tabela payouts
DROP POLICY IF EXISTS "payouts_tenant_policy" ON public.payouts;
DROP POLICY IF EXISTS "payouts_select_policy" ON public.payouts;
DROP POLICY IF EXISTS "payouts_insert_policy" ON public.payouts;
DROP POLICY IF EXISTS "payouts_update_policy" ON public.payouts;
DROP POLICY IF EXISTS "payouts_delete_policy" ON public.payouts;

-- Remover políticas existentes da tabela financeiro
DROP POLICY IF EXISTS "financeiro_tenant_policy" ON public.financeiro;
DROP POLICY IF EXISTS "financeiro_select_policy" ON public.financeiro;
DROP POLICY IF EXISTS "financeiro_insert_policy" ON public.financeiro;
DROP POLICY IF EXISTS "financeiro_update_policy" ON public.financeiro;
DROP POLICY IF EXISTS "financeiro_delete_policy" ON public.financeiro;

-- =====================================================
-- 4. CRIAR FUNÇÃO AUXILIAR PARA OBTER TENANT_ID
-- =====================================================

-- Função para obter tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retorna o tenant_id do perfil do usuário autenticado
    RETURN (
        SELECT tenant_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- =====================================================
-- 5. POLÍTICAS RLS PARA TABELA TRANSACTIONS
-- =====================================================

-- Política de SELECT: usuários só veem transações do seu tenant
CREATE POLICY "transactions_select_policy" ON public.transactions
    FOR SELECT
    USING (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de INSERT: usuários só podem inserir no seu tenant
CREATE POLICY "transactions_insert_policy" ON public.transactions
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de UPDATE: usuários só podem atualizar do seu tenant
CREATE POLICY "transactions_update_policy" ON public.transactions
    FOR UPDATE
    USING (
        tenant_id = public.get_user_tenant_id()
    )
    WITH CHECK (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de DELETE: usuários só podem deletar do seu tenant
CREATE POLICY "transactions_delete_policy" ON public.transactions
    FOR DELETE
    USING (
        tenant_id = public.get_user_tenant_id()
    );

-- =====================================================
-- 6. POLÍTICAS RLS PARA TABELA PAYOUTS
-- =====================================================

-- Política de SELECT: usuários só veem payouts do seu tenant
CREATE POLICY "payouts_select_policy" ON public.payouts
    FOR SELECT
    USING (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de INSERT: usuários só podem inserir no seu tenant
CREATE POLICY "payouts_insert_policy" ON public.payouts
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de UPDATE: usuários só podem atualizar do seu tenant
CREATE POLICY "payouts_update_policy" ON public.payouts
    FOR UPDATE
    USING (
        tenant_id = public.get_user_tenant_id()
    )
    WITH CHECK (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de DELETE: usuários só podem deletar do seu tenant
CREATE POLICY "payouts_delete_policy" ON public.payouts
    FOR DELETE
    USING (
        tenant_id = public.get_user_tenant_id()
    );

-- =====================================================
-- 7. POLÍTICAS RLS PARA TABELA FINANCEIRO
-- =====================================================

-- Política de SELECT: usuários só veem dados financeiros do seu tenant
CREATE POLICY "financeiro_select_policy" ON public.financeiro
    FOR SELECT
    USING (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de INSERT: usuários só podem inserir no seu tenant
CREATE POLICY "financeiro_insert_policy" ON public.financeiro
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de UPDATE: usuários só podem atualizar do seu tenant
CREATE POLICY "financeiro_update_policy" ON public.financeiro
    FOR UPDATE
    USING (
        tenant_id = public.get_user_tenant_id()
    )
    WITH CHECK (
        tenant_id = public.get_user_tenant_id()
    );

-- Política de DELETE: usuários só podem deletar do seu tenant
CREATE POLICY "financeiro_delete_policy" ON public.financeiro
    FOR DELETE
    USING (
        tenant_id = public.get_user_tenant_id()
    );

-- =====================================================
-- 8. CRIAR USUÁRIO DE TESTE (OPCIONAL)
-- =====================================================

-- NOTA: Para criar um usuário de teste, você deve:
-- 1. Primeiro criar o usuário via Supabase Auth (Dashboard ou API)
-- 2. Depois inserir o perfil correspondente na tabela profiles
-- 
-- Exemplo de como inserir perfil após criar usuário:
-- INSERT INTO public.profiles (id, tenant_id)
-- VALUES (
--     'SEU_USER_ID_AQUI'::uuid,
--     'SEU_TENANT_ID_AQUI'::uuid
-- );
--
-- O script não cria usuários automaticamente para evitar
-- violações de chave estrangeira com auth.users

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as políticas foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('transactions', 'payouts', 'financeiro', 'profiles')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('transactions', 'payouts', 'financeiro', 'profiles')
ORDER BY tablename;

-- Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'payouts', 'financeiro', 'profiles')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no Supabase SQL Editor como administrador
-- 2. Verifique se não há erros durante a execução
-- 3. Configure autenticação no Supabase Dashboard (Email/Password)
-- 4. Crie um usuário de teste via interface ou SQL
-- 5. Teste o acesso com test_auth_frontend.js
-- 6. Valide isolamento de dados por tenant

-- =====================================================
-- ROLLBACK (se necessário):
-- =====================================================
-- Para desabilitar RLS (CUIDADO - remove proteção):
-- ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payouts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.financeiro DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Para remover função:
-- DROP FUNCTION IF EXISTS public.get_user_tenant_id();

-- =====================================================
-- SUCESSO!
-- =====================================================
-- Script executado com sucesso! RLS configurado nas tabelas financeiras.
-- Próximos passos:
-- 1. Configure autenticação no Supabase Dashboard
-- 2. Crie usuário de teste
-- 3. Execute test_auth_frontend.js para validar

SELECT 
    'Script executado com sucesso! RLS configurado nas tabelas financeiras.' as status,
    'Configure autenticação no Supabase Dashboard' as proximo_passo_1,
    'Crie usuário de teste' as proximo_passo_2,
    'Execute test_auth_frontend.js para validar' as proximo_passo_3;