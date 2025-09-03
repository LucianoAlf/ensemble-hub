const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardFunction() {
  console.log('=== TESTE: Função get_dashboard_metrics ===\n');
  
  try {
    // 1. Verificar dados na tabela banda_integrante
    console.log('1. Contando registros ativos em banda_integrante:');
    const { data: bandaIntegrante, error: errorIntegrante } = await supabase
      .from('banda_integrante')
      .select('*')
      .eq('ativo', true);
    
    if (errorIntegrante) {
      console.error('Erro ao buscar banda_integrante:', errorIntegrante);
    } else {
      console.log(`Total de integrantes ativos: ${bandaIntegrante?.length || 0}`);
    }
    
    // 2. Verificar dados na tabela banda_membro
    console.log('\n2. Contando registros ativos em banda_membro:');
    const { data: bandaMembro, error: errorMembro } = await supabase
      .from('banda_membro')
      .select('*')
      .eq('ativo', true);
    
    if (errorMembro) {
      console.error('Erro ao buscar banda_membro:', errorMembro);
    } else {
      console.log(`Total de membros ativos: ${bandaMembro?.length || 0}`);
    }
    
    // 3. Executar SQL direto para verificar a função
    console.log('\n3. Executando SQL direto para verificar a função:');
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT prosrc 
          FROM pg_proc 
          WHERE proname = 'get_dashboard_metrics' 
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        `
      });
    
    if (sqlError) {
      console.error('Erro ao executar SQL:', sqlError);
    } else {
      console.log('Definição da função encontrada:');
      console.log(sqlResult);
    }
    
    // 4. Testar a função com um usuário específico
    console.log('\n4. Testando função get_dashboard_metrics:');
    const { data: metrics, error: errorMetrics } = await supabase
      .rpc('get_dashboard_metrics');
    
    if (errorMetrics) {
      console.error('Erro ao chamar get_dashboard_metrics:', errorMetrics);
    } else {
      console.log('Resultado da função:');
      console.log(JSON.stringify(metrics, null, 2));
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testDashboardFunction();