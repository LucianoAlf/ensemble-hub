-- Diagnóstico: Por que get_dashboard_metrics retorna "User must have a tenant_id"

-- 1) Verificar se o usuário está autenticado
SELECT auth.uid() as current_user_id;

-- 2) Verificar se existe perfil para o usuário
SELECT 
    id,
    tenant_id,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- 3) Verificar se a tabela profiles tem dados
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 4) Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5) Verificar se há trigger para criar perfil automaticamente
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
    OR action_statement LIKE '%profiles%';

-- 6) Verificar políticas RLS na tabela profiles
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
WHERE tablename = 'profiles';

-- 7) Tentar criar perfil manualmente (se não existir)
-- CUIDADO: Execute apenas se não houver perfil
/*
INSERT INTO public.profiles (id, tenant_id)
SELECT 
    auth.uid(),
    gen_random_uuid()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
);
*/

-- 8) Verificar novamente após possível criação
SELECT 
    id,
    tenant_id,
    'Profile exists' as status
FROM public.profiles 
WHERE id = auth.uid();

-- 9) Testar get_dashboard_metrics após correção
-- SELECT public.get_dashboard_metrics();