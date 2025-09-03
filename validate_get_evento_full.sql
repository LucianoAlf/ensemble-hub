-- Validação: Por que get_evento_full retorna "Evento não encontrado"
-- Substitua o ID pelo valor exibido no log do console
-- Exemplo: '8bd5616c-3326-4533-8fca-28d1f4789eb1'

-- 1) Verificar user_id atual
SELECT auth.uid() as user_id;

-- 2) Tenant do usuário atual
SELECT tenant_id as tenant_user 
FROM public.profiles 
WHERE id = auth.uid();

-- 3) Evento existe?
SELECT id, tenant_id as tenant_event 
FROM public.evento 
WHERE id = '8bd5616c-3326-4533-8fca-28d1f4789eb1'::uuid;

-- 4) RPC bruto (veja se retorna null/erro)
SELECT public.get_evento_full('8bd5616c-3326-4533-8fca-28d1f4789eb1'::uuid);

-- 5) Verificação adicional: Comparar tenant_id do usuário com tenant_id do evento
SELECT 
    p.tenant_id as user_tenant,
    e.tenant_id as event_tenant,
    CASE 
        WHEN p.tenant_id = e.tenant_id THEN 'MATCH' 
        ELSE 'MISMATCH' 
    END as tenant_comparison
FROM public.profiles p
CROSS JOIN public.evento e
WHERE p.id = auth.uid() 
    AND e.id = '8bd5616c-3326-4533-8fca-28d1f4789eb1'::uuid;

-- 6) Verificar se a função get_evento_full existe e suas permissões
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'get_evento_full' 
    AND routine_schema = 'public';