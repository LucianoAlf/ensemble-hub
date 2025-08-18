import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://legnxdmlmagysxirfiwe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos'
);

async function checkAllData() {
  console.log('🔍 Verificando todos os dados no banco...\n');

  try {
    // Verificar tabelas principais
    const tables = [
      'banda',
      'vw_bandas_lista', 
      'evento',
      'profiles',
      'banda_membro',
      'financeiro'
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} registros`);
          
          if (data && data.length > 0) {
            console.log(`   Dados:`, JSON.stringify(data, null, 2));
            console.log('');
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Verificar se tem banda chamada "Originals"
    console.log('\n🔍 Buscando banda "Originals"...');
    const { data: originals, error } = await supabase
      .from('banda')
      .select('*')
      .ilike('nome', 'originals');
    
    if (error) {
      console.log('❌ Erro ao buscar Originals:', error.message);
    } else if (originals && originals.length > 0) {
      console.log('✅ Banda "Originals" encontrada:', JSON.stringify(originals, null, 2));
    } else {
      console.log('⚠️ Banda "Originals" não encontrada');
    }

    // Verificar todas as bandas
    console.log('\n🔍 Todas as bandas:');
    const { data: allBands, error: bandsError } = await supabase
      .from('banda')
      .select('*');
    
    if (bandsError) {
      console.log('❌ Erro ao buscar bandas:', bandsError.message);
    } else {
      console.log(`✅ Total de bandas: ${allBands?.length || 0}`);
      if (allBands && allBands.length > 0) {
        console.log('   Bandas:', JSON.stringify(allBands, null, 2));
      }
    }

  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

checkAllData();