-- Script para criar tabelas faltantes e configurar sistema de multi-tenancy

-- 1. Criar tabela de tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de relacionamento user-tenant
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. Inserir tenant de teste
INSERT INTO public.tenants (id, name, slug) 
VALUES ('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'Ensemble Hub Test', 'ensemble-hub-test')
ON CONFLICT (id) DO NOTHING;

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their tenants" ON public.tenants
    FOR UPDATE USING (
        id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- 6. Criar políticas RLS para user_tenants
CREATE POLICY "Users can view their tenant relationships" ON public.user_tenants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage tenant relationships" ON public.user_tenants
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- 7. Atualizar políticas RLS da tabela transactions
DROP POLICY IF EXISTS "Users can view their tenant transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their tenant transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their tenant transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their tenant transactions" ON public.transactions;

CREATE POLICY "Users can view their tenant transactions" ON public.transactions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their tenant transactions" ON public.transactions
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their tenant transactions" ON public.transactions
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their tenant transactions" ON public.transactions
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

-- 8. Atualizar políticas RLS da tabela payouts (se necessário)
DROP POLICY IF EXISTS "Users can view their tenant payouts" ON public.payouts;
DROP POLICY IF EXISTS "Users can insert their tenant payouts" ON public.payouts;
DROP POLICY IF EXISTS "Users can update their tenant payouts" ON public.payouts;
DROP POLICY IF EXISTS "Users can delete their tenant payouts" ON public.payouts;

CREATE POLICY "Users can view their tenant payouts" ON public.payouts
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their tenant payouts" ON public.payouts
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their tenant payouts" ON public.payouts
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their tenant payouts" ON public.payouts
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants 
            WHERE user_id = auth.uid()
        )
    );

-- 9. Criar função para associar usuário ao tenant automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar um tenant padrão para o novo usuário
    INSERT INTO public.tenants (name, slug)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
            LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', '-')));
    
    -- Associar o usuário ao tenant criado
    INSERT INTO public.user_tenants (user_id, tenant_id, role)
    VALUES (NEW.id, 
            (SELECT id FROM public.tenants WHERE slug = LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', '-'))),
            'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Comentários explicativos
COMMENT ON TABLE public.tenants IS 'Tabela de tenants/organizações do sistema';
COMMENT ON TABLE public.user_tenants IS 'Relacionamento many-to-many entre usuários e tenants';
COMMENT ON COLUMN public.user_tenants.role IS 'Papel do usuário no tenant: owner, admin, member';

-- Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'user_tenants')
ORDER BY table_name;