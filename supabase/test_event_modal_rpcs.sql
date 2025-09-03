-- =====================================================
-- CASOS DE TESTE PARA RPCs DO MODAL DE EVENTOS
-- =====================================================
-- Este arquivo contém testes abrangentes para validar:
-- 1. Segurança multi-tenant
-- 2. Funcionalidade correta dos RPCs
-- 3. Tratamento de erros
-- 4. Integridade de dados

-- =====================================================
-- SETUP: Dados de teste
-- =====================================================

-- Criar dados de teste (executar como superuser ou admin)
-- NOTA: Substitua os UUIDs pelos valores reais do seu ambiente

/*
-- Exemplo de setup de dados de teste:
INSERT INTO public.profiles (id, tenant_id, nome, email) VALUES 
('user1-uuid', 'tenant1-uuid', 'Usuário Tenant 1', 'user1@test.com'),
('user2-uuid', 'tenant2-uuid', 'Usuário Tenant 2', 'user2@test.com');

INSERT INTO public.banda (id, tenant_id, nome) VALUES 
('banda1-tenant1-uuid', 'tenant1-uuid', 'Banda A'),
('banda2-tenant1-uuid', 'tenant1-uuid', 'Banda B'),
('banda1-tenant2-uuid', 'tenant2-uuid', 'Banda C');

INSERT INTO public.evento (id, tenant_id, titulo, tipo, inicio) VALUES 
('evento1-tenant1-uuid', 'tenant1-uuid', 'Show da Banda A', 'show', '2024-03-15 20:00:00+00'),
('evento2-tenant1-uuid', 'tenant1-uuid', 'Ensaio Geral', 'ensaio', '2024-03-10 14:00:00+00'),
('evento1-tenant2-uuid', 'tenant2-uuid', 'Show da Banda C', 'show', '2024-03-20 21:00:00+00');

INSERT INTO public.evento_banda (evento_id, banda_id) VALUES 
('evento1-tenant1-uuid', 'banda1-tenant1-uuid'),
('evento2-tenant1-uuid', 'banda1-tenant1-uuid'),
('evento2-tenant1-uuid', 'banda2-tenant1-uuid');
*/

-- =====================================================
-- TESTE 1: LEITURA PERMITIDA (MESMO TENANT)
-- =====================================================

-- Conectar como user1 (tenant1) e ler evento do tenant1
-- Resultado esperado: JSON com dados completos do evento e bandas

/*
SET ROLE 'user1';  -- Simular autenticação como user1
SELECT 'TESTE 1: Leitura permitida' as teste;
SELECT public.get_evento_full('evento1-tenant1-uuid');
*/

-- Verificações esperadas:
-- ✅ Retorna JSON com todos os campos do evento
-- ✅ Array 'bandas' contém banda(s) associada(s)
-- ✅ Não há erro de permissão

-- =====================================================
-- TESTE 2: LEITURA NEGADA (TENANT DIFERENTE)
-- =====================================================

-- Conectar como user1 (tenant1) e tentar ler evento do tenant2
-- Resultado esperado: ERRO "Acesso negado: evento pertence a outro tenant"

/*
SET ROLE 'user1';  -- Simular autenticação como user1
SELECT 'TESTE 2: Leitura negada (cross-tenant)' as teste;
SELECT public.get_evento_full('evento1-tenant2-uuid');  -- Deve falhar
*/

-- Verificações esperadas:
-- ❌ Erro: "Acesso negado: evento pertence a outro tenant"
-- ❌ Nenhum dado retornado

-- =====================================================
-- TESTE 3: EVENTO INEXISTENTE
-- =====================================================

-- Tentar ler evento que não existe
-- Resultado esperado: ERRO "Evento não encontrado"

/*
SET ROLE 'user1';
SELECT 'TESTE 3: Evento inexistente' as teste;
SELECT public.get_evento_full('00000000-0000-0000-0000-000000000000');  -- Deve falhar
*/

-- Verificações esperadas:
-- ❌ Erro: "Evento não encontrado"

-- =====================================================
-- TESTE 4: EVENTO SEM BANDAS
-- =====================================================

-- Ler evento que não tem bandas associadas
-- Resultado esperado: JSON com array 'bandas' vazio

/*
-- Primeiro, criar evento sem bandas
INSERT INTO public.evento (id, tenant_id, titulo, tipo, inicio) VALUES 
('evento-sem-bandas-uuid', 'tenant1-uuid', 'Evento Solo', 'aula', '2024-03-25 10:00:00+00');

SET ROLE 'user1';
SELECT 'TESTE 4: Evento sem bandas' as teste;
SELECT public.get_evento_full('evento-sem-bandas-uuid');
*/

