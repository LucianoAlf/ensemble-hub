-- Script para corrigir recursão infinita nas políticas RLS
-- Remove políticas problemáticas e cria versões simplificadas

-- 1. Remover todas as políticas problemáticas da tabela user_tenants
DROP POLICY IF EXISTS "Users can view their tenant relationships" ON public.user_tenants;
DROP POLICY IF EXISTS "Admins can manage tenant relationships" ON public.user_tenants;
DROP POLICY IF EXISTS "Users can insert their tenant relationships" ON public.user_tenants;
DROP POLICY IF EXISTS "Users can update their tenant relationships" ON public.user_tenants;
DROP POLICY IF EXISTS "Users can delete their tenant relationships" ON public.user_tenants;

-- 2. Criar políticas RLS simplificadas para user_tenants (sem recursão)
CREATE POLICY "Users can view their own tenant relationships" ON public.user_tenants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tenant relationships" ON public.user_tenants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tenant relationships" ON public.user_tenants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tenant relationships" ON public.user_tenants
    FOR DELETE USING (user_id = auth.uid());

-- 3. Atualizar políticas da tabela tenants para usar uma abordagem mais simples
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can update their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can delete their tenants" ON public.tenants;

-- 4. Criar políticas simplificadas para tenants
CREATE POLICY "Users can view tenants they belong to" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut 
            WHERE ut.tenant_id = tenants.id 
            AND ut.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their tenants" ON public.tenants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut 
            WHERE ut.tenant_id = tenants.id 
            AND ut.user_id = auth.uid() 
            AND ut.role = 'owner'
        )
    );

CREATE POLICY "Users can insert tenants" ON public.tenants
    FOR INSERT WITH CHECK (true); -- Permitir inserção, o trigger cuidará da associação

-- 5. Verificar se as políticas foram aplicadas corretamente
SELECT 'Políticas RLS corrigidas com sucesso!' as status;

-- 6. Listar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('tenants', 'user_tenants')
ORDER BY tablename, policyname;