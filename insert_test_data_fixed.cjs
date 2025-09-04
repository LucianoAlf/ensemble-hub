// Script para inserir dados de teste respeitando colunas geradas
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";

async function insertTestData() {
  console.log('💰 INSERINDO DADOS DE TESTE FINANCEIROS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Fazer login com o usuário de teste
    console.log('🔐 Fazendo login com usuário de teste...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@ensemble-hub.com',
      password: 'TestPassword123!'
    });
    
    if (signInError) {
      console.log('❌ Erro no login:', signInError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('   Usuário:', signInData.user?.email);
    
    // Aguardar um pouco para a sessão ser estabelecida
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Limpar dados existentes
    console.log('🧹 Limpando dados existentes...');
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('tenant_id', tenantId);
    
    if (deleteError) {
      console.log('⚠️  Erro ao limpar dados:', deleteError.message);
    } else {
      console.log('✅ Dados existentes removidos');
    }
    
    // 3. Inserir receitas (income)
    console.log('\n💵 Inserindo receitas...');
    const receitas = [
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'show',
        counterparty: 'Casa de Shows Aurora',
        gross_amount: 8500.00,
        fee_amount: 850.00,
        transaction_date: new Date().toISOString(),
        description: 'Show Casa de Shows Aurora'
      },
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'show',
        counterparty: 'Bar do Rock',
        gross_amount: 6200.00,
        fee_amount: 620.00,
        transaction_date: new Date().toISOString(),
        description: 'Apresentação Bar do Rock'
      },
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'festival',
        counterparty: 'Festival de Verão',
        gross_amount: 7800.00,
        fee_amount: 780.00,
        transaction_date: new Date().toISOString(),
        description: 'Festival de Verão 2024'
      },
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'show',
        counterparty: 'Clube da Música',
        gross_amount: 5500.00,
        fee_amount: 550.00,
        transaction_date: new Date().toISOString(),
        description: 'Show Clube da Música'
      },
      {
        tenant_id: tenantId,
        type: 'income',
        category: 'show',
        counterparty: 'Pub Irlandês',
        gross_amount: 3500.00,
        fee_amount: 350.00,
        transaction_date: new Date().toISOString(),
        description: 'Apresentação Pub Irlandês'
      }
    ];
    
    const { data: receitasResult, error: receitasError } = await supabase
      .from('transactions')
      .insert(receitas)
      .select();
    
    if (receitasError) {
      console.log('❌ Erro ao inserir receitas:', receitasError.message);
      return;
    }
    
    console.log(`✅ ${receitasResult.length} receitas inseridas`);
    
    // 4. Inserir despesas (expense)
    console.log('\n💸 Inserindo despesas...');
    const despesas = [
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'equipment',
        counterparty: 'Music Store Pro',
        gross_amount: 2500.00,
        fee_amount: 0.00,
        transaction_date: new Date().toISOString(),
        description: 'Compra de equipamentos de som'
      },
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'transport',
        counterparty: 'Van Express',
        gross_amount: 1200.00,
        fee_amount: 0.00,
        transaction_date: new Date().toISOString(),
        description: 'Transporte para shows'
      },
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'recording',
        counterparty: 'Estúdio Harmony',
        gross_amount: 3500.00,
        fee_amount: 0.00,
        transaction_date: new Date().toISOString(),
        description: 'Gravação de álbum'
      },
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'marketing',
        counterparty: 'Agência Digital',
        gross_amount: 800.00,
        fee_amount: 0.00,
        transaction_date: new Date().toISOString(),
        description: 'Campanha de marketing digital'
      },
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'maintenance',
        counterparty: 'Tech Music Repair',
        gross_amount: 600.00,
        fee_amount: 0.00,
        transaction_date: new Date().toISOString(),
        description: 'Manutenção de instrumentos'
      },
      {
        tenant_id: tenantId,
        type: 'expense',
        category: 'accommodation',
        counterparty: 'Hotel Central',
        gross_amount: 200.00,
        fee_amount: 0.00,
        transaction_date: new Date().toISOString(),
        description: 'Hospedagem para show'
      }
    ];
    
    const { data: despesasResult, error: despesasError } = await supabase
      .from('transactions')
      .insert(despesas)
      .select();
    
    if (despesasError) {
      console.log('❌ Erro ao inserir despesas:', despesasError.message);
      return;
    }
    
    console.log(`✅ ${despesasResult.length} despesas inseridas`);
    
    // 5. Verificar dados inseridos
    console.log('\n📊 VERIFICANDO DADOS INSERIDOS...');
    const { data: allData, error: verifyError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });
    
    if (verifyError) {
      console.log('❌ Erro ao verificar dados:', verifyError.message);
      return;
    }
    
    console.log(`\n✅ Total de transações inseridas: ${allData.length}`);
    
    // Calcular totais
    const receitas_total = allData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.gross_amount || 0), 0);
    
    const despesas_total = allData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.gross_amount || 0), 0);
    
    const saldo = receitas_total - despesas_total;
    
    console.log('\n💰 RESUMO FINANCEIRO:');
    console.log(`   Receitas: R$ ${receitas_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    console.log(`   Despesas: R$ ${despesas_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    console.log(`   Saldo: R$ ${saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    
    // Verificar valores esperados
    console.log('\n🎯 VERIFICAÇÃO DOS VALORES ESPERADOS:');
    console.log(`   Receitas esperadas: R$ 31.500,00 | Atual: R$ ${receitas_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${receitas_total === 31500 ? '✅' : '❌'}`);
    console.log(`   Despesas esperadas: R$ 8.800,00 | Atual: R$ ${despesas_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${despesas_total === 8800 ? '✅' : '❌'}`);
    console.log(`   Saldo esperado: R$ 22.700,00 | Atual: R$ ${saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${Math.abs(saldo - 22700) < 1 ? '✅' : '❌'}`);
    
    // Mostrar algumas transações
    console.log('\n📋 PRIMEIRAS TRANSAÇÕES:');
    allData.slice(0, 5).forEach((transaction, index) => {
      const tipo = transaction.type === 'income' ? '💵' : '💸';
      console.log(`${index + 1}. ${tipo} ${transaction.counterparty}: R$ ${transaction.gross_amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    });
    
    console.log('\n🎉 DADOS DE TESTE INSERIDOS COM SUCESSO!');
    console.log('Agora você pode testar a página Financeiro com dados reais.');
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    console.log('Stack:', error.stack);
  }
}

insertTestData();