-- Verificações esperadas:
-- ✅ Retorna JSON com dados do evento
-- ✅ Campo 'bandas' é array vazio: []

-- =====================================================
-- TESTE 5: ATUALIZAÇÃO PERMITIDA (MESMO TENANT)
-- =====================================================

-- Atualizar evento do mesmo tenant com novas bandas
-- Resultado esperado: Sucesso e retorno dos dados atualizados

/*
SET ROLE 'user1';
SELECT 'TESTE 5: Atualização permitida' as teste;
SELECT public.update_evento_full(
  'evento1-tenant1-uuid',
  'Show Atualizado da Banda A',
  'show',
  '2024-03-15 21:00:00+00'::timestamp with time zone,
  '2024-03-16 00:00:00+00'::timestamp with time zone,
  'Novo Local',
  'Novo Endereço, 123',
  2500.00,
  'Descrição atualizada do evento',
  ARRAY['banda1-tenant1-uuid', 'banda2-tenant1-uuid']::UUID[]
);
*/

-- Verificações esperadas:
-- ✅ Retorna JSON com dados atualizados
-- ✅ Campos do evento foram atualizados
-- ✅ Array 'bandas' contém as duas bandas especificadas
-- ✅ Relacionamentos antigos foram removidos/atualizados

-- =====================================================
-- TESTE 6: ATUALIZAÇÃO NEGADA (TENANT DIFERENTE)
-- =====================================================

-- Tentar atualizar evento de outro tenant
-- Resultado esperado: ERRO "Acesso negado: evento pertence a outro tenant"

/*
SET ROLE 'user1';  -- user1 (tenant1)
SELECT 'TESTE 6: Atualização negada (cross-tenant)' as teste;
SELECT public.update_evento_full(
  'evento1-tenant2-uuid',  -- Evento do tenant2
  'Tentativa de Hack',
  'show',
  '2024-03-20 21:00:00+00'::timestamp with time zone,
  NULL,
  'Local Hackeado',
  NULL,
  NULL,
  NULL,
  '{}'
);  -- Deve falhar
*/

-- Verificações esperadas:
-- ❌ Erro: "Acesso negado: evento pertence a outro tenant"
-- ❌ Nenhuma alteração realizada

-- =====================================================
-- TESTE 7: BANDA DE OUTRO TENANT
-- =====================================================

-- Tentar associar banda de outro tenant ao evento
-- Resultado esperado: ERRO "Acesso negado: banda X pertence a outro tenant"

/*
SET ROLE 'user1';  -- user1 (tenant1)
SELECT 'TESTE 7: Banda de outro tenant' as teste;
SELECT public.update_evento_full(
  'evento1-tenant1-uuid',  -- Evento do tenant1
  'Evento com Banda Inválida',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local',
  NULL,
  NULL,
  NULL,
  ARRAY['banda1-tenant2-uuid']::UUID[]  -- Banda do tenant2 - deve falhar
);
*/

-- Verificações esperadas:
-- ❌ Erro: "Acesso negado: banda X pertence a outro tenant"
-- ❌ Nenhuma alteração realizada

-- =====================================================
-- TESTE 8: BANDA INEXISTENTE
-- =====================================================

-- Tentar associar banda que não existe
-- Resultado esperado: ERRO "Banda com ID X não encontrada"

/*
SET ROLE 'user1';
SELECT 'TESTE 8: Banda inexistente' as teste;
SELECT public.update_evento_full(
  'evento1-tenant1-uuid',
  'Evento com Banda Inexistente',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local',
  NULL,
  NULL,
  NULL,
  ARRAY['00000000-0000-0000-0000-000000000000']::UUID[]  -- UUID inexistente
);
*/

-- Verificações esperadas:
-- ❌ Erro: "Banda com ID X não encontrada"
-- ❌ Nenhuma alteração realizada

-- =====================================================
-- TESTE 9: REMOVER TODAS AS BANDAS
-- =====================================================

-- Atualizar evento removendo todas as bandas (array vazio)
-- Resultado esperado: Sucesso, evento sem bandas

/*
SET ROLE 'user1';
SELECT 'TESTE 9: Remover todas as bandas' as teste;
SELECT public.update_evento_full(
  'evento2-tenant1-uuid',
  'Ensaio Individual',
  'ensaio',
  '2024-03-10 14:00:00+00'::timestamp with time zone,
  '2024-03-10 16:00:00+00'::timestamp with time zone,
  'Estúdio',
  NULL,
  NULL,
  'Ensaio sem banda',
  '{}'::UUID[]  -- Array vazio
);
*/

-- Verificações esperadas:
-- ✅ Retorna JSON com dados atualizados
-- ✅ Array 'bandas' está vazio: []
-- ✅ Todos os relacionamentos em evento_banda foram removidos

