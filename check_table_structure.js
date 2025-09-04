// Script para verificar a estrutura real das tabelas financeiras
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS FINANCEIRAS');
console.log('=' .repeat(60));

async function checkTableStructure() {
  try {
    // Verificar estrutura da tabela transactions
    console.log('\n📊 ESTRUTURA DA TABELA TRANSACTIONS');
    const { data: transactionsInfo, error: transactionsError } = await supabase
      .rpc('get_table_info', { table_name: 'transactions' });
    
    if (transactionsError) {
      console.log('❌ Erro ao obter info da tabela transactions:', transactionsError.message);
      
      // Tentar uma consulta alternativa para verificar a estrutura
      console.log('\n🔍 Tentando consulta alternativa...');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(0);
      
      if (error) {
        console.log('❌ Erro na consulta alternativa:', error.message);
        
        // Verificar se é um problema de coluna computed
        console.log('\n🔍 Verificando colunas específicas...');
        const { data: testData, error: testError } = await supabase
          .from('transactions')
          .select('id, tenant_id, type, status, category, gross_amount, fee_amount, transaction_date, description')
          .limit(1);
        
        if (testError) {
          console.log('❌ Erro ao verificar colunas:', testError.message);
        } else {
          console.log('✅ Colunas básicas acessíveis');
        }
      } else {
        console.log('✅ Consulta alternativa bem-sucedida');
      }
    } else {
      console.log('✅ Estrutura da tabela transactions:');
      console.log(JSON.stringify(transactionsInfo, null, 2));
    }
    
    // Verificar estrutura da tabela payouts
    console.log('\n📊 ESTRUTURA DA TABELA PAYOUTS');
    const { data: payoutsData, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .limit(0);
    
    if (payoutsError) {
      console.log('❌ Erro ao verificar payouts:', payoutsError.message);
    } else {
      console.log('✅ Tabela payouts acessível');
    }
    
    // Verificar estrutura da tabela financeiro
    console.log('\n📊 ESTRUTURA DA TABELA FINANCEIRO');
    const { data: financeiroData, error: financeiroError } = await supabase
      .from('financeiro')
      .select('*')
      .limit(0);
    
    if (financeiroError) {
      console.log('❌ Erro ao verificar financeiro:', financeiroError.message);
    } else {
      console.log('✅ Tabela financeiro acessível');
    }
    
    // Testar inserção simples na tabela transactions
    console.log('\n🧪 TESTANDO INSERÇÃO SIMPLES');
    const testTenantId = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';
    
    // Primeiro, tentar inserção sem net_amount
    const { data: insertTest1, error: insertError1 } = await supabase
      .from('transactions')
      .insert({
        tenant_id: testTenantId,
        type: 'income',
        status: 'pending',
        category: 'test',
        gross_amount: 1000.00,
        fee_amount: 50.00,
        transaction_date: new Date().toISOString().split('T')[0],
        description: 'Teste sem net_amount'
      })
      .select()
      .single();
    
    if (insertError1) {
      console.log('❌ Erro na inserção sem net_amount:', insertError1.message);
      
      // Tentar inserção com net_amount como NULL
      const { data: insertTest2, error: insertError2 } = await supabase
        .from('transactions')
        .insert({
          tenant_id: testTenantId,
          type: 'income',
          status: 'pending',
          category: 'test',
          gross_amount: 1000.00,
          fee_amount: 50.00,
          net_amount: null,
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Teste com net_amount NULL'
        })
        .select()
        .single();
      
      if (insertError2) {
        console.log('❌ Erro na inserção com net_amount NULL:', insertError2.message);
      } else {
        console.log('✅ Inserção com net_amount NULL bem-sucedida:', insertTest2.id);
        
        // Limpar o registro de teste
        await supabase.from('transactions').delete().eq('id', insertTest2.id);
      }
    } else {
      console.log('✅ Inserção sem net_amount bem-sucedida:', insertTest1.id);
      console.log('📄 Dados inseridos:', insertTest1);
      
      // Limpar o registro de teste
      await supabase.from('transactions').delete().eq('id', insertTest1.id);
    }
    
    // Verificar se net_amount é uma coluna computed
    console.log('\n🔍 VERIFICANDO SE NET_AMOUNT É COMPUTED');
    const { data: computedTest, error: computedError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: testTenantId,
        type: 'income',
        status: 'pending',
        category: 'test',
        gross_amount: 1000.00,
        fee_amount: 50.00,
        transaction_date: new Date().toISOString().split('T')[0],
        description: 'Teste computed column'
      })
      .select('id, gross_amount, fee_amount, net_amount')
      .single();
    
    if (computedError) {
      console.log('❌ Erro no teste de computed column:', computedError.message);
    } else {
      console.log('✅ Teste de computed column bem-sucedido:');
      console.log(`   gross_amount: ${computedTest.gross_amount}`);
      console.log(`   fee_amount: ${computedTest.fee_amount}`);
      console.log(`   net_amount: ${computedTest.net_amount}`);
      
      // Verificar se net_amount foi calculado automaticamente
      const expectedNetAmount = computedTest.gross_amount - computedTest.fee_amount;
      if (computedTest.net_amount === expectedNetAmount) {
        console.log('✅ net_amount é uma coluna computed (gross_amount - fee_amount)');
      } else {
        console.log('⚠️  net_amount não segue a fórmula esperada');
      }
      
      // Limpar o registro de teste
      await supabase.from('transactions').delete().eq('id', computedTest.id);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkTableStructure().then(() => {
  console.log('\n🎉 Verificação de estrutura concluída!');
}).catch((error) => {
  console.error('💥 Erro na verificação:', error);
});