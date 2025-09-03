const { createClient } = require('@supabase/supabase-js');

// Usar as credenciais do .env
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegrantes() {
  try {
    console.log('=== Verificando tabelas de integrantes ===');
    
    // Verificar banda_membro
    const { data: bandaMembroData, error: error1 } = await supabase
      .from('banda_membro')
      .select('*');
    
    console.log('banda_membro count:', bandaMembroData?.length || 0);
    if (error1) {
      console.log('Erro banda_membro:', error1.message);
    }
    
    // Verificar banda_integrante
    const { data: bandaIntegranteData, error: error2 } = await supabase
      .from('banda_integrante')
      .select('*');
    
    console.log('banda_integrante count:', bandaIntegranteData?.length || 0);
    if (error2) {
      console.log('Erro banda_integrante:', error2.message);
    }
    
    console.log('\n=== Dados banda_integrante ===');
    console.log(bandaIntegranteData);
    
    console.log('\n=== Dados banda_membro ===');
    console.log(bandaMembroData);
    
    // Testar a função get_dashboard_metrics
    console.log('\n=== Testando get_dashboard_metrics ===');
    const { data: metricsData, error: error3 } = await supabase
      .rpc('get_dashboard_metrics');
    
    if (error3) {
      console.log('Erro get_dashboard_metrics:', error3.message);
    } else {
      console.log('Métricas do dashboard:', metricsData);
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

checkIntegrantes();