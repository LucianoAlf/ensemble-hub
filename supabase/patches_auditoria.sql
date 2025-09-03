-- =====================================================
-- PATCHES SQL PARA CORREÇÕES DA AUDITORIA
-- =====================================================
-- Este arquivo contém todos os patches SQL sugeridos
-- organizados por prioridade e seção
-- 
-- IMPORTANTE: 
-- - NÃO EXECUTAR EM PRODUÇÃO SEM TESTE
-- - FAZER BACKUP ANTES DE APLICAR
-- - EXECUTAR EM ORDEM DE PRIORIDADE
-- =====================================================

-- =====================================================
-- PATCHES CRÍTICOS (PRIORIDADE 1 - EXECUTAR PRIMEIRO)
-- =====================================================

-- SEÇÃO 1: SCHEMA - Adicionar tenant_id onde necessário
-- (Executar apenas se tenant_id estiver ausente)
/*
ALTER TABLE public.evento ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.evento_banda ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.banda ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.banda_membro ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.financeiro ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.unidade ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
*/

-- SEÇÃO 2: RLS - Habilitar Row Level Security
-- (Executar apenas se RLS estiver desabilitado)
/*
ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_banda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banda_membro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidade ENABLE ROW LEVEL SECURITY;
*/

-- SEÇÃO 2: RLS - Políticas básicas de tenant
-- (Executar apenas se políticas estiverem ausentes ou inadequadas)
/*
-- Política para evento
DROP POLICY IF EXISTS evento_tenant_policy ON public.evento;
CREATE POLICY evento_tenant_policy ON public.evento
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Política para evento_banda
DROP POLICY IF EXISTS evento_banda_tenant_policy ON public.evento_banda;
CREATE POLICY evento_banda_tenant_policy ON public.evento_banda
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Política para banda
DROP POLICY IF EXISTS banda_tenant_policy ON public.banda;
CREATE POLICY banda_tenant_policy ON public.banda
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Política para banda_membro
DROP POLICY IF EXISTS banda_membro_tenant_policy ON public.banda_membro;
CREATE POLICY banda_membro_tenant_policy ON public.banda_membro
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Política para profiles
DROP POLICY IF EXISTS profiles_tenant_policy ON public.profiles;
CREATE POLICY profiles_tenant_policy ON public.profiles
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR id = auth.uid())
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR id = auth.uid());
*/

-- =====================================================
-- PATCHES IMPORTANTES (PRIORIDADE 2)
-- =====================================================

-- SEÇÃO 1: SCHEMA - Primary Keys (se ausentes)
-- (Executar apenas se PK estiver ausente)
/*
ALTER TABLE public.evento ADD CONSTRAINT evento_pkey PRIMARY KEY (id) IF NOT EXISTS;
ALTER TABLE public.evento_banda ADD CONSTRAINT evento_banda_pkey PRIMARY KEY (id) IF NOT EXISTS;
ALTER TABLE public.banda ADD CONSTRAINT banda_pkey PRIMARY KEY (id) IF NOT EXISTS;
ALTER TABLE public.banda_membro ADD CONSTRAINT banda_membro_pkey PRIMARY KEY (id) IF NOT EXISTS;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id) IF NOT EXISTS;
*/

-- SEÇÃO 1: SCHEMA - Foreign Keys com ON DELETE adequado
-- (Executar apenas se FK estiver ausente ou inadequada)
/*
-- FK evento_banda -> evento
ALTER TABLE public.evento_banda DROP CONSTRAINT IF EXISTS fk_evento_banda_evento;
ALTER TABLE public.evento_banda ADD CONSTRAINT fk_evento_banda_evento 
  FOREIGN KEY (evento_id) REFERENCES public.evento(id) ON DELETE CASCADE;

-- FK evento_banda -> banda
ALTER TABLE public.evento_banda DROP CONSTRAINT IF EXISTS fk_evento_banda_banda;
ALTER TABLE public.evento_banda ADD CONSTRAINT fk_evento_banda_banda 
  FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- FK banda_membro -> banda
ALTER TABLE public.banda_membro DROP CONSTRAINT IF EXISTS fk_banda_membro_banda;
ALTER TABLE public.banda_membro ADD CONSTRAINT fk_banda_membro_banda 
  FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- FK banda_membro -> profiles
ALTER TABLE public.banda_membro DROP CONSTRAINT IF EXISTS fk_banda_membro_profile;
ALTER TABLE public.banda_membro ADD CONSTRAINT fk_banda_membro_profile 
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
*/

-- SEÇÃO 1: SCHEMA - UNIQUE constraints para tabelas N:N
-- (Executar apenas se UNIQUE estiver ausente)
/*
ALTER TABLE public.evento_banda ADD CONSTRAINT unique_evento_banda UNIQUE(evento_id, banda_id) IF NOT EXISTS;
ALTER TABLE public.banda_membro ADD CONSTRAINT unique_banda_membro UNIQUE(banda_id, profile_id) IF NOT EXISTS;
*/

-- SEÇÃO 4: INTEGRIDADE - Limpeza de orfãos
-- (Executar apenas se orfãos forem encontrados)
/*
-- Limpar orfãos em evento_banda
DELETE FROM public.evento_banda 
WHERE NOT EXISTS (SELECT 1 FROM public.evento WHERE id = evento_banda.evento_id);

DELETE FROM public.evento_banda 
WHERE NOT EXISTS (SELECT 1 FROM public.banda WHERE id = evento_banda.banda_id);

-- Limpar orfãos em banda_membro
DELETE FROM public.banda_membro 
WHERE NOT EXISTS (SELECT 1 FROM public.banda WHERE id = banda_membro.banda_id);

DELETE FROM public.banda_membro 
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = banda_membro.profile_id);
*/

-- SEÇÃO 6: TIMEZONE - Conversão para timestamptz
-- (Executar apenas se campos estiverem como timestamp sem timezone)
/*
ALTER TABLE public.evento ALTER COLUMN inicio TYPE timestamptz USING inicio AT TIME ZONE 'UTC';
ALTER TABLE public.evento ALTER COLUMN fim TYPE timestamptz USING fim AT TIME ZONE 'UTC';
ALTER TABLE public.evento ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.evento ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
*/

-- =====================================================
-- PATCHES DE PERFORMANCE (PRIORIDADE 3)
-- =====================================================

-- SEÇÃO 7: ÍNDICES - Índices críticos para performance
-- (Executar sempre, IF NOT EXISTS previne duplicação)
/*
-- Índices para evento
CREATE INDEX IF NOT EXISTS idx_evento_tenant_inicio ON public.evento(tenant_id, inicio DESC);
CREATE INDEX IF NOT EXISTS idx_evento_lookup ON public.evento(id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_evento_tenant ON public.evento(tenant_id);

-- Índices para evento_banda
CREATE INDEX IF NOT EXISTS idx_evento_banda_evento ON public.evento_banda(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_banda_banda ON public.evento_banda(banda_id);
CREATE INDEX IF NOT EXISTS idx_evento_banda_tenant ON public.evento_banda(tenant_id);

-- Índices para banda
CREATE INDEX IF NOT EXISTS idx_banda_tenant ON public.banda(tenant_id);
CREATE INDEX IF NOT EXISTS idx_banda_nome ON public.banda(nome);

-- Índices para banda_membro
CREATE INDEX IF NOT EXISTS idx_banda_membro_banda ON public.banda_membro(banda_id);
CREATE INDEX IF NOT EXISTS idx_banda_membro_profile ON public.banda_membro(profile_id);
CREATE INDEX IF NOT EXISTS idx_banda_membro_tenant ON public.banda_membro(tenant_id);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);

-- Índices para financeiro
CREATE INDEX IF NOT EXISTS idx_financeiro_tenant ON public.financeiro(tenant_id);

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON public.transactions(tenant_id);

-- Índices para unidade
CREATE INDEX IF NOT EXISTS idx_unidade_tenant ON public.unidade(tenant_id);
*/

-- =====================================================
-- PATCHES DE FUNÇÕES (PRIORIDADE 4)
-- =====================================================

-- SEÇÃO 3: RPCs - Função get_evento_full
-- (Executar apenas se função estiver ausente ou com contrato incorreto)
/*
CREATE OR REPLACE FUNCTION public.get_evento_full(p_evento_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    evento_data json;
    bandas_data json;
BEGIN
    -- Verificar se evento existe e pertence ao tenant do usuário
    SELECT to_json(e.*) INTO evento_data
    FROM public.evento e
    WHERE e.id = p_evento_id
    AND e.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid());
    
    IF evento_data IS NULL THEN
        RETURN json_build_object('error', 'Evento não encontrado ou sem permissão');
    END IF;
    
    -- Buscar bandas do evento
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', b.id,
            'nome', b.nome,
            'genero', b.genero
        )
    ), '[]'::json) INTO bandas_data
    FROM public.evento_banda eb
    JOIN public.banda b ON b.id = eb.banda_id
    WHERE eb.evento_id = p_evento_id
    AND eb.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid());
    
    -- Retornar evento com bandas
    RETURN json_build_object(
        'id', (evento_data->>'id')::uuid,
        'titulo', evento_data->>'titulo',
        'tipo', evento_data->>'tipo',
        'inicio', (evento_data->>'inicio')::timestamptz,
        'fim', (evento_data->>'fim')::timestamptz,
        'local', evento_data->>'local',
        'endereco', evento_data->>'endereco',
        'orcamento', (evento_data->>'orcamento')::numeric,
        'observacoes', evento_data->>'observacoes', -- ou 'descricao' dependendo do campo real
        'bandas', bandas_data
    );
END;
$$;
*/

-- SEÇÃO 3: RPCs - Função update_evento_full
-- (Executar apenas se função estiver ausente ou com contrato incorreto)
/*
CREATE OR REPLACE FUNCTION public.update_evento_full(
    p_evento_id uuid,
    p_titulo text,
    p_tipo text,
    p_inicio timestamptz,
    p_local text,
    p_fim timestamptz DEFAULT NULL,
    p_endereco text DEFAULT NULL,
    p_orcamento numeric DEFAULT NULL,
    p_observacoes text DEFAULT NULL, -- ou p_descricao dependendo do campo real
    p_banda_ids uuid[] DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    user_tenant_id uuid;
    evento_tenant_id uuid;
BEGIN
    -- Obter tenant_id do usuário
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF user_tenant_id IS NULL THEN
        RETURN json_build_object('error', 'Usuário não encontrado');
    END IF;
    
    -- Verificar se evento existe e pertence ao tenant
    SELECT tenant_id INTO evento_tenant_id
    FROM public.evento
    WHERE id = p_evento_id;
    
    IF evento_tenant_id IS NULL THEN
        RETURN json_build_object('error', 'Evento não encontrado');
    END IF;
    
    IF evento_tenant_id != user_tenant_id THEN
        RETURN json_build_object('error', 'Sem permissão para editar este evento');
    END IF;
    
    -- Atualizar evento
    UPDATE public.evento SET
        titulo = p_titulo,
        tipo = p_tipo,
        inicio = p_inicio,
        fim = p_fim,
        local = p_local,
        endereco = p_endereco,
        orcamento = p_orcamento,
        observacoes = p_observacoes, -- ou descricao dependendo do campo real
        updated_at = NOW()
    WHERE id = p_evento_id;
    
    -- Remover associações antigas de bandas
    DELETE FROM public.evento_banda
    WHERE evento_id = p_evento_id;
    
    -- Adicionar novas associações de bandas
    IF array_length(p_banda_ids, 1) > 0 THEN
        INSERT INTO public.evento_banda (evento_id, banda_id, tenant_id)
        SELECT p_evento_id, unnest(p_banda_ids), user_tenant_id
        WHERE EXISTS (
            SELECT 1 FROM public.banda 
            WHERE id = ANY(p_banda_ids) 
            AND tenant_id = user_tenant_id
        );
    END IF;
    
    RETURN json_build_object('success', true, 'evento_id', p_evento_id);
END;
$$;
*/

-- =====================================================
-- PATCHES DE MELHORIAS (PRIORIDADE 5)
-- =====================================================

-- SEÇÃO 5: CONSISTÊNCIA - Correção de inconsistências de tenant
-- (Executar apenas se inconsistências forem encontradas)
/*
-- Corrigir tenant_id em evento_banda baseado no evento
UPDATE public.evento_banda 
SET tenant_id = e.tenant_id 
FROM public.evento e 
WHERE e.id = evento_banda.evento_id 
AND evento_banda.tenant_id != e.tenant_id;

-- Corrigir tenant_id em banda_membro baseado na banda
UPDATE public.banda_membro 
SET tenant_id = b.tenant_id 
FROM public.banda b 
WHERE b.id = banda_membro.banda_id 
AND banda_membro.tenant_id != b.tenant_id;
*/

-- SEÇÃO 8: CONTRATO - Padronização de campos
-- (Executar apenas se necessário padronizar observacoes/descricao)
/*
-- Opção 1: Renomear observacoes para descricao
-- ALTER TABLE public.evento RENAME COLUMN observacoes TO descricao;

-- Opção 2: Renomear descricao para observacoes
-- ALTER TABLE public.evento RENAME COLUMN descricao TO observacoes;

-- Opção 3: Manter ambos e criar view unificada
-- CREATE OR REPLACE VIEW public.vw_evento_unified AS
-- SELECT 
--     id, titulo, tipo, inicio, fim, local, endereco, orcamento,
--     COALESCE(descricao, observacoes) as descricao,
--     tenant_id, created_at, updated_at
-- FROM public.evento;
*/

-- =====================================================
-- VERIFICAÇÕES PÓS-APLICAÇÃO
-- =====================================================

-- Executar estas queries após aplicar os patches para verificar
/*
-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles')
ORDER BY tablename;

-- Verificar tenant_id em todas as tabelas
SELECT table_name, column_name, is_nullable, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'tenant_id'
AND table_name IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles')
ORDER BY table_name;

-- Verificar orfãos após limpeza
SELECT 'evento_banda->evento' as check_type, COUNT(*) as orfaos
FROM public.evento_banda eb
WHERE NOT EXISTS (SELECT 1 FROM public.evento e WHERE e.id = eb.evento_id)
UNION ALL
SELECT 'evento_banda->banda', COUNT(*)
FROM public.evento_banda eb
WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id = eb.banda_id)
UNION ALL
SELECT 'banda_membro->banda', COUNT(*)
FROM public.banda_membro bm
WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id = bm.banda_id)
UNION ALL
SELECT 'banda_membro->profiles', COUNT(*)
FROM public.banda_membro bm
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = bm.profile_id);

-- Verificar índices críticos criados
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles')
AND (indexname LIKE '%tenant%' OR indexname LIKE '%lookup%')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles')
ORDER BY tablename, policyname;
*/

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
/*
ANTES DE EXECUTAR:
1. Fazer backup completo do banco
2. Testar em ambiente de desenvolvimento
3. Verificar se há dados em produção que podem ser afetados
4. Executar em horário de menor movimento
5. Ter plano de rollback preparado

ORDEM DE EXECUÇÃO:
1. Patches Críticos (RLS, tenant_id)
2. Patches Importantes (FK, PK, UNIQUE)
3. Patches de Performance (índices)
4. Patches de Funções (RPCs)
5. Patches de Melhorias (consistência, padronização)

APÓS EXECUÇÃO:
1. Executar queries de verificação
2. Testar funcionalidades principais
3. Monitorar performance
4. Executar nova auditoria para confirmar correções
*/