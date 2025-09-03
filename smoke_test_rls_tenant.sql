-- =====================================================
-- SMOKE TEST RLS/TENANT - Para Supabase SQL Editor
-- =====================================================
-- Execute cada seção separadamente no SQL Editor
-- MODO SOMENTE LEITURA - Nenhuma mudança será aplicada

-- =====================================================
-- PASSO 1: Meu tenant atual
-- =====================================================
-- Execute esta query quando estiver logado
SELECT 
  id AS user_id, 
  tenant_id AS tenant_user,
  'PASSO 1: Tenant identificado' AS status
FROM public.profiles 
WHERE id = auth.uid();

-- =====================================================
-- PASSO 2: Pegar um evento do meu tenant (se existir)
-- =====================================================
-- Execute após o PASSO 1 para usar seu tenant_id
WITH me AS (
  SELECT tenant_id 
  FROM public.profiles 
  WHERE id = auth.uid()
)
SELECT 
  e.id,
  e.tenant_id,
  e.titulo,
  e.inicio,
  'PASSO 2: Evento do meu tenant' AS status
FROM public.evento e
JOIN me ON me.tenant_id = e.tenant_id
ORDER BY e.inicio DESC NULLS LAST 
LIMIT 1;

-- =====================================================
-- PASSO 2b: Verificar todos os eventos disponíveis
-- =====================================================
-- Para análise geral (independente de tenant)
SELECT 
  id,
  tenant_id,
  titulo,
  inicio,
  'PASSO 2b: Todos os eventos' AS status
FROM public.evento
ORDER BY inicio DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- PASSO 3: Testar RPCs com ID específico
-- =====================================================
-- SUBSTITUA 'SEU_EVENTO_ID' pelo ID obtido no PASSO 2
-- Exemplo: SELECT public.get_evento_full('0de248d0-4d5e-430a-b574-67f12165bb07');

-- Teste da RPC (substitua o ID)
SELECT 
  public.get_evento_full('SEU_EVENTO_ID_AQUI') AS resultado_rpc,
  'PASSO 3a: Teste RPC' AS status;

-- Performance da RPC (substitua o ID)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT public.get_evento_full('SEU_EVENTO_ID_AQUI');

-- =====================================================
-- PASSO 4: Teste de bloqueio cross-tenant
-- =====================================================
-- Primeiro, identifique eventos de diferentes tenants
SELECT 
  tenant_id,
  COUNT(*) as total_eventos,
  array_agg(id ORDER BY inicio DESC) as evento_ids,
  'PASSO 4a: Eventos por tenant' AS status
FROM public.evento
GROUP BY tenant_id
ORDER BY total_eventos DESC;

-- Teste com evento de outro tenant (se existir)
-- SUBSTITUA pelos IDs reais encontrados acima
SELECT 
  public.get_evento_full('ID_DE_OUTRO_TENANT_AQUI') AS resultado_cross_tenant,
  'PASSO 4b: Teste cross-tenant' AS status;

-- =====================================================
-- PASSO 5: Resumo e Diagnóstico
-- =====================================================

-- 5a) Verificar meu contexto atual
SELECT 
  auth.uid() AS meu_user_id,
  p.tenant_id AS meu_tenant_id,
  p.full_name,
  'PASSO 5a: Meu contexto' AS status
FROM public.profiles p
WHERE p.id = auth.uid();

-- 5b) Contar eventos por tenant
SELECT 
  e.tenant_id,
  COUNT(*) as total_eventos,
  MIN(e.inicio) as primeiro_evento,
  MAX(e.inicio) as ultimo_evento,
  'PASSO 5b: Estatísticas por tenant' AS status
FROM public.evento e
GROUP BY e.tenant_id
ORDER BY total_eventos DESC;

-- 5c) Verificar RLS na tabela evento
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  'PASSO 5c: Status RLS' AS status
FROM pg_tables 
WHERE tablename = 'evento' AND schemaname = 'public';

-- 5d) Verificar políticas RLS (se visíveis)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  'PASSO 5d: Políticas RLS' AS status
FROM pg_policies 
WHERE tablename = 'evento' AND schemaname = 'public';

-- 5e) Verificar função get_evento_full
SELECT 
  p.proname,
  p.proargnames,
  p.proargtypes::regtype[],
  p.prorettype::regtype,
  'PASSO 5e: Função get_evento_full' AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_evento_full' AND n.nspname = 'public';

-- =====================================================
-- TEMPLATE DE RESULTADOS PARA ANÁLISE
-- =====================================================
/*
RESUMO PASS/FAIL:

✅/❌ Meu tenant identificado: ___________
✅/❌ Eventos do meu tenant acessíveis: ___________
✅/❌ RPC get_evento_full funciona: ___________
✅/❌ Bloqueio cross-tenant funciona: ___________
✅/❌ Performance aceitável (< 100ms): ___________

PERFORMANCE:
- Tempo EXPLAIN: _______ ms
- Usou índice: ✅/❌
- Buffers hit: _______
- Buffers read: _______

OBSERVAÇÕES:
1. _________________________________
2. _________________________________
3. _________________________________

RECOMENDAÇÕES:
1. _________________________________
2. _________________________________
3. _________________________________
*/

-- =====================================================
-- QUERIES DE DIAGNÓSTICO ADICIONAL (OPCIONAL)
-- =====================================================

-- Verificar índices na tabela evento
SELECT 
  indexname,
  indexdef,
  'Índices da tabela evento' AS status
FROM pg_indexes 
WHERE tablename = 'evento' AND schemaname = 'public';

-- Verificar constraints
SELECT 
  conname,
  contype,
  confrelid::regclass AS foreign_table,
  'Constraints da tabela evento' AS status
FROM pg_constraint 
WHERE conrelid = 'public.evento'::regclass;

-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  'Triggers da tabela evento' AS status
FROM information_schema.triggers 
WHERE table_name = 'evento' AND table_schema = 'public';

-- =====================================================
-- FIM DO SMOKE TEST
-- =====================================================