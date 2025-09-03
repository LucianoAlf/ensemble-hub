Quero uma AUDITORIA COMPLETA do schema `public`, com relatório consolidado. 
**NÃO aplique mudanças**: apenas colete evidências e sugira patches. 
Formato de saída: seções com PASS/FAIL + evidências (linhas resumidas) + PATCH SQL sugerido quando FAIL.

Tabelas foco: evento, evento_banda, banda, banda_membro, profiles, financeiro, transactions, unidade.  
RPCs foco: public.get_evento_full(uuid), public.update_evento_full(...).

────────────────────────────────────────────────────────────────────────
[1] INVENTÁRIO DE SCHEMA (colunas, PK/FK/UNIQUE, defaults, índices)
────────────────────────────────────────────────────────────────────────
-- Colunas
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
ORDER BY table_name, ordinal_position;

-- Constraints (PK/FK/UNIQUE)
SELECT tc.table_name, tc.constraint_type, tc.constraint_name,
       kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema
WHERE tc.table_schema='public'
  AND tc.table_name IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Índices
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
ORDER BY tablename, indexname;

────────────────────────────────────────────────────────────────────────
[2] RLS & POLÍTICAS
────────────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public'
  AND tablename IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
ORDER BY tablename;

SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
ORDER BY tablename, policyname;

────────────────────────────────────────────────────────────────────────
[3] CONSISTÊNCIA DE TENANT (existência + alinhamento entre relacionamentos)
────────────────────────────────────────────────────────────────────────
-- Quais tabelas têm tenant_id
SELECT table_name, bool_or(column_name='tenant_id') AS has_tenant_id
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
GROUP BY table_name ORDER BY table_name;

-- Mismatch de tenant_id (contagens)
SELECT 'evento_banda_vs_evento' AS check, COUNT(*) AS mismatches
FROM public.evento_banda eb JOIN public.evento e ON e.id=eb.evento_id
WHERE eb.tenant_id IS DISTINCT FROM e.tenant_id
UNION ALL
SELECT 'evento_banda_vs_banda', COUNT(*)
FROM public.evento_banda eb JOIN public.banda b ON b.id=eb.banda_id
WHERE eb.tenant_id IS DISTINCT FROM b.tenant_id
UNION ALL
SELECT 'banda_membro_vs_banda', COUNT(*)
FROM public.banda_membro bm JOIN public.banda b ON b.id=bm.banda_id
WHERE bm.tenant_id IS DISTINCT FROM b.tenant_id
UNION ALL
SELECT 'banda_membro_vs_profiles', COUNT(*)
FROM public.banda_membro bm JOIN public.profiles p ON p.id=bm.profile_id
WHERE bm.tenant_id IS DISTINCT FROM p.tenant_id;

────────────────────────────────────────────────────────────────────────
[4] ÓRFÃOS (integridade referencial)
────────────────────────────────────────────────────────────────────────
SELECT 'eb_sem_evento' AS check, COUNT(*) FROM public.evento_banda eb
WHERE NOT EXISTS (SELECT 1 FROM public.evento e WHERE e.id=eb.evento_id)
UNION ALL
SELECT 'eb_sem_banda', COUNT(*) FROM public.evento_banda eb
WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id=eb.banda_id)
UNION ALL
SELECT 'bm_sem_banda', COUNT(*) FROM public.banda_membro bm
WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id=bm.banda_id)
UNION ALL
SELECT 'bm_sem_profile', COUNT(*) FROM public.banda_membro bm
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=bm.profile_id);

────────────────────────────────────────────────────────────────────────
[5] DATETIME & TIMEZONE (timestamp vs timestamptz)
────────────────────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('evento','profiles')
  AND column_name IN ('inicio','fim','created_at','updated_at')
ORDER BY table_name, column_name;

────────────────────────────────────────────────────────────────────────
[6] RPCs (existência, assinatura, SECURITY, privilégios)
────────────────────────────────────────────────────────────────────────
-- Funções alvo
SELECT n.nspname AS schema, p.proname AS function,
       pg_get_function_identity_arguments(p.oid) AS args,
       CASE p.prosecdef WHEN TRUE THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('get_evento_full','update_evento_full')
ORDER BY p.proname;

-- Privilégios de EXECUTE (se permitido)
SELECT 'anon' AS role, has_function_privilege('anon','public.get_evento_full(uuid)','EXECUTE') AS can_exec
UNION ALL
SELECT 'authenticated', has_function_privilege('authenticated','public.get_evento_full(uuid)','EXECUTE');

-- Teste de execução do get_evento_full dentro do tenant do usuário
WITH me AS (SELECT tenant_id FROM public.profiles WHERE id=auth.uid()),
sample AS (
  SELECT e.id FROM public.evento e JOIN me ON me.tenant_id=e.tenant_id
  ORDER BY e.inicio DESC NULLS LAST LIMIT 1
)
SELECT 'sample_event_id' AS k, id FROM sample;

-- (Se houver um id) Executar:
-- SELECT public.get_evento_full((SELECT id FROM sample));

────────────────────────────────────────────────────────────────────────
[7] PERFORMANCE (planos e uso de índices)
────────────────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, titulo, inicio
FROM public.evento
WHERE inicio >= now()
ORDER BY inicio ASC
LIMIT 10;

────────────────────────────────────────────────────────────────────────
[8] CONTRATO FRONTEND ⇄ BACKEND (modal de evento)
────────────────────────────────────────────────────────────────────────
-- Verificar existência de campos esperados (descricao/observacoes)
SELECT column_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='evento'
  AND column_name IN ('descricao','observacoes');

-- Se o get_evento_full puder rodar (do passo [6]), validar chaves no JSON:
-- SELECT jsonb_object_keys(public.get_evento_full((SELECT id FROM sample))) AS keys;

────────────────────────────────────────────────────────────────────────
[9] RELATÓRIO FINAL
────────────────────────────────────────────────────────────────────────
Com base nas saídas acima, entregue:
- PASS/FAIL por seção (1 a 8) com 2–4 linhas de evidências.
- Para cada FAIL, **PATCH SQL sugerido** mínimo (não executar) — exemplo:
  - Habilitar RLS / criar políticas por tenant
  - Adicionar FK/UNIQUE/índices essenciais
  - Ajustar tipos para timestamptz
  - Conceder EXECUTE nos RPCs
  - Corrigir mismatch/órfãos (com DELETE/UPDATE sugerido)

No final, inclua:
- Top 10 correções prioritárias (ordem de execução)
- Bloco “reteste” (queries a executar para validar depois da correção)
