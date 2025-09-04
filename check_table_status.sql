-- =====================================================
-- VERIFICAÇÃO DO STATUS DAS TABELAS
-- =====================================================
-- Execute no Supabase SQL Editor

-- 1. Verificar se a tabela transactions existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'transactions' 
    AND table_schema = 'public';

-- 2. Verificar estrutura da tabela transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_registros
FROM public.transactions;

-- 4. Verificar dados por tenant_id
SELECT 
    tenant_id,
    COUNT(*) as quantidade
FROM public.transactions
GROUP BY tenant_id;

-- 5. Verificar dados específicos do tenant de teste
SELECT 
    id,
    tenant_id,
    type,
    counterparty,
    gross_amount,
    created_at
FROM public.transactions 
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390'
LIMIT 10;

-- 6. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 7. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'transactions' 
    AND schemaname = 'public';

-- 8. Tentar inserir um registro de teste simples
INSERT INTO public.transactions (
    tenant_id,
    gross_amount,
    fee_amount,
    net_amount
) VALUES (
    'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    100.00,
    10.00,
    90.00
) ON CONFLICT DO NOTHING;

-- 9. Verificar novamente após inserção
SELECT COUNT(*) as total_apos_insercao
FROM public.transactions
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';