// Teste simples para verificar consulta de eventos
import { supabase } from './src/integrations/supabase/client.js';

async function testEventsQuery() {
  console.log('Testando consulta de eventos...');
  
  try {
    // Teste 1: Consulta simples sem join
    console.log('\n1. Consulta simples:');
    const { data: eventos, error: error1 } = await supabase
      .from('evento')
      .select('*')
      .limit(5);
    
    if (error1) {
      console.error('Erro na consulta simples:', error1);
    } else {
      console.log('Eventos encontrados:', eventos?.length || 0);
      console.log('Primeiro evento:', eventos?.[0]);
    }
    
    // Teste 2: Consulta com join (como na página)
    console.log('\n2. Consulta com join:');
    const { data: eventosComBanda, error: error2 } = await supabase
      .from('evento')
      .select(`
        id, titulo, tipo, inicio, local, endereco, orcamento, descricao, status,
        banda:banda_id(nome)
      `)
      .limit(5);
    
    if (error2) {
      console.error('Erro na consulta com join:', error2);
    } else {
      console.log('Eventos com banda encontrados:', eventosComBanda?.length || 0);
      console.log('Primeiro evento com banda:', eventosComBanda?.[0]);
    }
    
    // Teste 3: Verificar se há dados na tabela
    console.log('\n3. Contagem total:');
    const { count, error: error3 } = await supabase
      .from('evento')
      .select('*', { count: 'exact', head: true });
    
    if (error3) {
      console.error('Erro na contagem:', error3);
    } else {
      console.log('Total de eventos na tabela:', count);
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

testEventsQuery();