// Script simplificado para verificar se a função get_evento_full existe
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://legnxdmlmagysxirfiwe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 VERIFICAÇÃO SIMPLES DA FUNÇÃO get_evento_full');
console.log('=' .repeat(60));

async function verificarFuncao() {
  try {
    console.log('\n📋 1) Verificando se a função existe através de uma consulta direta...');
    
    // Usar uma query SQL direta através do PostgREST
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_evento_full')
      .single();
    
    if (error) {
      console.log('❌ Erro ao consultar pg_proc:', error.message);
      console.log('   Isso pode indicar que não temos acesso às tabelas do sistema PostgreSQL');
    } else {
      console.log('✅ Função encontrada no catálogo do sistema:', data);
    }

    console.log('\n📋 2) Testando chamada direta da função com parâmetro correto...');
    
    // Testar com o nome correto do parâmetro baseado na migração
    const { data: testeRPC, error: errorRPC } = await supabase.rpc('get_evento_full', {
      p_evento_id: '00000000-0000-0000-0000-000000000000' // UUID fictício
    });
    
    if (errorRPC) {
      console.log('❌ Erro ao chamar get_evento_full:', errorRPC.message);
      console.log('   Código:', errorRPC.code);
      console.log('   Detalhes:', errorRPC.details);
      
      // Verificar se é erro de função não encontrada ou erro de execução
      if (errorRPC.code === 'PGRST202') {
        console.log('\n🔍 A função não foi encontrada no schema cache.');
        console.log('   Isso pode indicar que:');
        console.log('   - A migração não foi aplicada');
        console.log('   - A função foi criada mas não está acessível via PostgREST');
        console.log('   - Há um problema de permissões');
      } else {
        console.log('\n✅ A função existe, mas houve erro na execução (esperado com UUID fictício)');
      }
    } else {
      console.log('✅ Função get_evento_full executável! Resultado:', testeRPC);
    }

    console.log('\n📋 3) Verificando informações do schema atual...');
    
    // Tentar obter informações sobre as funções disponíveis
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .ilike('routine_name', '%evento%');
    
    if (schemaError) {
      console.log('❌ Erro ao consultar information_schema:', schemaError.message);
    } else {
      console.log('✅ Funções relacionadas a evento encontradas:', schemaInfo);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar verificação
verificarFuncao()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    console.log('\n📝 RESUMO:');
    console.log('- Se a função não foi encontrada (PGRST202), a migração pode não ter sido aplicada');
    console.log('- Se houve erro de execução mas não PGRST202, a função existe mas falhou na validação');
    console.log('- Verifique se as migrações foram aplicadas com: npx supabase db push');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na execução:', error);
    process.exit(1);
  });