const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfwle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmd2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM2NjI2NzEsImV4cCI6MjAzOTIzODY3MX0.Ey_zQVGkwJXqZ5dLdNjXqJhLLBtpQJQGJQJQGJQJQGJQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDashboardFix() {
  console.log('🔧 Aplicando correção da função get_dashboard_metrics...');
  
  try {
    // Ler o arquivo SQL de correção
    const sqlFile = path.join(__dirname, 'fix-dashboard-metrics-final-corrected.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 SQL de correção carregado:');
    console.log('---');
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('---');
    
    // Extrair apenas a parte CREATE OR REPLACE FUNCTION
    const functionMatch = sqlContent.match(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$;/i);
    
    if (!functionMatch) {
      throw new Error('Não foi possível extrair a função SQL do arquivo');
    }
    
    const functionSQL = functionMatch[0];
    console.log('🔍 Função SQL extraída com sucesso');
    
    // Tentar aplicar via RPC execute_sql (se existir)
    console.log('\n🚀 Tentando aplicar via RPC...');
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('execute_sql', { sql_query: functionSQL });
    
    if (rpcError) {
      console.log('❌ RPC falhou:', rpcError.message);
      console.log('\n📋 APLICAÇÃO MANUAL NECESSÁRIA:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o seguinte SQL:');
      console.log('\n--- COPIE E COLE O SQL ABAIXO ---');
      console.log(functionSQL);
      console.log('--- FIM DO SQL ---\n');
    } else {
      console.log('✅ Função aplicada com sucesso via RPC!');
      console.log('Resultado:', rpcResult);
    }
    
    // Testar a função corrigida
    console.log('\n🧪 Testando a função corrigida...');
    
    const { data: testResult, error: testError } = await supabase
      .rpc('get_dashboard_metrics');
    
    if (testError) {
      console.log('❌ Teste falhou:', testError.message);
      console.log('Código do erro:', testError.code);
    } else {
      console.log('✅ Teste bem-sucedido!');
      console.log('Resultado da função:', JSON.stringify(testResult, null, 2));
      
      // Verificar se os dados fazem sentido
      if (testResult && typeof testResult === 'object') {
        console.log('\n📊 Análise dos resultados:');
        console.log(`- Bandas ativas: ${testResult.active_bands || 0}`);
        console.log(`- Eventos próximos: ${testResult.upcoming_events || 0}`);
        console.log(`- Total de membros: ${testResult.total_members || 0}`);
        console.log(`- Receita mensal: R$ ${testResult.monthly_revenue || 0}`);
        
        if (testResult.total_members > 0) {
          console.log('\n🎉 SUCESSO! A função agora retorna membros corretamente!');
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro durante a aplicação:', error.message);
    console.log('\n📋 APLICAÇÃO MANUAL NECESSÁRIA:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o conteúdo do arquivo: fix-dashboard-metrics-final-corrected.sql');
  }
}

// Executar a correção
applyDashboardFix().then(() => {
  console.log('\n🏁 Processo concluído!');
}).catch(console.error);