-- DIAGNÓSTICO DA TABELA PROFILES
-- Execute estes comandos no Supabase SQL Editor ou psql

-- 1) Estrutura da tabela profiles
\d+ public.profiles;

-- 2) Verificar extensões instaladas
SELECT * FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp');

-- 3) Listar triggers da tabela profiles
SELECT 
    tgname as trigger_name,
    tgtype::int as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid='public.profiles'::regclass;

-- 4) Listar políticas RLS da tabela profiles
SELECT 
    policyname as policy_name,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname='public' AND tablename='profiles';

-- 5) Verificar constraints e foreign keys
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- 6) Verificar dados existentes na tabela
SELECT 
    COUNT(*) as total_profiles,
    COUNT(id) as profiles_with_id,
    COUNT(*) - COUNT(id) as profiles_with_null_id
FROM public.profiles;

-- 7) Verificar se há usuários sem profile
SELECT 
    COUNT(au.id) as users_without_profile
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;