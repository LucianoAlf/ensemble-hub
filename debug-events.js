import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnqjqhqjqhqjqhqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWpxaHFqcWhxanFocWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTU5NzI5NCwiZXhwIjoyMDUxMTczMjk0fQ.VgCOQKJOQKJOQKJOQKJOQKJOQKJOQKJOQKJOQKJOQKI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEvents() {
  try {
    // Verificar tipos de evento
    const { data: tipos, error: tiposError } = await supabase
      .from('evento')
      .select('tipo')
      .limit(20);
    
    if (tiposError) {
      console.error('Erro ao buscar tipos:', tiposError);
      return;
    }
    
    console.log('Tipos encontrados:', tipos?.map(t => t.tipo));
    
    // Verificar eventos recentes
    const { data: eventos, error: eventosError } = await supabase
      .from('evento')
      .select('id, titulo, tipo, inicio, tenant_id')
      .order('inicio', { ascending: false })
      .limit(5);
    
    if (eventosError) {
      console.error('Erro ao buscar eventos:', eventosError);
      return;
    }
    
    console.log('Eventos recentes:', eventos);
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugEvents();