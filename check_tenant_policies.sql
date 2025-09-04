-- Verificar políticas RLS atuais da tabela tenants
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tenants'
ORDER BY cmd, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tenants';

-- Testar inserção manual para debug
-- INSERT INTO tenants (id, name, created_at, updated_at) 
-- VALUES (
--     gen_random_uuid(),
--     'Tenant de Teste',
--     NOW(),
--     NOW()
-- );

-- Verificar usuário atual
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_user_email;

-- Verificar se existe algum registro em user_tenants
SELECT COUNT(*) as user_tenants_count FROM user_tenants;

-- Verificar estrutura da tabela tenants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
    AND table_schema = 'public'
ORDER BY ordinal_position;