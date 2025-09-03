// Script para aplicar a função get_evento_full manualmente
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função get_evento_full extraída da migração
const getEventoFullFunction = `
CREATE OR REPLACE FUNCTION public.get_evento_full(p_evento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_evento_tenant_id UUID;
  v_result JSON;
BEGIN
  -- 1. Obter tenant_id do usuário autenticado
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário deve ter um tenant_id válido';
  END IF;
  
  -- 2. Verificar se o evento existe e obter seu tenant_id
  SELECT tenant_id INTO v_evento_tenant_id
  FROM public.evento
  WHERE id = p_evento_id;
  
  IF v_evento_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;
  
  -- 3. Validar que o evento pertence ao mesmo tenant do usuário
  IF v_evento_tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Acesso negado: evento pertence a outro tenant';
  END IF;
  
  -- 4. Construir resultado JSON com dados do evento e bandas
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
        AND b.tenant_id = v_tenant_id
      ),
      '[]'::json
    )
  ) INTO v_result
  FROM public.evento e
  WHERE e.id = p_evento_id;
  
  RETURN v_result;
END;
$function$;
`;

async function applyGetEventoFull() {
  console.log('=== Aplicando função get_evento_full ===\n');
  
  try {
    // Tentar aplicar a função usando SQL direto
    console.log('Aplicando função get_evento_full...');
    
    // Como não temos acesso direto ao SQL, vamos tentar usar um RPC que execute SQL
    // Primeiro, vamos verificar se existe algum RPC que permita executar SQL
    const { data: result, error } = await supabase.rpc('exec_sql', {
      sql: getEventoFullFunction
    });
    
    if (error) {
      console.log('Erro ao aplicar função via exec_sql:', error.message);
      
      // Tentar método alternativo - criar via API REST
      console.log('\nTentando método alternativo...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql: getEventoFullFunction })
      });
      
      if (!response.ok) {
        console.log('Erro na requisição REST:', await response.text());
      } else {
        console.log('Função aplicada com sucesso via REST!');
      }
    } else {
      console.log('Função aplicada com sucesso!');
    }
    
    // Testar a função após aplicação
    console.log('\nTestando função get_evento_full...');
    const { data: testResult, error: testError } = await supabase.rpc('get_evento_full', {
      p_evento_id: '8bd5616c-3326-4533-8fca-28d1f4789eb1'
    });
    
    if (testError) {
      console.log('Erro ao testar função:', testError.message);
    } else {
      console.log('Função testada com sucesso:', testResult);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar aplicação
applyGetEventoFull().then(() => {
  console.log('\n=== Aplicação concluída ===');
}).catch(console.error);