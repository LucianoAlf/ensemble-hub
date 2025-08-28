-- Verificar permissões atuais das tabelas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('evento', 'transactions', 'payouts')
ORDER BY table_name, grantee;

-- Conceder permissões básicas para o role anon (usuários não autenticados)
GRANT SELECT ON evento TO anon;
GRANT SELECT ON transactions TO anon;
GRANT SELECT ON payouts TO anon;

-- Conceder permissões completas para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON evento TO authenticated;
GRANT ALL PRIVILEGES ON transactions TO authenticated;
GRANT ALL PRIVILEGES ON payouts TO authenticated;

-- Verificar novamente as permissões após a concessão
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('evento', 'transactions', 'payouts')
ORDER BY table_name, grantee;