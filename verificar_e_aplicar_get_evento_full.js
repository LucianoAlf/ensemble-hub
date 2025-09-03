const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEAplicarGetEventoFull() {
  console.log('🔍 Verificando se a função get_evento_full existe no esquema public...');
  
  try {
    // 1. Verificar se a função existe
    const { data: existsData, error: existsError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT EXISTS (
          SELECT 1 FROM pg_proc p 
          JOIN pg_namespace n ON p.pronamespace = n.oid 
          WHERE n.nspname = 'public' AND p.proname = 'get_evento_full'
        ) AS function_exists;
      `
    });
    
    if (existsError) {
      console.log('⚠️ Erro ao verificar existência da função (tentando método alternativo):', existsError.message);
      
      // Método alternativo: tentar chamar a função
      const { error: callError } = await supabase.rpc('get_evento_full', {
        p_evento_id: '00000000-0000-0000-0000-000000000000'
      });
      
      if (callError && callError.code === 'PGRST202') {
        console.log('✅ Função get_evento_full NÃO existe (erro PGRST202 esperado)');
        console.log('📝 Aplicando a criação da função...');
        
        await aplicarFuncao();
      } else {
        console.log('✅ Função get_evento_full JÁ existe (chamada funcionou ou erro diferente)');
        console.log('❌ Não aplicando a função pois ela já existe.');
      }
      return;
    }
    
    const functionExists = existsData?.[0]?.function_exists;
    
    if (functionExists) {
      console.log('✅ Função get_evento_full JÁ existe no esquema public');
      console.log('❌ Não aplicando a função pois ela já existe.');
    } else {
      console.log('✅ Função get_evento_full NÃO existe no esquema public');
      console.log('📝 Aplicando a criação da função...');
      
      await aplicarFuncao();
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

async function aplicarFuncao() {
  const createFunctionSQL = `
-- CONTRATO: get_evento_full(p_evento_id uuid) RETURNS jsonb
-- Regras:
-- - SECURITY INVOKER para respeitar RLS
-- - Retorna o evento (respeitando RLS) + array de bandas
-- - 'observacoes' no JSON usa COALESCE(descricao, observacoes) para compatibilizar com o frontend

CREATE OR REPLACE FUNCTION public.get_evento_full(p_evento_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
AS $$
WITH e AS (
  SELECT id, titulo, tipo, inicio, fim, local, endereco, orcamento,
         -- compatibilização: preferir 'observacoes', senão 'descricao'
         COALESCE(observacoes, descricao) AS observacoes
  FROM public.evento
  WHERE id = p_evento_id
),
b AS (
  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object('id', b.id, 'nome', b.nome, 'genero', b.genero)
           ),
           '[]'::jsonb
         ) AS bandas
  FROM public.evento_banda eb
  JOIN public.banda b ON b.id = eb.banda_id
  WHERE eb.evento_id = p_evento_id
)
SELECT jsonb_build_object(
  'id', e.id,
  'titulo', e.titulo,
  'tipo', e.tipo,
  'inicio', e.inicio,
  'fim', e.fim,
  'local', e.local,
  'endereco', e.endereco,
  'orcamento', e.orcamento,
  'observacoes', e.observacoes,
  'bandas', b.bandas
)
FROM e LEFT JOIN b ON TRUE;
$$;

-- (Opcional, se o ambiente exigir GRANT explícito)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_schema='public' AND routine_name='get_evento_full' AND grantee='anon'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.get_evento_full(uuid) TO anon, authenticated;
  END IF;
END$$;
  `;
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: createFunctionSQL
    });
    
    if (error) {
      console.error('❌ Erro ao criar função:', error);
      return;
    }
    
    console.log('✅ Função get_evento_full criada com sucesso!');
    
    // Teste rápido
    console.log('🧪 Testando a função criada...');
    const { error: testError } = await supabase.rpc('get_evento_full', {
      p_evento_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (testError) {
      if (testError.code === 'P0001') {
        console.log('✅ Função criada e funcionando (erro P0001 esperado para UUID fictício)');
      } else {
        console.log('⚠️ Função criada mas com erro inesperado:', testError);
      }
    } else {
      console.log('✅ Função criada e testada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante aplicação da função:', error);
  }
}

verificarEAplicarGetEventoFull();