-- =====================================================
-- TESTE 10: USUÁRIO SEM TENANT_ID
-- =====================================================

-- Simular usuário sem tenant_id válido
-- Resultado esperado: ERRO "Usuário deve ter um tenant_id válido"

/*
-- Criar usuário sem tenant_id
INSERT INTO public.profiles (id, tenant_id, nome, email) VALUES 
('user-sem-tenant-uuid', NULL, 'Usuário Sem Tenant', 'sem-tenant@test.com');

SET ROLE 'user-sem-tenant';
SELECT 'TESTE 10: Usuário sem tenant_id' as teste;
SELECT public.get_evento_full('evento1-tenant1-uuid');  -- Deve falhar
*/

-- Verificações esperadas:
-- ❌ Erro: "Usuário deve ter um tenant_id válido"

-- =====================================================
-- TESTE 11: VERIFICAÇÃO DE INTEGRIDADE TRANSACIONAL
-- =====================================================

-- Verificar que em caso de erro, nenhuma alteração é persistida
-- Resultado esperado: Rollback automático em caso de erro

/*
SET ROLE 'user1';

-- Estado inicial
SELECT 'ANTES - Estado inicial:' as momento;
SELECT public.get_evento_full('evento1-tenant1-uuid');

-- Tentar atualização que deve falhar (banda inexistente)
SELECT 'TESTE 11: Verificação transacional' as teste;
SELECT public.update_evento_full(
  'evento1-tenant1-uuid',
  'Título que não deve ser salvo',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local que não deve ser salvo',
  NULL,
  NULL,
  NULL,
  ARRAY['banda1-tenant1-uuid', '00000000-0000-0000-0000-000000000000']::UUID[]  -- Uma válida, uma inválida
);

-- Estado após erro
SELECT 'DEPOIS - Estado após erro:' as momento;
SELECT public.get_evento_full('evento1-tenant1-uuid');
*/

-- Verificações esperadas:
-- ❌ Erro na atualização
-- ✅ Estado do evento permanece inalterado (rollback)
-- ✅ Nenhum relacionamento foi alterado

-- =====================================================
-- TESTE 12: PERFORMANCE E ÍNDICES
-- =====================================================

-- Verificar se as consultas estão usando índices adequadamente
-- Execute com EXPLAIN ANALYZE para verificar performance

/*
SET ROLE 'user1';
EXPLAIN ANALYZE SELECT public.get_evento_full('evento1-tenant1-uuid');

EXPLAIN ANALYZE SELECT public.update_evento_full(
  'evento1-tenant1-uuid',
  'Teste Performance',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local',
  NULL,
  NULL,
  NULL,
  ARRAY['banda1-tenant1-uuid']::UUID[]
);
*/

-- Verificações esperadas:
-- ✅ Uso de índices em lookups por ID
-- ✅ Tempo de execução aceitável (< 100ms para operações simples)
-- ✅ Sem sequential scans em tabelas grandes

-- =====================================================
-- LIMPEZA DOS DADOS DE TESTE
-- =====================================================

/*
-- Executar após os testes para limpar dados de teste
DELETE FROM public.evento_banda WHERE evento_id IN (
  'evento1-tenant1-uuid', 'evento2-tenant1-uuid', 'evento1-tenant2-uuid', 'evento-sem-bandas-uuid'
);

DELETE FROM public.evento WHERE id IN (
  'evento1-tenant1-uuid', 'evento2-tenant1-uuid', 'evento1-tenant2-uuid', 'evento-sem-bandas-uuid'
);

DELETE FROM public.banda WHERE id IN (
  'banda1-tenant1-uuid', 'banda2-tenant1-uuid', 'banda1-tenant2-uuid'
);

DELETE FROM public.profiles WHERE id IN (
  'user1-uuid', 'user2-uuid', 'user-sem-tenant-uuid'
);
*/

-- =====================================================
-- RESUMO DOS TESTES
-- =====================================================

/*
TESTE 1  ✅ Leitura permitida (mesmo tenant)
TESTE 2  ❌ Leitura negada (tenant diferente)
TESTE 3  ❌ Evento inexistente
TESTE 4  ✅ Evento sem bandas
TESTE 5  ✅ Atualização permitida (mesmo tenant)
TESTE 6  ❌ Atualização negada (tenant diferente)
TESTE 7  ❌ Banda de outro tenant
TESTE 8  ❌ Banda inexistente
TESTE 9  ✅ Remover todas as bandas
TESTE 10 ❌ Usuário sem tenant_id
TESTE 11 ✅ Integridade transacional
TESTE 12 ✅ Performance e índices

Legenda:
✅ = Deve funcionar sem erro
❌ = Deve retornar erro específico
*/