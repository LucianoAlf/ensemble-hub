// Script para verificar a estrutura real das tabelas financeiras
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 VERIFICAÇÃO DE ESTRUTURA DAS TABELAS');
console.log('=' .repeat(60));

async function checkTableSchemas() {
  try {
    console.log('\n📊 VERIFICANDO ESTRUTURA DA TABELA TRANSACTIONS...');
    
    // Usar RPC para obter estrutura da tabela transactions
    const { data: transactionsSchema, error: transactionsError } = await supabase
      .rpc('get_table_schema', { table_name: 'transactions' });
    
    if (transactionsError) {
      console.log('❌ Erro ao obter schema transactions:', transactionsError.message);
      
      // Tentar uma abordagem alternativa - inserir um registro vazio para ver os campos obrigatórios
      console.log('🔄 Tentando abordagem alternativa...');
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({});
      
      if (insertError) {
        console.log('📋 Campos obrigatórios identificados pelo erro:', insertError.message);
      }
    } else {
      console.log('✅ Schema transactions obtido:', transactionsSchema);
    }
    
    console.log('\n📊 VERIFICANDO ESTRUTURA DA TABELA PAYOUTS...');
    
    const { data: payoutsSchema, error: payoutsError } = await supabase
      .rpc('get_table_schema', { table_name: 'payouts' });
    
    if (payoutsError) {
      console.log('❌ Erro ao obter schema payouts:', payoutsError.message);
      
      // Tentar inserir registro vazio
      const { error: insertError } = await supabase
        .from('payouts')
        .insert({});
      
      if (insertError) {
        console.log('📋 Campos obrigatórios identificados pelo erro:', insertError.message);
      }
    } else {
      console.log('✅ Schema payouts obtido:', payoutsSchema);
    }
    
    console.log('\n📊 VERIFICANDO ESTRUTURA DA TABELA FINANCEIRO...');
    
    const { data: financeiroSchema, error: financeiroError } = await supabase
      .rpc('get_table_schema', { table_name: 'financeiro' });
    
    if (financeiroError) {
      console.log('❌ Erro ao obter schema financeiro:', financeiroError.message);
      
      // Tentar inserir registro vazio
      const { error: insertError } = await supabase
        .from('financeiro')
        .insert({});
      
      if (insertError) {
        console.log('📋 Campos obrigatórios identificados pelo erro:', insertError.message);
      }
    } else {
      console.log('✅ Schema financeiro obtido:', financeiroSchema);
    }
    
    console.log('\n🔍 TESTANDO INSERÇÃO MÍNIMA...');
    
    // Testar inserção com campos mínimos para transactions
    console.log('📝 Testando inserção mínima em transactions...');
    const { data: minTransactionData, error: minTransactionError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
        type: 'income',
        gross_amount: 1000.00,
        description: 'Teste de inserção'
      })
      .select();
    
    if (minTransactionError) {
      console.log('❌ Erro na inserção mínima transactions:', minTransactionError.message);
    } else {
      console.log('✅ Inserção mínima transactions bem-sucedida');
      console.log('📋 Campos disponíveis:', Object.keys(minTransactionData[0]).join(', '));
      
      // Limpar o registro de teste
      await supabase
        .from('transactions')
        .delete()
        .eq('id', minTransactionData[0].id);
    }
    
    // Testar inserção com campos mínimos para payouts
    console.log('\n📝 Testando inserção mínima em payouts...');
    const { data: minPayoutData, error: minPayoutError } = await supabase
      .from('payouts')
      .insert({
        tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
        amount: 500.00,
        status: 'pending'
      })
      .select();
    
    if (minPayoutError) {
      console.log('❌ Erro na inserção mínima payouts:', minPayoutError.message);
    } else {
      console.log('✅ Inserção mínima payouts bem-sucedida');
      console.log('📋 Campos disponíveis:', Object.keys(minPayoutData[0]).join(', '));
      
      // Limpar o registro de teste
      await supabase
        .from('payouts')
        .delete()
        .eq('id', minPayoutData[0].id);
    }
    
    // Testar inserção com campos mínimos para financeiro
    console.log('\n📝 Testando inserção mínima em financeiro...');
    const { data: minFinanceiroData, error: minFinanceiroError } = await supabase
      .from('financeiro')
      .insert({
        tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
        tipo: 'receita',
        valor: 1000.00,
        descricao: 'Teste de inserção'
      })
      .select();
    
    if (minFinanceiroError) {
      console.log('❌ Erro na inserção mínima financeiro:', minFinanceiroError.message);
    } else {
      console.log('✅ Inserção mínima financeiro bem-sucedida');
      console.log('📋 Campos disponíveis:', Object.keys(minFinanceiroData[0]).join(', '));
      
      // Limpar o registro de teste
      await supabase
        .from('financeiro')
        .delete()
        .eq('id', minFinanceiroData[0].id);
    }
    
    console.log('\n✅ VERIFICAÇÃO DE ESTRUTURA CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar a verificação
checkTableSchemas();