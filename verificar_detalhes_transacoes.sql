-- Script para verificar detalhes das 12 transações
-- Executar no SQL Editor do Supabase para confirmar dados da tela

-- 1. Listar todas as transações ordenadas por data (mais recentes primeiro)
SELECT 'TODAS AS TRANSAÇÕES (ORDENADAS POR DATA):' as info;
SELECT 
    id,
    description, 
    gross_amount, 
    net_amount,
    type, 
    transaction_date,
    created_at
FROM transactions 
ORDER BY transaction_date DESC;

-- 2. Buscar transações específicas com nomes mencionados
SELECT 'TRANSAÇÕES COM NOMES ESPECÍFICOS:' as info;
SELECT 
    id,
    description,
    gross_amount,
    net_amount,
    type,
    transaction_date,
    created_at,
    updated_at
FROM transactions 
WHERE description LIKE '%João%' 
   OR description LIKE '%Maria%' 
   OR description LIKE '%Técnico%'
   OR description LIKE '%Silva%'
   OR description LIKE '%Santos%'
ORDER BY transaction_date DESC;

-- 3. Verificar valores específicos que aparecem na tela
SELECT 'TRANSAÇÕES COM VALORES ESPECÍFICOS DA TELA:' as info;
SELECT 
    id,
    description,
    gross_amount,
    net_amount,
    type,
    transaction_date
FROM transactions 
WHERE gross_amount IN (2500.00, 3000.00, 1500.00, 5000.00)
ORDER BY gross_amount DESC;

-- 4. Contar transações por tipo
SELECT 'CONTAGEM POR TIPO:' as info;
SELECT 
    type,
    COUNT(*) as quantidade,
    SUM(gross_amount) as total_bruto,
    AVG(gross_amount) as media
FROM transactions 
GROUP BY type
ORDER BY type;

-- 5. Verificar se existem transações duplicadas
SELECT 'POSSÍVEIS DUPLICATAS:' as info;
SELECT 
    description,
    gross_amount,
    type,
    COUNT(*) as ocorrencias
FROM transactions 
GROUP BY description, gross_amount, type
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;

-- 6. Verificar padrão de datas
SELECT 'DISTRIBUIÇÃO POR DATA:' as info;
SELECT 
    DATE(transaction_date) as data,
    COUNT(*) as transacoes_no_dia,
    SUM(gross_amount) as total_do_dia
FROM transactions 
GROUP BY DATE(transaction_date)
ORDER BY data DESC;

-- 7. Verificar estrutura completa de uma transação
SELECT 'ESTRUTURA COMPLETA DE UMA TRANSAÇÃO:' as info;
SELECT *
FROM transactions 
LIMIT 1;

-- 8. Verificar se há campos nulos importantes
SELECT 'VERIFICAÇÃO DE CAMPOS NULOS:' as info;
SELECT 
    'description' as campo,
    COUNT(*) as total_registros,
    COUNT(description) as nao_nulos,
    COUNT(*) - COUNT(description) as nulos
FROM transactions
UNION ALL
SELECT 
    'gross_amount' as campo,
    COUNT(*) as total_registros,
    COUNT(gross_amount) as nao_nulos,
    COUNT(*) - COUNT(gross_amount) as nulos
FROM transactions
UNION ALL
SELECT 
    'type' as campo,
    COUNT(*) as total_registros,
    COUNT(type) as nao_nulos,
    COUNT(*) - COUNT(type) as nulos
FROM transactions;

-- 9. Resumo final com totais
SELECT 'RESUMO FINAL:' as info;
SELECT 
    COUNT(*) as total_transacoes,
    SUM(CASE WHEN type = 'income' THEN gross_amount ELSE 0 END) as total_receitas,
    SUM(CASE WHEN type = 'expense' THEN gross_amount ELSE 0 END) as total_despesas,
    SUM(gross_amount) as total_geral,
    MIN(transaction_date) as primeira_transacao,
    MAX(transaction_date) as ultima_transacao
FROM transactions;