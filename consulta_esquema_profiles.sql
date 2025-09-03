-- CONSULTA ESQUEMA EXATO DA TABELA PROFILES
-- Execute no Supabase SQL Editor

-- 1) Mostrar colunas (nome, tipo, not null, default, pk/fk)
\d+ public.profiles;

-- 2) Informações detalhadas das colunas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='profiles' 
ORDER BY ordinal_position;

-- 3) Listar políticas RLS de profiles
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname='public' AND tablename='profiles';

-- 4) Verificar constraints (PK, FK, etc.)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'profiles';

-- 5) Verificar se existe coluna full_name ou similar
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema='public' 
  AND table_name='profiles' 
  AND column_name ILIKE '%name%';

-- 6) Verificar todas as colunas disponíveis para o UPSERT
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='profiles'
ORDER BY ordinal_position;

-- EXEMPLOS DE UPSERT BASEADOS NO ESQUEMA REAL:

-- Exemplo 1: Se existir coluna 'full_name'
/*
INSERT INTO public.profiles (id, full_name) 
VALUES (auth.uid(), 'Nome Teste') 
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
*/

-- Exemplo 2: Se existir coluna 'name' 
/*
INSERT INTO public.profiles (id, name) 
VALUES (auth.uid(), 'Nome Teste') 
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW();
*/

-- Exemplo 3: UPSERT mínimo (apenas id)
/*
INSERT INTO public.profiles (id) 
VALUES (auth.uid()) 
ON CONFLICT (id) DO NOTHING;
*/

-- TESTE SEM CONTEXTO DE USUÁRIO (usando ID específico):
-- Primeiro, obter um ID de usuário existente:
/*
SELECT id FROM auth.users LIMIT 1;

-- Depois usar o ID no UPSERT:
INSERT INTO public.profiles (id, [campo_nome]) 
VALUES ('[id_do_usuario]', 'Nome Teste') 
ON CONFLICT (id) DO UPDATE SET 
    [campo_nome] = EXCLUDED.[campo_nome],
    updated_at = NOW();
*/

-- VERIFICAÇÃO FINAL:
-- Verificar se o UPSERT funcionou
/*
SELECT * FROM public.profiles WHERE id = auth.uid();
-- ou
SELECT * FROM public.profiles WHERE id = '[id_do_usuario]';
*/