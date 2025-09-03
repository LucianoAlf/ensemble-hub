-- RPCs para Modal de Visualização/Edição de Eventos
-- Criado para suportar funcionalidade de modal com validação multi-tenant rigorosa
-- Todas as funções usam SECURITY INVOKER para manter RLS ativo

-- =====================================================
-- A) RPC DE LEITURA: get_evento_full
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_evento_full(p_evento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER  -- Mantém RLS ativo
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
    'inicio', e.inicio,  -- TIMESTAMP WITH TIME ZONE completo
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
        AND b.tenant_id = v_tenant_id  -- Validação extra de segurança
      ),
      '[]'::json  -- Array vazio se não houver bandas
    )
  ) INTO v_result
  FROM public.evento e
  WHERE e.id = p_evento_id;
  
  RETURN v_result;
END;
$function$;

-- =====================================================
-- B) RPC DE ATUALIZAÇÃO: update_evento_full
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_evento_full(
  p_evento_id UUID,
  p_titulo TEXT,
  p_tipo TEXT,
  p_inicio TIMESTAMP WITH TIME ZONE,  -- Usando o tipo real da tabela
  p_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_local TEXT,
  p_endereco TEXT DEFAULT NULL,
  p_orcamento NUMERIC DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_banda_ids UUID[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER  -- Mantém RLS ativo
SET search_path = 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_evento_tenant_id UUID;
  v_banda_id UUID;
  v_banda_tenant_id UUID;
  v_result JSON;
BEGIN
  -- 1. Obter tenant_id do usuário autenticado
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário deve ter um tenant_id válido';
  END IF;
  
  -- 2. Verificar se o evento existe e validar tenant
  SELECT tenant_id INTO v_evento_tenant_id
  FROM public.evento
  WHERE id = p_evento_id;
  
  IF v_evento_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;
  
  IF v_evento_tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Acesso negado: evento pertence a outro tenant';
  END IF;
  
  -- 3. Validar que todas as bandas pertencem ao mesmo tenant
  IF p_banda_ids IS NOT NULL AND array_length(p_banda_ids, 1) > 0 THEN
    FOREACH v_banda_id IN ARRAY p_banda_ids
    LOOP
      SELECT tenant_id INTO v_banda_tenant_id
      FROM public.banda
      WHERE id = v_banda_id;
      
      IF v_banda_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Banda com ID % não encontrada', v_banda_id;
      END IF;
      
      IF v_banda_tenant_id != v_tenant_id THEN
        RAISE EXCEPTION 'Acesso negado: banda % pertence a outro tenant', v_banda_id;
      END IF;
    END LOOP;
  END IF;
  
  -- 4. TRANSAÇÃO: Atualizar evento e sincronizar relacionamentos
  BEGIN
    -- 4.1. Atualizar campos do evento
    UPDATE public.evento
    SET 
      titulo = p_titulo,
      tipo = p_tipo,
      inicio = p_inicio,
      fim = p_fim,
      local = p_local,
      endereco = p_endereco,
      orcamento = p_orcamento,
      descricao = p_observacoes,
      updated_at = now()
    WHERE id = p_evento_id;
    
    -- 4.2. Sincronizar relacionamentos N:N em evento_banda
    -- Remover vínculos que não estão em p_banda_ids
    DELETE FROM public.evento_banda
    WHERE evento_id = p_evento_id
    AND (
      p_banda_ids IS NULL 
      OR array_length(p_banda_ids, 1) = 0 
      OR banda_id != ALL(p_banda_ids)
    );
    
    -- Inserir vínculos ausentes (ON CONFLICT para evitar duplicatas)
    IF p_banda_ids IS NOT NULL AND array_length(p_banda_ids, 1) > 0 THEN
      FOREACH v_banda_id IN ARRAY p_banda_ids
      LOOP
        INSERT INTO public.evento_banda (evento_id, banda_id)
        VALUES (p_evento_id, v_banda_id)
        ON CONFLICT (evento_id, banda_id) DO NOTHING;
      END LOOP;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Re-lançar a exceção para rollback automático
      RAISE;
  END;
  
  -- 5. Retornar o evento atualizado no mesmo formato do get_evento_full
  SELECT public.get_evento_full(p_evento_id) INTO v_result;
  
  RETURN v_result;
END;
$function$;

-- =====================================================
-- C) COMENTÁRIOS SOBRE RLS E SEGURANÇA
-- =====================================================

-- OBSERVAÇÕES DE SEGURANÇA:
-- 1. Ambas as funções usam SECURITY INVOKER para manter RLS ativo
-- 2. Validação explícita de tenant_id em todas as operações
-- 3. Verificação de permissões antes de qualquer operação
-- 4. Transação atômica na atualização para garantir consistência
-- 5. Políticas RLS existentes nas tabelas continuam ativas:
--    - evento: SELECT/UPDATE apenas dentro do tenant
--    - evento_banda: SELECT/INSERT/DELETE apenas dentro do tenant
--    - banda: SELECT apenas dentro do tenant

-- =====================================================
-- D) ÍNDICES SUGERIDOS (se não existirem)
-- =====================================================

-- Verificar se estes índices existem para otimização:
-- CREATE INDEX IF NOT EXISTS idx_evento_id_tenant_id ON public.evento (id, tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_evento_banda_evento_id ON public.evento_banda (evento_id);
-- CREATE INDEX IF NOT EXISTS idx_evento_banda_banda_id ON public.evento_banda (banda_id);
-- CREATE INDEX IF NOT EXISTS idx_banda_tenant_id ON public.banda (tenant_id);

-- =====================================================
-- E) CASOS DE TESTE SQL
-- =====================================================

/*
-- TESTE 1: Leitura permitida (mesmo tenant)
-- Substitua os UUIDs pelos valores reais do seu ambiente
SELECT public.get_evento_full('evento-uuid-aqui');

-- TESTE 2: Leitura negada (tenant diferente)
-- Este teste deve falhar com erro de permissão
-- Simular mudando temporariamente o tenant_id do evento

-- TESTE 3: Atualização permitida (mesmo tenant)
SELECT public.update_evento_full(
  'evento-uuid-aqui',
  'Evento Atualizado',
  'show',
  '2024-02-15 20:00:00+00'::timestamp with time zone,
  '2024-02-15 23:00:00+00'::timestamp with time zone,
  'Local Atualizado',
  'Endereço Atualizado',
  1500.00,
  'Descrição atualizada',
  ARRAY['banda-uuid-1', 'banda-uuid-2']::UUID[]
);

-- TESTE 4: Atualização sem bandas (array vazio)
SELECT public.update_evento_full(
  'evento-uuid-aqui',
  'Evento Sem Bandas',
  'ensaio',
  '2024-02-20 14:00:00+00'::timestamp with time zone,
  NULL,
  'Estúdio',
  NULL,
  NULL,
  'Ensaio individual',
  '{}'
);

-- TESTE 5: Evento inexistente
-- Deve retornar erro "Evento não encontrado"
SELECT public.get_evento_full('00000000-0000-0000-0000-000000000000');

-- TESTE 6: Banda de outro tenant
-- Deve retornar erro "banda pertence a outro tenant"
-- (Simular inserindo banda com tenant_id diferente)
*/