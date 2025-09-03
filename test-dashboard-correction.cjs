const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardCorrection() {
  try {
    console.log('Testando a função get_dashboard_metrics...');
    
    const { data, error } = await supabase.rpc('get_dashboard_metrics', {
      p_tenant_id: 'default'
    });
    
    if (error) {
      console.log('ERRO:', error.message);
      return;
    }
    
    console.log('SUCESSO: Função executada!');
    console.log('Dados:', JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.log('ERRO CATCH:', err.message);
  }
}

testDashboardCorrection();