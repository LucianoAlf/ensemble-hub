// Script simples para testar a função get_dashboard_metrics
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboard() {
  console.log('=== TESTE DA FUNÇÃO get_dashboard_metrics ===\n');
  
  try {
    // 1. Testar a função atual
    console.log('1. Testando função get_dashboard_metrics...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_dashboard_metrics');
    
    console.log('Resultado da função:', dashboardData);
    console.log('Erro da função:', dashboardError);
    
    // 2. Contar integrantes diretamente
    console.log('\n2. Contando integrantes ativos diretamente...');
    const { count: integrantesCount, error: integrantesError } = await supabase
      .from('banda_integrante')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);
    
    console.log('Contagem direta de integrantes ativos:', integrantesCount);
    console.log('Erro na contagem:', integrantesError);
    
    // 3. Verificar dados na tabela banda_integrante
    console.log('\n3. Verificando dados na tabela banda_integrante...');
    const { data: integrantesData, error: integrantesDataError } = await supabase
      .from('banda_integrante')
      .select('*')
      .eq('ativo', true);
    
    console.log('Dados dos integrantes ativos:', integrantesData);
    console.log('Erro ao buscar dados:', integrantesDataError);
    
    // 4. Resumo
    console.log('\n=== RESUMO ===');
    console.log('Função get_dashboard_metrics retornou:', dashboardData?.total_members || 'ERRO');
    console.log('Contagem real de integrantes ativos:', integrantesCount);
    console.log('Diferença:', (integrantesCount || 0) - (dashboardData?.total_members || 0));
    
    if (dashboardError) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('A função get_dashboard_metrics falhou com erro:', dashboardError.message);
    } else if ((dashboardData?.total_members || 0) !== (integrantesCount || 0)) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('A função retorna valor incorreto para total_members');
    } else {
      console.log('\n✅ Função funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar teste
testDashboard();