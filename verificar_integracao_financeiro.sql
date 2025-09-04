-- Script para verificar integração real vs mockada da página Financeiro
-- Executar no SQL Editor do Supabase

-- 1. Listar todas as tabelas financeiras
SELECT 'TABELAS FINANCEIRAS ENCONTRADAS:' as info;
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%financ%' 
   OR tablename LIKE '%transaction%' 
   OR tablename LIKE '%payout%'
ORDER BY tablename;

-- 2. Verificar estrutura da tabela transactions
SELECT 'ESTRUTURA DA TABELA TRANSACTIONS:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela financeiro
SELECT 'ESTRUTURA DA TABELA FINANCEIRO:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'financeiro' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Buscar valores específicos da tela (2500.00 e 3000.00)
SELECT 'TRANSAÇÕES COM VALORES ESPECÍFICOS (2500.00 ou 3000.00):' as info;
SELECT 
    id,
    type,
    description,
    gross_amount,
    net_amount,
    transaction_date,
    created_at
FROM transactions 
WHERE gross_amount = 2500.00 
   OR gross_amount = 3000.00
ORDER BY transaction_date DESC;

-- 5. Buscar transações com nomes específicos (João Silva, Maria Santos)
SELECT 'TRANSAÇÕES COM NOMES ESPECÍFICOS (João Silva, Maria Santos):' as info;
SELECT 
    id,
    type,
    description,
    gross_amount,
    net_amount,
    transaction_date,
    created_at
FROM transactions 
WHERE description ILIKE '%João Silva%' 
   OR description ILIKE '%Maria Santos%'
ORDER BY transaction_date DESC;

-- 6. Verificar dados recentes (últimas 10 transações)
SELECT 'ÚLTIMAS 10 TRANSAÇÕES:' as info;
SELECT 
    id,
    type,
    description,
    gross_amount,
    net_amount,
    transaction_date,
    created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Verificar totais de receitas (income)
SELECT 'TOTAL DE RECEITAS (INCOME):' as info;
SELECT 
    COUNT(*) as total_receitas,
    SUM(gross_amount) as total_bruto_receitas,
    SUM(net_amount) as total_liquido_receitas,
    AVG(gross_amount) as media_receitas
FROM transactions 
WHERE type = 'income';

-- 8. Verificar totais de despesas (expense)
SELECT 'TOTAL DE DESPESAS (EXPENSE):' as info;
SELECT 
    COUNT(*) as total_despesas,
    SUM(gross_amount) as total_bruto_despesas,
    SUM(net_amount) as total_liquido_despesas,
    AVG(gross_amount) as media_despesas
FROM transactions 
WHERE type = 'expense';

-- 9. Contar registros totais
SELECT 'CONTAGEM TOTAL DE REGISTROS:' as info;
SELECT 
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    (SELECT COUNT(*) FROM financeiro) as total_financeiro;

-- 10. Verificar distribuição por tipo de transação
SELECT 'DISTRIBUIÇÃO POR TIPO DE TRANSAÇÃO:' as info;
SELECT 
    type,
    COUNT(*) as quantidade,
    SUM(gross_amount) as total_bruto,
    SUM(net_amount) as total_liquido,
    AVG(gross_amount) as media_bruto
FROM transactions 
GROUP BY type
ORDER BY type;

-- 11. Verificar transações por mês (últimos 6 meses)
SELECT 'TRANSAÇÕES POR MÊS (ÚLTIMOS 6 MESES):' as info;
SELECT 
    DATE_TRUNC('month', transaction_date) as mes,
    type,
    COUNT(*) as quantidade,
    SUM(gross_amount) as total_bruto
FROM transactions 
WHERE transaction_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', transaction_date), type
ORDER BY mes DESC, type;

-- 12. Verificar se existem dados mockados (padrões típicos)
SELECT 'POSSÍVEIS DADOS MOCKADOS (PADRÕES SUSPEITOS):' as info;
SELECT 
    'Valores redondos' as tipo_padrao,
    COUNT(*) as quantidade
FROM transactions 
WHERE gross_amount IN (1000, 1500, 2000, 2500, 3000, 5000, 10000)
UNION ALL
SELECT 
    'Descrições com Test/Mock' as tipo_padrao,
    COUNT(*) as quantidade
FROM transactions 
WHERE description ILIKE '%test%' 
   OR description ILIKE '%mock%' 
   OR description ILIKE '%exemplo%'
UNION ALL
SELECT 
    'Datas muito recentes (hoje)' as tipo_padrao,
    COUNT(*) as quantidade
FROM transactions 
WHERE DATE(transaction_date) = CURRENT_DATE;

-- 13. Verificar políticas RLS ativas
SELECT 'POLÍTICAS RLS ATIVAS:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('transactions', 'financeiro', 'payouts')
ORDER BY tablename, policyname;

-- 14. Verificar se RLS está habilitado
SELECT 'STATUS RLS DAS TABELAS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('transactions', 'financeiro', 'payouts')
ORDER BY tablename;

-- 15. Resumo final
SELECT 'RESUMO FINAL DA ANÁLISE:' as info;
SELECT 
    'Total de tabelas financeiras' as metrica,
    COUNT(*)::text as valor
FROM pg_tables 
WHERE tablename LIKE '%financ%' 
   OR tablename LIKE '%transaction%' 
   OR tablename LIKE '%payout%'
UNION ALL
SELECT 
    'Total de transações' as metrica,
    COUNT(*)::text as valor
FROM transactions
UNION ALL
SELECT 
    'Total de registros financeiro' as metrica,
    COUNT(*)::text as valor
FROM financeiro
UNION ALL
SELECT 
    'Valor total bruto' as metrica,
    COALESCE(SUM(gross_amount), 0)::text as valor
FROM transactions
UNION ALL
SELECT 
    'Última transação' as metrica,
    COALESCE(TO_CHAR(MAX(transaction_date), 'DD/MM/YYYY'), 'Nenhuma') as valor
FROM transactions;