// Script para verificar se o frontend consegue acessar os dados das tabelas financeiras
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";

console.log('🔍 VERIFICAÇÃO DE INTEGRAÇÃO FRONTEND-BACKEND');
console.log('=' .repeat(60));
console.log(`🏢 Tenant ID: ${tenantId}`);

async function verifyFrontendIntegration() {
  try {
    console.log('\n📊 1. TESTANDO ACESSO ÀS TABELAS (COMO O FRONTEND FAZ)...');
    
    // Testar acesso à tabela transactions (como o FinanceDashboard faz)
    console.log('\n🔍 Testando acesso à tabela TRANSACTIONS...');
    const { data: transactionsData, error: transactionsError, count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (transactionsError) {
      console.log('❌ Erro ao acessar transactions:', transactionsError.message);
    } else {
      console.log(`✅ Acesso à tabela transactions bem-sucedido`);
      console.log(`📊 Total de registros: ${transactionsCount || 0}`);
      if (transactionsData && transactionsData.length > 0) {
        console.log('📋 Estrutura do primeiro registro:');
        console.log('   Campos:', Object.keys(transactionsData[0]).join(', '));
        console.log('   Exemplo:', JSON.stringify(transactionsData[0], null, 2));
      } else {
        console.log('📝 Tabela transactions está vazia para este tenant');
      }
    }
    
    // Testar acesso à tabela payouts
    console.log('\n🔍 Testando acesso à tabela PAYOUTS...');
    const { data: payoutsData, error: payoutsError, count: payoutsCount } = await supabase
      .from('payouts')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (payoutsError) {
      console.log('❌ Erro ao acessar payouts:', payoutsError.message);
    } else {
      console.log(`✅ Acesso à tabela payouts bem-sucedido`);
      console.log(`📊 Total de registros: ${payoutsCount || 0}`);
      if (payoutsData && payoutsData.length > 0) {
        console.log('📋 Estrutura do primeiro registro:');
        console.log('   Campos:', Object.keys(payoutsData[0]).join(', '));
        console.log('   Exemplo:', JSON.stringify(payoutsData[0], null, 2));
      } else {
        console.log('📝 Tabela payouts está vazia para este tenant');
      }
    }
    
    // Testar acesso à tabela financeiro
    console.log('\n🔍 Testando acesso à tabela FINANCEIRO...');
    const { data: financeiroData, error: financeiroError, count: financeiroCount } = await supabase
      .from('financeiro')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (financeiroError) {
      console.log('❌ Erro ao acessar financeiro:', financeiroError.message);
    } else {
      console.log(`✅ Acesso à tabela financeiro bem-sucedido`);
      console.log(`📊 Total de registros: ${financeiroCount || 0}`);
      if (financeiroData && financeiroData.length > 0) {
        console.log('📋 Estrutura do primeiro registro:');
        console.log('   Campos:', Object.keys(financeiroData[0]).join(', '));
        console.log('   Exemplo:', JSON.stringify(financeiroData[0], null, 2));
      } else {
        console.log('📝 Tabela financeiro está vazia para este tenant');
      }
    }
    
    console.log('\n📈 2. SIMULANDO CÁLCULOS DO DASHBOARD...');
    
    // Simular os cálculos que o FinanceDashboard faz
    if (transactionsData && !transactionsError) {
      const totalIncome = transactionsData
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.gross_amount || t.amount || 0), 0);
      
      const totalExpense = transactionsData
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.gross_amount || t.amount || 0), 0);
      
      const netAmount = totalIncome - totalExpense;
      
      console.log('💰 Métricas calculadas (como o Dashboard faz):');
      console.log(`   📈 Total de receitas: R$ ${totalIncome.toFixed(2)}`);
      console.log(`   📉 Total de despesas: R$ ${totalExpense.toFixed(2)}`);
      console.log(`   💵 Saldo líquido: R$ ${netAmount.toFixed(2)}`);
    }
    
    if (payoutsData && !payoutsError) {
      const pendingPayouts = payoutsData
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      console.log(`   🕐 Cachês pendentes: R$ ${pendingPayouts.toFixed(2)}`);
    }
    
    console.log('\n🔄 3. TESTANDO CONSULTAS ESPECÍFICAS DAS ABAS...');
    
    // Testar consulta da aba Movimentações (EnhancedTransactionsTable)
    console.log('\n📋 Testando consulta da aba MOVIMENTAÇÕES...');
    const { data: movementsData, error: movementsError } = await supabase
      .from('transactions')
      .select('*, banda:banda_id(nome), evento:evento_id(titulo)')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });
    
    if (movementsError) {
      console.log('❌ Erro na consulta de movimentações:', movementsError.message);
    } else {
      console.log(`✅ Consulta de movimentações bem-sucedida (${movementsData.length} registros)`);
    }
    
    // Testar consulta da aba Dashboard (useRealFinancialData)
    console.log('\n📊 Testando consulta do DASHBOARD...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (dashboardError) {
      console.log('❌ Erro na consulta do dashboard:', dashboardError.message);
    } else {
      console.log(`✅ Consulta do dashboard bem-sucedida (${dashboardData.length} registros)`);
    }
    
    console.log('\n🎯 4. VERIFICANDO COMPATIBILIDADE COM TIPOS TYPESCRIPT...');
    
    // Verificar se os dados retornados são compatíveis com os tipos do frontend
    if (transactionsData && transactionsData.length > 0) {
      const firstTransaction = transactionsData[0];
      console.log('🔍 Verificando campos esperados pelo frontend:');
      
      const expectedFields = [
        'id', 'tenant_id', 'type', 'category', 'description', 
        'gross_amount', 'net_amount', 'status', 'transaction_date',
        'counterparty', 'created_at', 'updated_at'
      ];
      
      const actualFields = Object.keys(firstTransaction);
      
      expectedFields.forEach(field => {
        if (actualFields.includes(field)) {
          console.log(`   ✅ ${field}: presente`);
        } else {
          console.log(`   ❌ ${field}: ausente`);
        }
      });
      
      console.log('\n📋 Campos extras encontrados:');
      const extraFields = actualFields.filter(field => !expectedFields.includes(field));
      extraFields.forEach(field => {
        console.log(`   ➕ ${field}: ${typeof firstTransaction[field]}`);
      });
    }
    
    console.log('\n✅ VERIFICAÇÃO DE INTEGRAÇÃO CONCLUÍDA!');
    
    // Resumo final
    const summary = {
      transactions: {
        accessible: !transactionsError,
        count: transactionsCount || 0,
        hasData: transactionsData && transactionsData.length > 0
      },
      payouts: {
        accessible: !payoutsError,
        count: payoutsCount || 0,
        hasData: payoutsData && payoutsData.length > 0
      },
      financeiro: {
        accessible: !financeiroError,
        count: financeiroCount || 0,
        hasData: financeiroData && financeiroData.length > 0
      }
    };
    
    console.log('\n📊 RESUMO DA INTEGRAÇÃO:');
    console.log('=' .repeat(40));
    Object.entries(summary).forEach(([table, info]) => {
      const status = info.accessible ? '✅' : '❌';
      const dataStatus = info.hasData ? '📊 Com dados' : '📝 Vazia';
      console.log(`${status} ${table}: ${dataStatus} (${info.count} registros)`);
    });
    
    const allAccessible = Object.values(summary).every(info => info.accessible);
    const hasAnyData = Object.values(summary).some(info => info.hasData);
    
    if (allAccessible) {
      console.log('\n🎉 INTEGRAÇÃO FRONTEND-BACKEND: FUNCIONANDO!');
      if (hasAnyData) {
        console.log('💾 Dados estão sendo recuperados corretamente');
      } else {
        console.log('⚠️  Tabelas estão vazias - adicione dados de teste');
      }
    } else {
      console.log('\n⚠️  PROBLEMAS DE INTEGRAÇÃO DETECTADOS');
      console.log('🔧 Verifique as políticas RLS e permissões');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar a verificação
verifyFrontendIntegration();