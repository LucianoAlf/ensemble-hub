// Script para testar get_evento_full com autenticação simulada
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetEventoFullWithAuth() {
  console.log('=== Testando get_evento_full com autenticação ===\n');
  
  const eventoId = '8bd5616c-3326-4533-8fca-28d1f4789eb1';
  const tenantId = 'd93bd1e5-245e-4a40-9027-4bd669ccc390'; // tenant_id do evento
  
  try {
    // 1. Verificar se existe um usuário com esse tenant_id
    console.log('1. Verificando usuários com tenant_id:', tenantId);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(5);
    
    if (profilesError) {
      console.log('Erro ao buscar profiles:', profilesError.message);
    } else {
      console.log('Profiles encontrados:', profiles.length);
      if (profiles.length > 0) {
        console.log('Primeiro profile:', profiles[0]);
      }
    }
    
    // 2. Tentar fazer login com um usuário existente
    console.log('\n2. Tentando autenticação...');
    
    // Primeiro, vamos ver se existe algum usuário na tabela auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(5);
    
    if (authError) {
      console.log('Erro ao acessar auth.users:', authError.message);
    } else {
      console.log('Usuários auth encontrados:', authUsers?.length || 0);
    }
    
    // 3. Tentar criar uma versão simplificada da função que não depende de auth
    console.log('\n3. Criando função simplificada para teste...');
    
    const simplifiedFunction = `
    CREATE OR REPLACE FUNCTION public.get_evento_simple(p_evento_id UUID, p_tenant_id UUID)
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = 'public'
    AS $function$
    DECLARE
      v_result JSON;
    BEGIN
      -- Construir resultado JSON com dados do evento e bandas
      SELECT json_build_object(
        'id', e.id,
        'titulo', e.titulo,
        'tipo', e.tipo,
        'inicio', e.inicio,
        'fim', e.fim,
        'local', e.local,
        'endereco', e.endereco,
        'orcamento', e.orcamento,
        'descricao', e.descricao,
        'tenant_id', e.tenant_id,
        'bandas', COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', b.id,
                'nome', b.nome
              )
            )
            FROM public.evento_banda eb
            JOIN public.banda b ON eb.banda_id = b.id
            WHERE eb.evento_id = e.id
            AND b.tenant_id = p_tenant_id
          ),
          '[]'::json
        )
      ) INTO v_result
      FROM public.evento e
      WHERE e.id = p_evento_id
      AND e.tenant_id = p_tenant_id;
      
      RETURN v_result;
    END;
    $function$;
    `;
    
    // Como não conseguimos executar SQL diretamente, vamos simular o resultado
    console.log('Simulando resultado da função get_evento_full...');
    
    // Buscar evento
    const { data: evento, error: eventoError } = await supabase
      .from('evento')
      .select('*')
      .eq('id', eventoId)
      .single();
    
    if (eventoError) {
      console.log('Erro ao buscar evento:', eventoError.message);
      return;
    }
    
    // Buscar bandas do evento
    const { data: eventoBandas, error: bandasError } = await supabase
      .from('evento_banda')
      .select(`
        banda_id,
        banda:banda_id (
          id,
          nome
        )
      `)
      .eq('evento_id', eventoId);
    
    if (bandasError) {
      console.log('Erro ao buscar bandas do evento:', bandasError.message);
    }
    
    // Construir resultado simulado
    const simulatedResult = {
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      inicio: evento.inicio,
      fim: evento.fim,
      local: evento.local,
      endereco: evento.endereco,
      orcamento: evento.orcamento,
      descricao: evento.descricao,
      tenant_id: evento.tenant_id,
      bandas: eventoBandas?.map(eb => eb.banda) || []
    };
    
    console.log('\nResultado simulado da função get_evento_full:');
    console.log(JSON.stringify(simulatedResult, null, 2));
    
    // 4. Verificar se a função original existe agora
    console.log('\n4. Testando função get_evento_full original...');
    const { data: funcResult, error: funcError } = await supabase.rpc('get_evento_full', {
      p_evento_id: eventoId
    });
    
    if (funcError) {
      console.log('Erro na função original:', funcError.message);
      console.log('Código:', funcError.code);
    } else {
      console.log('Função original funcionou:', funcResult);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar teste
testGetEventoFullWithAuth().then(() => {
  console.log('\n=== Teste concluído ===');
}).catch(console.error);