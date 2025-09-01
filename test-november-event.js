// Script para criar um evento de teste em novembro
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNovemberEvent() {
  try {
    // Data para novembro de 2025
    const novemberDate = new Date('2025-11-15T20:00:00.000Z');
    
    const { data, error } = await supabase
      .from('evento')
      .insert({
        titulo: 'Recital Barra - Evento de Teste',
        tipo: 'show',
        inicio: novemberDate.toISOString(),
        fim: new Date(novemberDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas depois
        local: 'L.A Music & L.A Music Kids | Unidade Barra - Centro Metropolitano',
        endereco: 'Centro Metropolitano, Barra da Tijuca, Rio de Janeiro',
        status: 'confirmado',
        descricao: 'Evento de teste criado para verificar a exibição no Dashboard'
      })
      .select();
    
    if (error) {
      console.error('Erro ao criar evento:', error);
      return;
    }
    
    console.log('Evento criado com sucesso:', data);
    
    // Verificar se o evento aparece na view
    const { data: viewData, error: viewError } = await supabase
      .from('vw_eventos_proximos')
      .select('*')
      .eq('titulo', 'Recital Barra - Evento de Teste');
    
    if (viewError) {
      console.error('Erro ao consultar view:', viewError);
    } else {
      console.log('Evento na view:', viewData);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createNovemberEvent();