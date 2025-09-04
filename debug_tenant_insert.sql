-- Script para debugar problema de inserção na tabela tenants
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas RLS atuais da tabela tenants
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tenants';

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tenants';

-- 3. Verificar usuário atual
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_user_email;

-- 4. Tentar inserção manual simples
INSERT INTO tenants (name, slug) 
VALUES ('Tenant Teste Manual', 'tenant-teste-manual');

-- 5. Verificar se a inserção funcionou
SELECT * FROM tenants WHERE slug = 'tenant-teste-manual';

-- 6. Se a inserção falhou, vamos tentar desabilitar RLS temporariamente
-- (CUIDADO: só para teste, não usar em produção)
-- ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
-- INSERT INTO tenants (name, slug) VALUES ('Tenant Teste Sem RLS', 'tenant-teste-sem-rls');
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 7. Verificar todas as tabelas com RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY tablename;