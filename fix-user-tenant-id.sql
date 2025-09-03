-- Script para corrigir tenant_id do usuário
-- Execute este script no Supabase Dashboard > SQL Editor

-- Tenant ID padrão encontrado nas outras tabelas
\set tenant_id 'd93bd1e5-245e-4a40-9027-4bd669ccc390'

-- 1. Verificar perfis existentes
SELECT 
    'Perfis existentes:' as status,
    id,
    tenant_id,
    created_at,
    updated_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Verificar se existe algum usuário autenticado sem perfil
-- (Esta query pode não retornar resultados se não houver usuários ativos)
SELECT 
    'Usuários sem perfil:' as status,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Verificar perfis sem tenant_id
SELECT 
    'Perfis sem tenant_id:' as status,
    id,
    tenant_id,
    created_at
FROM profiles
WHERE tenant_id IS NULL;

-- 4. Atualizar perfis existentes sem tenant_id
UPDATE profiles 
SET 
    tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    updated_at = now()
WHERE tenant_id IS NULL;

-- 5. Criar perfis para usuários autenticados que não têm perfil
-- (Substitua 'USER_ID_AQUI' pelo ID do usuário específico se conhecido)
INSERT INTO profiles (id, tenant_id, created_at, updated_at)
SELECT 
    au.id,
    'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    now(),
    now()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Verificação final - mostrar todos os perfis
SELECT 
    'Perfis após correção:' as status,
    id,
    tenant_id,
    created_at,
    updated_at
FROM profiles
ORDER BY created_at DESC;

-- 7. Verificar se há dados nas tabelas principais com o tenant_id
SELECT 
    'Dados existentes por tenant_id:' as status,
    tenant_id,
    'banda' as tabela,
    COUNT(*) as total
FROM banda
GROUP BY tenant_id
UNION ALL
SELECT 
    'Dados existentes por tenant_id:' as status,
    tenant_id,
    'evento' as tabela,
    COUNT(*) as total
FROM evento
GROUP BY tenant_id
UNION ALL
SELECT 
    'Dados existentes por tenant_id:' as status,
    tenant_id,
    'banda_integrante' as tabela,
    COUNT(*) as total
FROM banda_integrante
GROUP BY tenant_id
ORDER BY tenant_id, tabela;

-- 8. Testar a função get_dashboard_metrics (se já estiver corrigida)
SELECT 
    'Teste da função get_dashboard_metrics:' as status,
    get_dashboard_metrics() as resultado;