// Script para debug dos dados usando a mesma abordagem do frontend
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://legnxdmlmagysxirfiwe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos'
);

async function debugData() {
  console.log('🔍 DEBUG: Verificando dados com abordagem do frontend\n');

  try {
    // Verificar todas as tabelas e views mencionadas
    const queries = [
      { name: 'banda', query: supabase.from('banda').select('*') },
      { name: 'vw_bandas_lista', query: supabase.from('vw_bandas_lista').select('*') },
      { name: 'evento', query: supabase.from('evento').select('*') },
      { name: 'profiles', query: supabase.from('profiles').select('*') },
      { name: 'banda_membro', query: supabase.from('banda_membro').select('*') },
      { name: 'financeiro', query: supabase.from('financeiro').select('*') }
    ];

    for (const { name, query } of queries) {
      try {
        const { data, error, count } = await query;
        
        if (error) {
          console.log(`❌ ${name}: ${error.code} - ${error.message}`);
          if (error.details) console.log(`   Detalhes: ${error.details}`);
        } else {
          console.log(`✅ ${name}: ${count || data?.length || 0} registros`);
          
          if (data && data.length > 0) {
            console.log(`   Primeiro registro:`, JSON.stringify(data[0], null, 2));
            if (data.length > 1) {
              console.log(`   Último registro:`, JSON.stringify(data[data.length-1], null, 2));
            }
          } else {
            console.log(`   ⚠️ Tabela vazia`);
          }
        }
      } catch (err) {
        console.log(`❌ ${name}: ${err.message}`);
      }
      console.log('');
    }

    // Buscar com filtros específicos
    console.log('🔍 Buscando com filtros...');
    
    // Buscar bandas com nome parecido
    const { data: searchResults } = await supabase
      .from('banda')
      .select('*')
      .ilike('nome', '%original%');
    
    console.log(`Bandas com "original": ${searchResults?.length || 0}`);
    if (searchResults && searchResults.length > 0) {
      console.log(JSON.stringify(searchResults, null, 2));
    }

    // Verificar se há algum registro em qualquer tabela
    const { data: anyBanda } = await supabase.from('banda').select('id').limit(1);
    const { data: anyEvento } = await supabase.from('evento').select('id').limit(1);
    const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1);
    
    console.log('\n📊 Resumo:');
    console.log(`- banda: ${anyBanda?.length || 0} registros`);
    console.log(`- evento: ${anyEvento?.length || 0} registros`);
    console.log(`- profiles: ${anyProfile?.length || 0} registros`);

  } catch (err) {
    console.log('❌ Erro geral:', err);
  }
}

debugData();