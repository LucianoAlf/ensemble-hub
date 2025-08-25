-- Fix remaining function that still needs SET search_path
-- We need to use CASCADE to drop the function and then recreate the trigger

-- Drop function with CASCADE to remove the trigger dependency
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
begin
  insert into public.profiles (id, display_name, tenant_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    nullif(new.raw_user_meta_data->>'tenant_id','')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- Recreate the trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample unidades for testing
INSERT INTO public.unidade (nome, tenant_id) 
SELECT 'Unidade Central', p.tenant_id 
FROM public.profiles p 
WHERE p.tenant_id IS NOT NULL 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.unidade (nome, tenant_id) 
SELECT 'Unidade Norte', p.tenant_id 
FROM public.profiles p 
WHERE p.tenant_id IS NOT NULL 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update vw_eventos_proximos view to work correctly
DROP VIEW IF EXISTS public.vw_eventos_proximos;
CREATE VIEW public.vw_eventos_proximos AS
SELECT 
  e.id,
  e.titulo,
  e.tipo,
  e.inicio,
  e.fim, 
  e.local,
  e.endereco,
  e.orcamento,
  e.status,
  e.descricao,
  e.banda_id,
  e.unidade_id,
  e.tenant_id,
  e.sala_id,
  e.created_at,
  b.nome as banda_nome
FROM public.evento e
LEFT JOIN public.banda b ON e.banda_id = b.id
WHERE e.inicio >= CURRENT_DATE - INTERVAL '1 day'
  AND e.inicio <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY e.inicio ASC;