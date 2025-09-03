// Script para verificar a função get_evento_full no Supabase
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://legnxdmlmagysxirfiwe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 VERIFICANDO FUNÇÃO get_evento_full');
console.log('=' .repeat(60));

async function verificarFuncaoGetEventoFull() {
  try {
    console.log('\n📋 1) Procurando por funções relacionadas...');
    
    // 1) Procurar por funções relacionadas
    const { data: funcoes, error: errorFuncoes } = await supabase.rpc('sql', {
      query: `
        SELECT n.nspname AS schema, p.proname AS fn, pg_get_function_identity_arguments(p.oid) AS args,
               CASE p.prosecdef WHEN TRUE THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname IN ('public')
          AND p.proname ILIKE ANY (ARRAY['get_evento_full','%evento_full%','%evento%full%'])
        ORDER BY n.nspname, p.proname;
      `
    });
    
    if (errorFuncoes) {
      console.log('❌ Erro ao buscar funções:', errorFuncoes.message);
      
      // Tentativa alternativa usando execute_sql diretamente
      console.log('\n🔄 Tentando método alternativo...');
      const { data: funcoesAlt, error: errorAlt } = await supabase
        .from('pg_proc')
        .select(`
          proname,
          pg_namespace!inner(nspname)
        `)
        .eq('pg_namespace.nspname', 'public')
        .ilike('proname', '%evento%');
        
      if (errorAlt) {
        console.log('❌ Método alternativo também falhou:', errorAlt.message);
      } else {
        console.log('✅ Funções encontradas (método alternativo):', funcoesAlt);
      }
    } else {
      console.log('✅ Funções encontradas:', funcoes);
    }

    console.log('\n📋 2) Verificando search_path...');
    
    // 2) Checar search_path
    const { data: searchPath, error: errorPath } = await supabase.rpc('sql', {
      query: 'SHOW search_path;'
    });
    
    if (errorPath) {
      console.log('❌ Erro ao verificar search_path:', errorPath.message);
    } else {
      console.log('✅ Search path:', searchPath);
    }

    console.log('\n📋 3) Verificando privilégios de execução...');
    
    // 3) Verificar privilégios
    const { data: privilegios, error: errorPriv } = await supabase.rpc('sql', {
      query: `
        SELECT 'anon' AS role, has_function_privilege('anon', 'public.get_evento_full(uuid)', 'EXECUTE') AS can_exec
        UNION ALL
        SELECT 'authenticated', has_function_privilege('authenticated', 'public.get_evento_full(uuid)', 'EXECUTE');
      `
    });
    
    if (errorPriv) {
      console.log('❌ Erro ao verificar privilégios:', errorPriv.message);
    } else {
      console.log('✅ Privilégios:', privilegios);
    }

    console.log('\n📋 4) Testando chamada direta da função...');
    
    // 4) Testar chamada direta (se existir)
    const { data: testeRPC, error: errorRPC } = await supabase.rpc('get_evento_full', {
      evento_id: '00000000-0000-0000-0000-000000000000' // UUID fictício para teste
    });
    
    if (errorRPC) {
      console.log('❌ Erro ao chamar get_evento_full:', errorRPC.message);
      console.log('   Código:', errorRPC.code);
      console.log('   Detalhes:', errorRPC.details);
    } else {
      console.log('✅ Função get_evento_full executável! Resultado:', testeRPC);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar verificação
verificarFuncaoGetEventoFull()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na execução:', error);
    process.exit(1);
  });