-- Script para corrigir política de INSERT na tabela tenants
-- Permite que usuários autenticados criem tenants

-- 1. Remover política de INSERT existente (incompleta)
DROP POLICY IF EXISTS "Users can insert tenants" ON public.tenants;

-- 2. Criar política de INSERT corrigida
CREATE POLICY "Users can insert tenants" ON public.tenants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Verificar se a política foi aplicada
SELECT 'Política de INSERT para tenants corrigida!' as status;

-- 4. Listar políticas da tabela tenants
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tenants'
ORDER BY policyname;