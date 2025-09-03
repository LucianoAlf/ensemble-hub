const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (valores do .env)
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardIntegrantes() {
  console.log('=== DEBUG: Dashboard Integrantes ===\n');
  
  try {
    // 1. Verificar dados na tabela banda_membro
    console.log('1. Verificando tabela banda_membro:');
    const { data: bandaMembro, error: errorMembro } = await supabase
      .from('banda_membro')
      .select('*');
    
    if (errorMembro) {
      console.error('Erro ao buscar banda_membro:', errorMembro);
    } else {
      console.log(`Total de registros em banda_membro: ${bandaMembro?.length || 0}`);
      console.log('Dados:', bandaMembro);
    }
    
    // 2. Verificar dados na tabela banda_integrante
    console.log('\n2. Verificando tabela banda_integrante:');
    const { data: bandaIntegrante, error: errorIntegrante } = await supabase
      .from('banda_integrante')
      .select('*');
    
    if (errorIntegrante) {
      console.error('Erro ao buscar banda_integrante:', errorIntegrante);
    } else {
      console.log(`Total de registros em banda_integrante: ${bandaIntegrante?.length || 0}`);
      console.log('Dados:', bandaIntegrante);
      
      // Contar apenas os ativos
      const ativosIntegrante = bandaIntegrante?.filter(item => item.ativo === true) || [];
      console.log(`Registros ativos em banda_integrante: ${ativosIntegrante.length}`);
    }
    
    // 3. Testar a função get_dashboard_metrics
    console.log('\n3. Testando função get_dashboard_metrics:');
    const { data: metrics, error: errorMetrics } = await supabase
      .rpc('get_dashboard_metrics');
    
    if (errorMetrics) {
      console.error('Erro ao chamar get_dashboard_metrics:', errorMetrics);
    } else {
      console.log('Resultado da função get_dashboard_metrics:');
      console.log(JSON.stringify(metrics, null, 2));
    }
    
    // 4. Verificar perfil do usuário atual
    console.log('\n4. Verificando perfil do usuário:');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Usuário logado:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      } else {
        console.log('Perfil do usuário:', profile);
      }
    } else {
      console.log('Nenhum usuário logado');
    }
    
    // 5. Verificar definição da função no banco
    console.log('\n5. Verificando definição da função get_dashboard_metrics:');
    const { data: funcDef, error: funcError } = await supabase
      .from('pg_proc')
      .select('prosrc')
      .eq('proname', 'get_dashboard_metrics')
      .single();
    
    if (funcError) {
      console.error('Erro ao buscar definição da função:', funcError);
    } else {
      console.log('Definição da função encontrada:');
      console.log(funcDef?.prosrc || 'Não encontrada');
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugDashboardIntegrantes();