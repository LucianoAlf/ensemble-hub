-- Inserir dados de teste simples nas tabelas existentes

-- Primeiro, vamos inserir um usuário de teste na tabela profiles
-- (assumindo que já existe um usuário autenticado)
INSERT INTO profiles (id, display_name, tenant_id, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Usuário Teste',
  '123e4567-e89b-12d3-a456-426614174000',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Inserir uma banda de teste
INSERT INTO banda (id, nome, descricao, created_at, updated_at)
VALUES (
  'banda-teste-001',
  'Banda Teste',
  'Uma banda para testes',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  updated_at = NOW();

-- Inserir eventos de teste
INSERT INTO evento (id, nome, tipo, data_evento, local, orcamento, banda_id, created_at, updated_at)
VALUES 
  (
    'evento-teste-001',
    'Show de Rock',
    'evento',
    '2024-01-15 20:00:00',
    'Casa de Shows XYZ',
    1500.00,
    'banda-teste-001',
    NOW(),
    NOW()
  ),
  (
    'evento-teste-002',
    'Ensaio Geral',
    'ensaio',
    '2024-01-10 19:00:00',
    'Estúdio ABC',
    200.00,
    'banda-teste-001',
    NOW(),
    NOW()
  ),
  (
    'evento-teste-003',
    'Aula de Música',
    'aula',
    '2024-01-08 14:00:00',
    'Escola de Música',
    100.00,
    'banda-teste-001',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo,
  data_evento = EXCLUDED.data_evento,
  local = EXCLUDED.local,
  orcamento = EXCLUDED.orcamento,
  updated_at = NOW();

-- Inserir transações de teste
INSERT INTO transactions (id, amount, description, type, date, created_at, updated_at)
VALUES 
  (
    'trans-teste-001',
    1500.00,
    'Pagamento Show de Rock',
    'income',
    '2024-01-15',
    NOW(),
    NOW()
  ),
  (
    'trans-teste-002',
    -200.00,
    'Aluguel Estúdio',
    'expense',
    '2024-01-10',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  date = EXCLUDED.date,
  updated_at = NOW();