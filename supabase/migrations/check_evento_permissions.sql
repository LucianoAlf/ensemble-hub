-- Check permissions for evento table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'evento'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions if needed
GRANT SELECT ON evento TO anon;
GRANT ALL PRIVILEGES ON evento TO authenticated;

-- Check if there are any events in the table
SELECT COUNT(*) as total_eventos FROM evento;

-- Show sample events
SELECT id, titulo, tipo, inicio, tenant_id, created_at 
FROM evento 
ORDER BY created_at DESC 
LIMIT 5;