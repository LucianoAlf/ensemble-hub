-- Verificar estrutura da tabela transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'transactions';

-- Verificar dados existentes para entender o formato
SELECT 
    id,
    amount,
    type,
    category,
    description,
    counterparty,
    tenant_id
FROM transactions 
LIMIT 5;