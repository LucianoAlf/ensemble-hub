-- Fix remaining function that shows up in security linter
-- The update_updated_at_column function needs SET search_path

DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;