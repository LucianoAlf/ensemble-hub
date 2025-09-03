// Script para testar as views vw_eventos_proximos e vw_proximos_eventos
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('🔍 Testando views de eventos próximos...');
console.log('=' .repeat(50));

async function testViews() {
  try {
    console.log('\n1. Testando vw_eventos_proximos...');
    const { data: eventosProximos, error: error1 } = await supabase
      .from('vw_eventos_proximos')
      .select('*', { count: 'exact', head: true });
    
    if (error1) {
      console.error('❌ Erro em vw_eventos_proximos:', error1.message);
    } else {
      console.log('✅ vw_eventos_proximos - COUNT:', eventosProximos?.length || 0);
    }

    console.log('\n2. Testando vw_proximos_eventos...');
    const { data: proximosEventos, error: error2 } = await supabase
      .from('vw_proximos_eventos')
      .select('*', { count: 'exact', head: true });
    
    if (error2) {
      console.error('❌ Erro em vw_proximos_eventos:', error2.message);
    } else {
      console.log('✅ vw_proximos_eventos - COUNT:', proximosEventos?.length || 0);
    }

    // Teste adicional: buscar dados reais das views
    console.log('\n3. Buscando dados reais das views...');
    
    const { data: eventosData, error: error3 } = await supabase
      .from('vw_eventos_proximos')
      .select('*')
      .limit(5);
    
    if (error3) {
      console.error('❌ Erro ao buscar dados de vw_eventos_proximos:', error3.message);
    } else {
      console.log('📊 vw_eventos_proximos - Primeiros 5 registros:');
      console.log(eventosData);
    }

    const { data: proximosData, error: error4 } = await supabase
      .from('vw_proximos_eventos')
      .select('*')
      .limit(5);
    
    if (error4) {
      console.error('❌ Erro ao buscar dados de vw_proximos_eventos:', error4.message);
    } else {
      console.log('📊 vw_proximos_eventos - Primeiros 5 registros:');
      console.log(proximosData);
    }

    // Teste da função get_dashboard_metrics
    console.log('\n4. Testando função get_dashboard_metrics...');
    const { data: metricsData, error: error5 } = await supabase
      .rpc('get_dashboard_metrics');
    
    if (error5) {
      console.error('❌ Erro em get_dashboard_metrics:', error5.message);
    } else {
      console.log('📈 get_dashboard_metrics resultado:');
      console.log(metricsData);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

testViews();