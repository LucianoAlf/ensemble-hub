-- =====================================================
-- CONFIGURAÇÃO DE POLÍTICAS RLS - Tabelas Financeiras
-- =====================================================
-- Execute no Supabase SQL Editor (como administrador)
-- ATENÇÃO: Este script fará alterações no banco de dados

-- =====================================================
-- 1. HABILITAR RLS NAS TABELAS (se não estiver habilitado)
-- =====================================================

-- Habilitar RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela financeiro
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. REMOVER POLÍTICAS EXISTENTES (se houver conflitos)
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
-- 3. CRIAR FUNÇÃO AUXILIAR PARA OBTER TENANT_ID
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
-- 4. POLÍTICAS RLS PARA TABELA TRANSACTIONS
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
-- 5. POLÍTICAS RLS PARA TABELA PAYOUTS
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
-- 6. POLÍTICAS RLS PARA TABELA FINANCEIRO
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
-- 7. VERIFICAÇÃO FINAL
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
    AND tablename IN ('transactions', 'payouts', 'financeiro')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('transactions', 'payouts', 'financeiro')
ORDER BY tablename;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no Supabase SQL Editor como administrador
-- 2. Verifique se não há erros durante a execução
-- 3. Teste o acesso com usuário autenticado usando check_rls_policies.sql
-- 4. Se houver problemas, verifique se:
--    - A tabela profiles existe e tem coluna tenant_id
--    - Os usuários têm registros na tabela profiles
--    - As tabelas financeiras têm coluna tenant_id

-- =====================================================
-- ROLLBACK (se necessário):
-- =====================================================
-- Para desabilitar RLS (CUIDADO - remove proteção):
-- ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payouts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.financeiro DISABLE ROW LEVEL SECURITY;