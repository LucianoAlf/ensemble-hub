const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirflwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjI4NzIsImV4cCI6MjA1MjUzODg3Mn0.Ek8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalDashboard() {
  console.log('🧪 TESTE FINAL - Função get_dashboard_metrics');
  console.log('=' .repeat(60));
  
  // Teste 1: Verificar se a função existe e pode ser chamada
  console.log('\n1️⃣ Testando chamada da função get_dashboard_metrics...');
  try {
    const { data: metricsData, error: metricsError } = await supabase.rpc('get_dashboard_metrics');
    
    if (metricsError) {
      console.log('❌ ERRO na função get_dashboard_metrics:');
      console.log('   Código:', metricsError.code || 'N/A');
      console.log('   Mensagem:', metricsError.message);
      console.log('   Detalhes:', metricsError.details || 'N/A');
      
      if (metricsError.message.includes('column "ativo" does not exist')) {
        console.log('\n🔍 DIAGNÓSTICO: Erro de coluna "ativo" ainda persiste!');
        console.log('   A função ainda não foi atualizada no banco de dados.');
      } else if (metricsError.message.includes('tenant_id')) {
        console.log('\n🔍 DIAGNÓSTICO: Erro relacionado ao tenant_id.');
      } else if (metricsError.message.includes('fetch failed')) {
        console.log('\n🔍 DIAGNÓSTICO: Problema de conectividade.');
      }
    } else {
      console.log('✅ Função get_dashboard_metrics funcionando!');
      console.log('📊 Métricas retornadas:');
      console.log('   Total de bandas:', metricsData?.total_bands || 0);
      console.log('   Total de eventos:', metricsData?.total_events || 0);
      console.log('   Total de integrantes:', metricsData?.total_members || 0);
      console.log('   Receita mensal:', metricsData?.monthly_revenue || 0);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
  
  // Teste 2: Verificar contagem direta de dados
  console.log('\n2️⃣ Verificação direta dos dados...');
  
  // Teste 2a: Bandas ativas
  try {
    const { data: bandasData, error: bandasError } = await supabase
      .from('banda')
      .select('*', { count: 'exact' })
      .eq('ativa', true);
    
    if (bandasError) {
      console.log('❌ Erro ao contar bandas:', bandasError.message);
    } else {
      console.log('✅ Bandas ativas encontradas:', bandasData?.length || 0);
    }
  } catch (error) {
    console.error('❌ Erro na verificação de bandas:', error.message);
  }
  
  // Teste 2b: Integrantes ativos
  try {
    const { data: integrantesData, error: integrantesError } = await supabase
      .from('banda_integrante')
      .select('*', { count: 'exact' })
      .eq('ativo', true);
    
    if (integrantesError) {
      console.log('❌ Erro ao contar integrantes:', integrantesError.message);
    } else {
      console.log('✅ Integrantes ativos encontrados:', integrantesData?.length || 0);
    }
  } catch (error) {
    console.error('❌ Erro na verificação de integrantes:', error.message);
  }
  
  // Teste 2c: Eventos do mês
  try {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const { data: eventosData, error: eventosError } = await supabase
      .from('evento')
      .select('*', { count: 'exact' })
      .gte('inicio', startOfMonth)
      .lte('inicio', endOfMonth);
    
    if (eventosError) {
      console.log('❌ Erro ao contar eventos:', eventosError.message);
    } else {
      console.log('✅ Eventos do mês encontrados:', eventosData?.length || 0);
    }
  } catch (error) {
    console.error('❌ Erro na verificação de eventos:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TESTE FINAL CONCLUÍDO');
  
  console.log('\n📋 INSTRUÇÕES PARA APLICAÇÃO MANUAL:');
  console.log('Se a função ainda apresentar erros, siga estes passos:');
  console.log('1. Acesse https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá para "SQL Editor"');
  console.log('4. Execute o conteúdo do arquivo: fix-dashboard-final-corrected.sql');
  console.log('5. Teste novamente executando este script');
}

// Executar o teste
testFinalDashboard().catch(console.error);