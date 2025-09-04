// Script para análise completa das tabelas financeiras
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 ANÁLISE COMPLETA DAS TABELAS FINANCEIRAS');
console.log('=' .repeat(70));

async function analyzeFinancialTables() {
  const analysis = {
    timestamp: new Date().toISOString(),
    tables: {},
    summary: {}
  };

  try {
    // 1. TABELA FINANCEIRO
    console.log('\n💰 ANALISANDO TABELA FINANCEIRO:');
    console.log('-'.repeat(50));
    
    const { data: financeiro, error: financeiroError, count: financeiroCount } = await supabase
      .from('financeiro')
      .select('*', { count: 'exact' });
    
    if (financeiroError) {
      console.log('❌ Erro ao acessar financeiro:', financeiroError.message);
      analysis.tables.financeiro = { error: financeiroError.message, exists: false };
    } else {
      console.log(`✅ Tabela financeiro encontrada - ${financeiroCount || 0} registros`);
      analysis.tables.financeiro = {
        exists: true,
        count: financeiroCount || 0,
        sample: financeiro?.slice(0, 3) || [],
        structure: financeiro && financeiro.length > 0 ? Object.keys(financeiro[0]) : []
      };
      
      if (financeiro && financeiro.length > 0) {
        console.log('📋 Estrutura da tabela financeiro:');
        console.log('Colunas:', Object.keys(financeiro[0]).join(', '));
        console.log('\n📊 Amostra dos dados:');
        financeiro.slice(0, 2).forEach((item, index) => {
          console.log(`Registro ${index + 1}:`, JSON.stringify(item, null, 2));
        });
      }
    }

    // 2. TABELA PAYOUTS
    console.log('\n💸 ANALISANDO TABELA PAYOUTS:');
    console.log('-'.repeat(50));
    
    const { data: payouts, error: payoutsError, count: payoutsCount } = await supabase
      .from('payouts')
      .select('*', { count: 'exact' });
    
    if (payoutsError) {
      console.log('❌ Erro ao acessar payouts:', payoutsError.message);
      analysis.tables.payouts = { error: payoutsError.message, exists: false };
    } else {
      console.log(`✅ Tabela payouts encontrada - ${payoutsCount || 0} registros`);
      analysis.tables.payouts = {
        exists: true,
        count: payoutsCount || 0,
        sample: payouts?.slice(0, 3) || [],
        structure: payouts && payouts.length > 0 ? Object.keys(payouts[0]) : []
      };
      
      if (payouts && payouts.length > 0) {
        console.log('📋 Estrutura da tabela payouts:');
        console.log('Colunas:', Object.keys(payouts[0]).join(', '));
        console.log('\n📊 Amostra dos dados:');
        payouts.slice(0, 2).forEach((item, index) => {
          console.log(`Registro ${index + 1}:`, JSON.stringify(item, null, 2));
        });
        
        // Análise de status dos payouts
        const statusCount = {};
        payouts.forEach(payout => {
          const status = payout.status || 'undefined';
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        console.log('\n📈 Distribuição por status:', statusCount);
      }
    }

    // 3. TABELA TRANSACTIONS
    console.log('\n💳 ANALISANDO TABELA TRANSACTIONS:');
    console.log('-'.repeat(50));
    
    const { data: transactions, error: transactionsError, count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' });
    
    if (transactionsError) {
      console.log('❌ Erro ao acessar transactions:', transactionsError.message);
      analysis.tables.transactions = { error: transactionsError.message, exists: false };
    } else {
      console.log(`✅ Tabela transactions encontrada - ${transactionsCount || 0} registros`);
      analysis.tables.transactions = {
        exists: true,
        count: transactionsCount || 0,
        sample: transactions?.slice(0, 3) || [],
        structure: transactions && transactions.length > 0 ? Object.keys(transactions[0]) : []
      };
      
      if (transactions && transactions.length > 0) {
        console.log('📋 Estrutura da tabela transactions:');
        console.log('Colunas:', Object.keys(transactions[0]).join(', '));
        console.log('\n📊 Amostra dos dados:');
        transactions.slice(0, 2).forEach((item, index) => {
          console.log(`Registro ${index + 1}:`, JSON.stringify(item, null, 2));
        });
        
        // Análise de tipos e categorias
        const typeCount = {};
        const categoryCount = {};
        const statusCount = {};
        
        transactions.forEach(transaction => {
          const type = transaction.type || 'undefined';
          const category = transaction.category || 'undefined';
          const status = transaction.status || 'undefined';
          
          typeCount[type] = (typeCount[type] || 0) + 1;
          categoryCount[category] = (categoryCount[category] || 0) + 1;
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        
        console.log('\n📈 Distribuição por tipo:', typeCount);
        console.log('📈 Distribuição por categoria:', categoryCount);
        console.log('📈 Distribuição por status:', statusCount);
        
        // Análise de valores
        const amounts = transactions.map(t => t.amount).filter(a => a != null);
        if (amounts.length > 0) {
          const total = amounts.reduce((sum, amount) => sum + amount, 0);
          const avg = total / amounts.length;
          const max = Math.max(...amounts);
          const min = Math.min(...amounts);
          
          console.log('\n💰 Análise de valores:');
          console.log(`Total: R$ ${total.toFixed(2)}`);
          console.log(`Média: R$ ${avg.toFixed(2)}`);
          console.log(`Máximo: R$ ${max.toFixed(2)}`);
          console.log(`Mínimo: R$ ${min.toFixed(2)}`);
        }
      }
    }

    // 4. ANÁLISE DE RELACIONAMENTOS
    console.log('\n🔗 ANALISANDO RELACIONAMENTOS:');
    console.log('-'.repeat(50));
    
    // Verificar se existem user_ids comuns
    const userIds = new Set();
    if (analysis.tables.transactions.exists && transactions) {
      transactions.forEach(t => t.user_id && userIds.add(t.user_id));
    }
    if (analysis.tables.payouts.exists && payouts) {
      payouts.forEach(p => p.user_id && userIds.add(p.user_id));
    }
    
    console.log(`👥 Usuários únicos encontrados: ${userIds.size}`);
    console.log('User IDs:', Array.from(userIds).slice(0, 3).join(', '), userIds.size > 3 ? '...' : '');

    // 5. RESUMO FINAL
    analysis.summary = {
      totalTables: Object.keys(analysis.tables).length,
      existingTables: Object.values(analysis.tables).filter(t => t.exists).length,
      totalRecords: Object.values(analysis.tables).reduce((sum, t) => sum + (t.count || 0), 0),
      uniqueUsers: userIds.size,
      recommendations: []
    };
    
    // Gerar recomendações
    if (analysis.tables.financeiro && analysis.tables.financeiro.count === 0) {
      analysis.summary.recommendations.push('Tabela financeiro está vazia - considerar migração de dados ou remoção');
    }
    
    if (analysis.tables.transactions && analysis.tables.transactions.count > 0) {
      analysis.summary.recommendations.push('Tabela transactions tem dados - integrar com dashboard');
    }
    
    if (analysis.tables.payouts && analysis.tables.payouts.count > 0) {
      analysis.summary.recommendations.push('Tabela payouts tem dados - integrar com relatórios');
    }
    
    console.log('\n📋 RESUMO FINAL:');
    console.log('=' .repeat(70));
    console.log(`📊 Tabelas analisadas: ${analysis.summary.totalTables}`);
    console.log(`✅ Tabelas existentes: ${analysis.summary.existingTables}`);
    console.log(`📈 Total de registros: ${analysis.summary.totalRecords}`);
    console.log(`👥 Usuários únicos: ${analysis.summary.uniqueUsers}`);
    
    console.log('\n💡 RECOMENDAÇÕES:');
    analysis.summary.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // Salvar análise em arquivo JSON
    const fs = await import('fs');
    fs.writeFileSync('financial_tables_analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\n💾 Análise salva em: financial_tables_analysis.json');
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Erro geral na análise:', error);
    throw error;
  }
}

// Executar análise
analyzeFinancialTables().then(() => {
  console.log('\n✅ ANÁLISE CONCLUÍDA COM SUCESSO');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro na análise:', error);
  process.exit(1);
});