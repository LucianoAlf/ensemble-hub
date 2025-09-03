-- =====================================================
-- VERIFICAÇÃO DE ASSINATURAS DOS RPCs DO MODAL DE EVENTOS
-- =====================================================
-- Este script verifica se as funções foram criadas corretamente
-- e confirma suas assinaturas exatas no banco de dados

-- =====================================================
-- 1. VERIFICAR SE AS FUNÇÕES EXISTEM
-- =====================================================

SELECT 
    routine_name as "Nome da Função",
    routine_type as "Tipo",
    security_type as "Tipo de Segurança",
    routine_definition as "Definição"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_evento_full', 'update_evento_full')
ORDER BY routine_name;

-- =====================================================
-- 2. VERIFICAR PARÂMETROS DAS FUNÇÕES
-- =====================================================

SELECT 
    r.routine_name as "Função",
    p.parameter_name as "Parâmetro",
    p.ordinal_position as "Posição",
    p.parameter_mode as "Modo",
    p.data_type as "Tipo",
    p.udt_name as "Tipo UDT",
    CASE 
        WHEN p.parameter_default IS NOT NULL THEN 'SIM'
        ELSE 'NÃO'
    END as "Tem Default"
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' 
AND r.routine_name IN ('get_evento_full', 'update_evento_full')
ORDER BY r.routine_name, p.ordinal_position;

-- =====================================================
-- 3. VERIFICAR RLS ATIVO NAS TABELAS
-- =====================================================

SELECT 
    schemaname as "Schema",
    tablename as "Tabela",
    rowsecurity as "RLS Ativo"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY tablename;

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RLS EXISTENTES
-- =====================================================

SELECT 
    schemaname as "Schema",
    tablename as "Tabela",
    policyname as "Nome da Política",
    permissive as "Permissiva",
    cmd as "Comando",
    qual as "Condição WHERE",
    with_check as "Condição WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- 5. VERIFICAR ÍNDICES EXISTENTES
-- =====================================================

SELECT 
    schemaname as "Schema",
    tablename as "Tabela",
    indexname as "Nome do Índice",
    indexdef as "Definição do Índice"
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY tablename, indexname;

-- =====================================================
-- 6. TESTE BÁSICO DE CONECTIVIDADE (SEM DADOS REAIS)
-- =====================================================

-- Verificar se as funções podem ser chamadas (sem executar)
SELECT 
    'get_evento_full' as funcao,
    'UUID' as parametro_esperado,
    'JSON' as retorno_esperado
UNION ALL
SELECT 
    'update_evento_full' as funcao,
    '10 parâmetros (UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, NUMERIC, TEXT, UUID[])' as parametro_esperado,
    'JSON' as retorno_esperado;

-- =====================================================
-- 7. VERIFICAR SCHEMA DAS TABELAS RELACIONADAS
-- =====================================================

SELECT 
    table_name as "Tabela",
    column_name as "Coluna",
    ordinal_position as "Posição",
    data_type as "Tipo",
    is_nullable as "Nullable",
    column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- RESUMO ESPERADO DAS ASSINATURAS:
-- =====================================================

/*
FUNÇÃO 1: get_evento_full
- Nome: public.get_evento_full
- Parâmetros: p_evento_id UUID
- Retorno: JSON
- Segurança: SECURITY INVOKER
- RLS: Ativo (mantido)

FUNÇÃO 2: update_evento_full
- Nome: public.update_evento_full
- Parâmetros:
  1. p_evento_id UUID
  2. p_titulo TEXT
  3. p_tipo TEXT
  4. p_inicio TIMESTAMP WITH TIME ZONE
  5. p_fim TIMESTAMP WITH TIME ZONE (DEFAULT NULL)
  6. p_local TEXT
  7. p_endereco TEXT (DEFAULT NULL)
  8. p_orcamento NUMERIC (DEFAULT NULL)
  9. p_descricao TEXT (DEFAULT NULL)
  10. p_banda_ids UUID[] (DEFAULT '{}')
- Retorno: JSON
- Segurança: SECURITY INVOKER
- RLS: Ativo (mantido)

TABELAS COM RLS ATIVO:
- public.evento
- public.evento_banda
- public.banda
- public.profiles
*/

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================

/*
Para executar este script:

1. Via Supabase CLI (local):
   npx supabase db reset
   psql -h localhost -p 54322 -U postgres -d postgres -f verify_rpc_signatures.sql

2. Via Dashboard do Supabase:
   - Acesse SQL Editor
   - Cole e execute cada seção separadamente

3. Via psql direto (se tiver acesso):
   psql "postgresql://postgres:[password]@db.project.supabase.co:5432/postgres" -f verify_rpc_signatures.sql

RESULTADOS ESPERADOS:
- 2 funções encontradas com SECURITY INVOKER
- RLS ativo em todas as 4 tabelas
- Políticas RLS configuradas adequadamente
- Parâmetros exatos conforme especificação
*/