// Script para investigar a função get_evento_full
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateGetEventoFull() {
  console.log('=== Investigação da função get_evento_full ===\n');
  
  const eventoId = '8bd5616c-3326-4533-8fca-28d1f4789eb1';
  
  try {
    // 1. Verificar migrações aplicadas
    console.log('1. Verificando migrações aplicadas...');
    const { data: migrations, error: migrationsError } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('*')
      .order('version', { ascending: false });
    
    if (migrationsError) {
      console.log('Erro ao consultar migrações:', migrationsError.message);
    } else {
      console.log('Migrações aplicadas:');
      migrations.forEach(m => {
        console.log(`- ${m.version}: ${m.statements ? 'aplicada' : 'pendente'}`);
      });
      
      // Verificar se a migração 20250127000001 foi aplicada
      const eventModalMigration = migrations.find(m => m.version === '20250127000001');
      if (eventModalMigration) {
        console.log('\n✓ Migração 20250127000001 (create_event_modal_rpcs) foi aplicada');
      } else {
        console.log('\n✗ Migração 20250127000001 (create_event_modal_rpcs) NÃO foi aplicada');
      }
    }
    
    // 2. Tentar executar a função get_evento_full
    console.log('\n2. Tentando executar get_evento_full...');
    const { data: funcResult, error: funcError } = await supabase.rpc('get_evento_full', {
      evento_id: eventoId
    });
    
    if (funcError) {
      console.log('Erro ao executar get_evento_full:', funcError.message);
      console.log('Código do erro:', funcError.code);
      console.log('Detalhes:', funcError.details);
    } else {
      console.log('Resultado de get_evento_full:', funcResult);
    }
    
    // 3. Verificar se o evento existe na tabela
    console.log('\n3. Verificando se o evento existe na tabela...');
    const { data: evento, error: eventoError } = await supabase
      .from('evento')
      .select('*')
      .eq('id', eventoId)
      .single();
    
    if (eventoError) {
      console.log('Erro ao buscar evento:', eventoError.message);
    } else {
      console.log('Evento encontrado:', evento);
    }
    
    // 4. Listar todas as funções disponíveis
    console.log('\n4. Listando todas as funções RPC disponíveis...');
    const { data: allFunctions, error: allFuncError } = await supabase.rpc('get_dashboard_metrics');
    
    if (allFuncError) {
      console.log('Erro ao testar get_dashboard_metrics:', allFuncError.message);
    } else {
      console.log('get_dashboard_metrics funciona:', !!allFunctions);
    }
    
    // Tentar listar funções do schema public
    console.log('\n5. Tentando listar funções do schema public...');
    try {
      const { data: publicFunctions, error: publicFuncError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('pronamespace', 'public');
      
      if (publicFuncError) {
        console.log('Erro ao listar funções do pg_proc:', publicFuncError.message);
      } else {
        console.log('Funções encontradas no pg_proc:', publicFunctions);
      }
    } catch (err) {
      console.log('Erro ao acessar pg_proc:', err.message);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar a investigação
investigateGetEventoFull().then(() => {
  console.log('\n=== Investigação concluída ===');
}).catch(console.error);