const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirflwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjI4NzIsImV4cCI6MjA1MjUzODg3Mn0.Ek8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFinalFix() {
  console.log('🔧 Aplicando correção final da função get_dashboard_metrics...');
  console.log('=' .repeat(60));
  
  try {
    // Ler o arquivo SQL de correção
    const sqlPath = path.join(__dirname, 'fix-dashboard-final-corrected.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL de correção carregado:');
    console.log('-'.repeat(40));
    console.log(sqlContent.substring(0, 200) + '...');
    console.log('');
    
    // Tentar aplicar via RPC
    console.log('🚀 Tentando aplicar correção via RPC...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (rpcError) {
      console.log('❌ Falha no RPC:', rpcError.message);
      console.log('📋 APLICAÇÃO MANUAL NECESSÁRIA:');
      console.log('=' .repeat(50));
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o seguinte SQL:');
      console.log('');
      console.log(sqlContent);
      console.log('');
      console.log('=' .repeat(50));
    } else {
      console.log('✅ Correção aplicada com sucesso via RPC!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correção:', error.message);
  }
  
  // Testar a função corrigida
  console.log('\n🧪 Testando função get_dashboard_metrics corrigida...');
  console.log('-'.repeat(50));
  
  try {
    const { data: metricsData, error: metricsError } = await supabase.rpc('get_dashboard_metrics');
    
    if (metricsError) {
      console.log('❌ Erro na função get_dashboard_metrics:');
      console.log('   Código:', metricsError.code);
      console.log('   Mensagem:', metricsError.message);
      console.log('   Detalhes:', metricsError.details);
    } else {
      console.log('✅ Função get_dashboard_metrics funcionando!');
      console.log('📊 Métricas retornadas:');
      console.log('   Total de bandas:', metricsData.total_bands);
      console.log('   Total de eventos:', metricsData.total_events);
      console.log('   Total de integrantes:', metricsData.total_members);
      console.log('   Receita mensal:', metricsData.monthly_revenue);
    }
  } catch (error) {
    console.error('❌ Erro ao testar função:', error.message);
  }
  
  // Teste adicional: verificar contagem direta de integrantes
  console.log('\n🔍 Verificação adicional - contagem direta de integrantes...');
  try {
    const { data: integrantesData, error: integrantesError } = await supabase
      .from('banda_integrante')
      .select('*', { count: 'exact' })
      .eq('ativo', true);
    
    if (integrantesError) {
      console.log('❌ Erro ao contar integrantes:', integrantesError.message);
    } else {
      console.log('✅ Contagem direta de integrantes ativos:', integrantesData.length);
    }
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Processo de correção concluído!');
  console.log('\nSe a função ainda apresentar erros, aplique manualmente o SQL fornecido acima.');
}

// Executar o script
applyFinalFix().catch(console.error);