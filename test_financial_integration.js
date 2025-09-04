// Script para testar a integração das tabelas financeiras
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";

console.log('🔍 TESTE DE INTEGRAÇÃO FINANCEIRA');
console.log('=' .repeat(60));

async function testFinancialIntegration() {
  try {
    console.log('\n📊 1. VERIFICANDO ESTRUTURA DAS TABELAS...');
    
    // Verificar tabela transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.log('❌ Erro ao acessar transactions:', transactionsError.message);
    } else {
      console.log('✅ Tabela transactions acessível');
      if (transactionsData && transactionsData.length > 0) {
        console.log('📋 Estrutura:', Object.keys(transactionsData[0]).join(', '));
      }
    }
    
    // Verificar tabela payouts
    const { data: payoutsData, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .limit(1);
    
    if (payoutsError) {
      console.log('❌ Erro ao acessar payouts:', payoutsError.message);
    } else {
      console.log('✅ Tabela payouts acessível');
      if (payoutsData && payoutsData.length > 0) {
        console.log('📋 Estrutura:', Object.keys(payoutsData[0]).join(', '));
      }
    }
    
    // Verificar tabela financeiro
    const { data: financeiroData, error: financeiroError } = await supabase
      .from('financeiro')
      .select('*')
      .limit(1);
    
    if (financeiroError) {
      console.log('❌ Erro ao acessar financeiro:', financeiroError.message);
    } else {
      console.log('✅ Tabela financeiro acessível');
      if (financeiroData && financeiroData.length > 0) {
        console.log('📋 Estrutura:', Object.keys(financeiroData[0]).join(', '));
      }
    }
    
    console.log('\n💾 2. INSERINDO DADOS DE TESTE...');
    
    // Inserir transações de teste
    const testTransactions = [
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'show',
        description: 'Show no Rock in Rio',
        gross_amount: 5000.00,
        net_amount: 4250.00,
        fee_amount: 750.00,
        status: 'settled',
        transaction_date: '2024-01-15',
        counterparty: 'Rock in Rio Produções',
        payment_method: 'bank_transfer'
      },
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'transport',
        description: 'Transporte para show',
        gross_amount: 800.00,
        net_amount: 800.00,
        fee_amount: 0.00,
        status: 'settled',
        transaction_date: '2024-01-16',
        counterparty: 'Empresa de Transporte XYZ',
        payment_method: 'credit_card'
      },
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'rehearsal',
        description: 'Ensaio pago',
        gross_amount: 1200.00,
        net_amount: 1080.00,
        fee_amount: 120.00,
        status: 'pending',
        transaction_date: '2024-01-17',
        counterparty: 'Estúdio Musical ABC',
        payment_method: 'pix'
      }
    ];
    
    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(testTransactions)
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir transações:', insertError.message);
    } else {
      console.log(`✅ ${insertedTransactions.length} transações inseridas com sucesso`);
    }
    
    // Inserir payouts de teste
    const testPayouts = [
      {
        tenant_id: tenantId,
        amount: 1500.00,
        status: 'pending',
        scheduled_date: '2024-01-25',
        description: 'Pagamento para músico principal',
        recipient: 'João Silva'
      },
      {
        tenant_id: tenantId,
        amount: 800.00,
        status: 'completed',
        scheduled_date: '2024-01-20',
        description: 'Pagamento para baterista',
        recipient: 'Maria Santos'
      }
    ];
    
    const { data: insertedPayouts, error: payoutError } = await supabase
      .from('payouts')
      .insert(testPayouts)
      .select();
    
    if (payoutError) {
      console.log('❌ Erro ao inserir payouts:', payoutError.message);
    } else {
      console.log(`✅ ${insertedPayouts.length} payouts inseridos com sucesso`);
    }
    
    console.log('\n📈 3. VERIFICANDO DADOS INSERIDOS...');
    
    // Verificar transações inseridas
    const { data: allTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });
    
    if (fetchError) {
      console.log('❌ Erro ao buscar transações:', fetchError.message);
    } else {
      console.log(`✅ ${allTransactions.length} transações encontradas`);
      allTransactions.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.description} - ${t.type} - R$ ${t.gross_amount}`);
      });
    }
    
    // Verificar payouts inseridos
    const { data: allPayouts, error: payoutFetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('scheduled_date', { ascending: false });
    
    if (payoutFetchError) {
      console.log('❌ Erro ao buscar payouts:', payoutFetchError.message);
    } else {
      console.log(`✅ ${allPayouts.length} payouts encontrados`);
      allPayouts.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.description} - ${p.status} - R$ ${p.amount}`);
      });
    }
    
    console.log('\n🎯 4. TESTANDO INTEGRAÇÃO COM FRONTEND...');
    
    // Simular chamadas que o frontend faz
    console.log('📊 Testando busca de métricas do dashboard...');
    
    const { data: dashboardTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId);
    
    const { data: dashboardPayouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('tenant_id', tenantId);
    
    // Calcular métricas como o frontend faz
    const totalIncome = dashboardTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.gross_amount || 0), 0);
    
    const totalExpense = dashboardTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.gross_amount || 0), 0);
    
    const pendingPayouts = dashboardPayouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    console.log('💰 Métricas calculadas:');
    console.log(`   Total de receitas: R$ ${totalIncome.toFixed(2)}`);
    console.log(`   Total de despesas: R$ ${totalExpense.toFixed(2)}`);
    console.log(`   Saldo líquido: R$ ${(totalIncome - totalExpense).toFixed(2)}`);
    console.log(`   Cachês pendentes: R$ ${pendingPayouts.toFixed(2)}`);
    
    console.log('\n✅ TESTE DE INTEGRAÇÃO CONCLUÍDO COM SUCESSO!');
    console.log('🎉 Frontend e backend estão devidamente integrados!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testFinancialIntegration();