import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const EVENT_ID = '8bd5616c-3326-4533-8fca-28d1f4789eb1';

console.log('🔍 Verificando evento específico...');
console.log('Event ID:', EVENT_ID);

async function checkEvent() {
  try {
    // 1. Verificar se o evento existe na tabela evento
    console.log('\n1. Verificando se o evento existe na tabela evento:');
    const { data: eventData, error: eventError } = await supabase
      .from('evento')
      .select('id, titulo, inicio, local')
      .eq('id', EVENT_ID)
      .single();
    
    if (eventError) {
      console.error('❌ Erro ao buscar evento:', eventError);
      if (eventError.code === 'PGRST116') {
        console.log('❌ Evento não encontrado na tabela evento');
        return;
      }
    } else {
      console.log('✅ Evento encontrado:', eventData);
    }

    // 2. Testar a função get_evento_full
    console.log('\n2. Testando função get_evento_full:');
    const { data: fullEventData, error: fullEventError } = await supabase
      .rpc('get_evento_full', { p_evento_id: EVENT_ID });
    
    if (fullEventError) {
      console.error('❌ Erro na função get_evento_full:', fullEventError);
      console.log('Código do erro:', fullEventError.code);
      console.log('Mensagem:', fullEventError.message);
      console.log('Detalhes:', fullEventError.details);
      console.log('Hint:', fullEventError.hint);
    } else {
      console.log('✅ Função get_evento_full executada com sucesso:');
      console.log('Dados retornados:', JSON.stringify(fullEventData, null, 2));
    }

    // 3. Verificar se a função existe
    console.log('\n3. Verificando se a função get_evento_full existe:');
    const { data: functionExists, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_evento_full');
    
    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError);
    } else {
      console.log('Função existe:', functionExists?.length > 0 ? '✅ Sim' : '❌ Não');
      if (functionExists?.length > 0) {
        console.log('Funções encontradas:', functionExists);
      }
    }

    // 4. Listar todas as funções disponíveis que contêm 'evento'
    console.log('\n4. Listando funções relacionadas a evento:');
    const { data: eventFunctions, error: eventFunctionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .ilike('proname', '%evento%');
    
    if (eventFunctionsError) {
      console.error('❌ Erro ao listar funções:', eventFunctionsError);
    } else {
      console.log('Funções relacionadas a evento:', eventFunctions);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkEvent();