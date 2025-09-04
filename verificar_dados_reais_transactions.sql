-- Script para verificar dados reais da tabela transactions
-- Executar no SQL Editor do Supabase

-- 1. Consulta principal solicitada pelo usuário
SELECT 'DADOS REAIS DA TABELA TRANSACTIONS:' as info;
SELECT 
    description, 
    gross_amount, 
    type, 
    transaction_date, 
    counterparty 
FROM transactions 
ORDER BY transaction_date DESC;

-- 2. Verificar estrutura completa da tabela
SELECT 'ESTRUTURA COMPLETA DA TABELA:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Contagem total de registros
SELECT 'TOTAL DE REGISTROS:' as info;
SELECT COUNT(*) as total_transactions FROM transactions;

-- 4. Verificar valores únicos na coluna counterparty
SELECT 'VALORES ÚNICOS EM COUNTERPARTY:' as info;
SELECT 
    counterparty,
    COUNT(*) as quantidade
FROM transactions 
WHERE counterparty IS NOT NULL
GROUP BY counterparty
ORDER BY quantidade DESC;

-- 5. Verificar tipos de transação
SELECT 'TIPOS DE TRANSAÇÃO:' as info;
SELECT 
    type,
    COUNT(*) as quantidade,
    SUM(gross_amount) as total_valor
FROM transactions 
GROUP BY type
ORDER BY type;

-- 6. Verificar range de datas
SELECT 'RANGE DE DATAS:' as info;
SELECT 
    MIN(transaction_date) as primeira_transacao,
    MAX(transaction_date) as ultima_transacao,
    COUNT(DISTINCT DATE(transaction_date)) as dias_com_transacoes
FROM transactions;

-- 7. Verificar campos nulos
SELECT 'CAMPOS NULOS:' as info;
SELECT 
    'description' as campo,
    COUNT(*) - COUNT(description) as nulos
FROM transactions
UNION ALL
SELECT 
    'counterparty' as campo,
    COUNT(*) - COUNT(counterparty) as nulos
FROM transactions
UNION ALL
SELECT 
    'gross_amount' as campo,
    COUNT(*) - COUNT(gross_amount) as nulos
FROM transactions;

-- 8. Amostra de dados para análise
SELECT 'AMOSTRA DE 5 REGISTROS:' as info;
SELECT 
    id,
    description,
    gross_amount,
    net_amount,
    type,
    transaction_date,
    counterparty,
    created_at
FROM transactions 
ORDER BY created_at DESC
LIMIT 5;

-- 9. Verificar padrões suspeitos (dados mockados)
SELECT 'POSSÍVEIS PADRÕES MOCKADOS:' as info;
SELECT 
    'Descrições com padrão repetitivo' as tipo_padrao,
    COUNT(*) as ocorrencias
FROM transactions 
WHERE description LIKE '%Pagamento%' 
   OR description LIKE '%Recebimento%'
   OR description LIKE '%Teste%'
   OR description LIKE '%Mock%'
   OR description LIKE '%Sample%'
UNION ALL
SELECT 
    'Valores redondos (múltiplos de 100)' as tipo_padrao,
    COUNT(*) as ocorrencias
FROM transactions 
WHERE gross_amount::numeric % 100 = 0
UNION ALL
SELECT 
    'Datas em sequência ou padrão' as tipo_padrao,
    COUNT(*) as ocorrencias
FROM transactions 
WHERE DATE(transaction_date) = DATE(created_at);

-- 10. Resumo final
SELECT 'RESUMO FINAL:' as info;
SELECT 
    COUNT(*) as total_transacoes,
    COUNT(DISTINCT counterparty) as contrapartes_unicas,
    COUNT(DISTINCT type) as tipos_unicos,
    SUM(CASE WHEN type = 'income' THEN gross_amount ELSE 0 END) as total_receitas,
    SUM(CASE WHEN type = 'expense' THEN gross_amount ELSE 0 END) as total_despesas,
    SUM(gross_amount) as valor_total_bruto
FROM transactions;