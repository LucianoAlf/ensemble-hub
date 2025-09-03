-- CORREÇÃO DA TABELA PROFILES - PADRÃO SUPABASE
-- Execute estes comandos na ordem apresentada

-- PASSO 1: Backup dos dados existentes (opcional)
-- CREATE TABLE profiles_backup AS SELECT * FROM public.profiles;

-- PASSO 2: Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- PASSO 3: Limpar dados problemáticos (profiles com id NULL)
DELETE FROM public.profiles WHERE id IS NULL;

-- PASSO 4: Remover DEFAULT da coluna id (se existir)
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- PASSO 5: Adicionar foreign key para auth.users(id) com CASCADE
-- Primeiro, remover constraint existente se houver
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_auth_users;

-- Adicionar nova foreign key
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_auth_users 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- PASSO 6: Criar função handle_new_user atualizada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir novo profile com id do usuário
  INSERT INTO public.profiles (
    id, 
    email,
    display_name,
    tenant_id
  )
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'tenant_id', gen_random_uuid())
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- PASSO 7: Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 8: Criar profiles para usuários existentes sem profile
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  tenant_id
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) as display_name,
  COALESCE(au.raw_user_meta_data->>'tenant_id', gen_random_uuid()) as tenant_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- PASSO 9: Verificação final
SELECT 
  'Usuários sem profile' as check_type,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Profiles com id NULL' as check_type,
  COUNT(*) as count
FROM public.profiles
WHERE id IS NULL

UNION ALL

SELECT 
  'Total de profiles' as check_type,
  COUNT(*) as count
FROM public.profiles;

-- COMENTÁRIOS:
-- 1. Esta correção remove o DEFAULT da coluna id para evitar UUIDs aleatórios
-- 2. Adiciona FK com CASCADE para manter integridade referencial
-- 3. O trigger agora usa o id do auth.users diretamente
-- 4. Cria profiles para usuários existentes que não têm profile
-- 5. Usa gen_random_uuid() para tenant_id se não estiver nos metadados