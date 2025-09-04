// Script simples para verificar dados financeiros
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";

async function checkData() {
  console.log('🔍 VERIFICAÇÃO DOS DADOS FINANCEIROS');
  console.log('=' .repeat(50));
  
  try {
    // Buscar transações
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.log('❌ Erro ao buscar transações:', error.message);
      return;
    }
    
    console.log(`✅ Total de transações: ${transactions.length}`);
    
    if (transactions.length === 0) {
      console.log('⚠️  Nenhuma transação encontrada!');
      return;
    }
    
    // Calcular totais
    const receitas = transactions.filter(t => t.type === 'income');
    const despesas = transactions.filter(t => t.type === 'expense');
    
    const totalReceitas = receitas.reduce((sum, t) => sum + (t.gross_amount || 0), 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + (t.gross_amount || 0), 0);
    const saldoTotal = totalReceitas - totalDespesas;
    
    console.log('\n💰 RESUMO FINANCEIRO:');
    console.log(`   Receitas: R$ ${totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    console.log(`   Despesas: R$ ${totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    console.log(`   Saldo: R$ ${saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    
    // Verificar valores esperados
    console.log('\n🎯 VERIFICAÇÃO DOS VALORES ESPERADOS:');
    console.log(`   Receitas esperadas: R$ 31.500,00 | Atual: R$ ${totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${totalReceitas === 31500 ? '✅' : '❌'}`);
    console.log(`   Despesas esperadas: R$ 8.800,00 | Atual: R$ ${totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${totalDespesas === 8800 ? '✅' : '❌'}`);
    console.log(`   Saldo esperado: R$ 40.300,00 | Atual: R$ ${saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${Math.abs(saldoTotal - 40300) < 1 ? '✅' : '❌'}`);
    
    // Verificar contrapartes
    const contrapartes = [...new Set(transactions.map(t => t.counterparty).filter(Boolean))];
    console.log(`\n👥 CONTRAPARTES:`);
    console.log(`   Total: ${contrapartes.length} (esperado: 11) ${contrapartes.length === 11 ? '✅' : '❌'}`);
    
    if (contrapartes.length > 0) {
      console.log('   Lista:');
      contrapartes.forEach((cp, i) => {
        console.log(`     ${i + 1}. ${cp}`);
      });
    }
    
    // Verificar distribuição por tipo
    console.log('\n📊 DISTRIBUIÇÃO:');
    console.log(`   Receitas: ${receitas.length} transações`);
    console.log(`   Despesas: ${despesas.length} transações`);
    
    // Mostrar algumas transações de exemplo
    console.log('\n📋 EXEMPLOS DE TRANSAÇÕES:');
    transactions.slice(0, 5).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.type === 'income' ? '💰' : '💸'} ${t.counterparty} - R$ ${(t.gross_amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkData();