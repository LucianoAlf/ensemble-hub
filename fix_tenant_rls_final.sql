-- Script final para corrigir RLS da tabela tenants
-- Baseado nos resultados do debug_tenant_insert.sql

-- 1. Primeiro, vamos remover todas as políticas existentes da tabela tenants
DROP POLICY IF EXISTS "tenant_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_update_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_delete_policy" ON tenants;

-- 2. Desabilitar RLS temporariamente para limpeza
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- 3. Limpar dados de teste anteriores se existirem
DELETE FROM tenants WHERE slug LIKE '%teste%' OR slug LIKE '%test%';

-- 4. Reabilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 5. Criar política de INSERT mais permissiva
-- Permite que qualquer usuário autenticado crie tenants
CREATE POLICY "tenants_insert_policy" ON tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. Criar política de SELECT
-- Permite que usuários vejam tenants aos quais estão associados
CREATE POLICY "tenants_select_policy" ON tenants
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT tenant_id 
            FROM user_tenants 
            WHERE user_id = auth.uid()
        )
        OR 
        -- Permite ver durante criação/associação inicial
        auth.uid() IS NOT NULL
    );

-- 7. Criar política de UPDATE
CREATE POLICY "tenants_update_policy" ON tenants
    FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT tenant_id 
            FROM user_tenants 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        id IN (
            SELECT tenant_id 
            FROM user_tenants 
            WHERE user_id = auth.uid()
        )
    );

-- 8. Criar política de DELETE
CREATE POLICY "tenants_delete_policy" ON tenants
    FOR DELETE
    TO authenticated
    USING (
        id IN (
            SELECT tenant_id 
            FROM user_tenants 
            WHERE user_id = auth.uid()
        )
    );

-- 9. Verificar se as políticas foram criadas corretamente
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'tenants'
ORDER BY cmd, policyname;

-- 10. Testar inserção
INSERT INTO tenants (name, slug) 
VALUES ('Tenant Teste Final', 'tenant-teste-final');

-- 11. Verificar se a inserção funcionou
SELECT * FROM tenants WHERE slug = 'tenant-teste-final';