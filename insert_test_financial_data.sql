-- =====================================================
-- INSERÇÃO DE DADOS DE TESTE - Tabelas Financeiras
-- =====================================================
-- Execute no Supabase SQL Editor
-- Este script insere dados de teste para validar a página Financeiro

-- Tenant ID usado na aplicação
-- d93bd1e5-245e-4a40-9027-4bd669ccc390

-- =====================================================
-- 1. VERIFICAR SE A TABELA TRANSACTIONS EXISTE
-- =====================================================

DO $$
BEGIN
    -- Verificar se a tabela transactions existe e tem as colunas necessárias
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela transactions não existe. Execute primeiro o setup_rls_policies_corrigido.sql';
    END IF;
    
    -- Verificar se as colunas necessárias existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type' AND table_schema = 'public') THEN
        -- Adicionar coluna type se não existir
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) CHECK (type IN ('income', 'expense'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'counterparty' AND table_schema = 'public') THEN
        -- Adicionar coluna counterparty se não existir
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS counterparty VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'transaction_date' AND table_schema = 'public') THEN
        -- Adicionar coluna transaction_date se não existir
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description' AND table_schema = 'public') THEN
        -- Adicionar coluna description se não existir
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description TEXT;
    END IF;
END $$;

-- =====================================================
-- 2. LIMPAR DADOS EXISTENTES (OPCIONAL)
-- =====================================================

-- Remover dados existentes do tenant de teste
DELETE FROM public.transactions 
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';

-- =====================================================
-- 3. INSERIR DADOS DE RECEITAS (INCOME)
-- =====================================================

-- Receitas totais esperadas: R$ 31.500,00
INSERT INTO public.transactions (
    tenant_id,
    type,
    counterparty,
    gross_amount,
    fee_amount,
    net_amount,
    transaction_date,
    description
) VALUES 
-- Show 1 - R$ 8.500
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'income', 'Casa de Shows Aurora', 8500.00, 850.00, 7650.00, '2024-01-15', 'Show Casa de Shows Aurora'),
-- Show 2 - R$ 6.200
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'income', 'Bar do Rock', 6200.00, 620.00, 5580.00, '2024-01-22', 'Apresentação Bar do Rock'),
-- Show 3 - R$ 7.800
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'income', 'Festival de Verão', 7800.00, 780.00, 7020.00, '2024-02-05', 'Festival de Verão 2024'),
-- Show 4 - R$ 5.500
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'income', 'Clube da Música', 5500.00, 550.00, 4950.00, '2024-02-18', 'Show Clube da Música'),
-- Show 5 - R$ 3.500
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'income', 'Pub Irlandês', 3500.00, 350.00, 3150.00, '2024-03-02', 'Apresentação Pub Irlandês');

-- =====================================================
-- 4. INSERIR DADOS DE DESPESAS (EXPENSE)
-- =====================================================

-- Despesas totais esperadas: R$ 8.800,00
INSERT INTO public.transactions (
    tenant_id,
    type,
    counterparty,
    gross_amount,
    fee_amount,
    net_amount,
    transaction_date,
    description
) VALUES 
-- Equipamentos - R$ 2.500
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'expense', 'Music Store Pro', 2500.00, 0.00, 2500.00, '2024-01-10', 'Compra de equipamentos de som'),
-- Transporte - R$ 1.200
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'expense', 'Van Express', 1200.00, 0.00, 1200.00, '2024-01-20', 'Transporte para shows'),
-- Estúdio - R$ 3.500
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'expense', 'Estúdio Harmony', 3500.00, 0.00, 3500.00, '2024-02-01', 'Gravação de álbum'),
-- Marketing - R$ 800
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'expense', 'Agência Digital', 800.00, 0.00, 800.00, '2024-02-10', 'Campanha de marketing digital'),
-- Manutenção - R$ 600
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'expense', 'Tech Music Repair', 600.00, 0.00, 600.00, '2024-02-25', 'Manutenção de instrumentos'),
-- Hospedagem - R$ 200
('d93bd1e5-245e-4a40-9027-4bd669ccc390', 'expense', 'Hotel Central', 200.00, 0.00, 200.00, '2024-03-05', 'Hospedagem para show');

-- =====================================================
-- 5. VERIFICAR DADOS INSERIDOS
-- =====================================================

-- Verificar totais por tipo
SELECT 
    type,
    COUNT(*) as quantidade,
    SUM(gross_amount) as total_bruto,
    SUM(net_amount) as total_liquido
FROM public.transactions 
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390'
GROUP BY type
ORDER BY type;

-- Verificar contrapartes únicas
SELECT 
    COUNT(DISTINCT counterparty) as contrapartes_unicas,
    array_agg(DISTINCT counterparty ORDER BY counterparty) as lista_contrapartes
FROM public.transactions 
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390'
    AND counterparty IS NOT NULL;

-- Verificar saldo total
SELECT 
    SUM(CASE WHEN type = 'income' THEN gross_amount ELSE 0 END) as total_receitas,
    SUM(CASE WHEN type = 'expense' THEN gross_amount ELSE 0 END) as total_despesas,
    SUM(CASE WHEN type = 'income' THEN gross_amount ELSE -gross_amount END) as saldo_total
FROM public.transactions 
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';

-- Listar todas as transações inseridas
SELECT 
    type,
    counterparty,
    gross_amount,
    transaction_date,
    description
FROM public.transactions 
WHERE tenant_id = 'd93bd1e5-245e-4a40-9027-4bd669ccc390'
ORDER BY transaction_date, type;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Receitas: R$ 31.500,00 (5 transações)
-- Despesas: R$ 8.800,00 (6 transações)
-- Saldo Total: R$ 22.700,00
-- Contrapartes: 11 únicas
-- =====================================================

SELECT 
    'Dados de teste inseridos com sucesso!' as status,
    'Receitas esperadas: R$ 31.500,00' as receitas,
    'Despesas esperadas: R$ 8.800,00' as despesas,
    'Saldo esperado: R$ 22.700,00' as saldo,
    'Contrapartes: 11 únicas' as contrapartes;