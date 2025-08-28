-- Inserir dados de teste para debugging

-- Primeiro, vamos verificar se já existe um usuário na tabela auth.users
-- Se não existir, vamos criar um usuário de teste

-- Inserir um tenant de teste
INSERT INTO tenant (id, nome, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Tenant de Teste',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir um usuário de teste na tabela auth.users (se não existir)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  'test-user-id-1234567890abcdef',
  'teste@exemplo.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Usuário Teste"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Inserir o profile do usuário de teste
INSERT INTO profiles (id, display_name, tenant_id, created_at, updated_at)
VALUES (
  'test-user-id-1234567890abcdef',
  'Usuário Teste',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Inserir uma banda de teste
INSERT INTO banda (id, nome, tenant_id, created_at, updated_at)
VALUES (
  'banda-teste-id-1234567890',
  'Banda de Teste',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir eventos de teste
INSERT INTO evento (id, titulo, tipo, inicio, fim, local, endereco, orcamento, descricao, status, banda_id, tenant_id, created_at, updated_at)
VALUES 
  (
    'evento-1-test-id',
    'Show de Rock',
    'evento',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
    'Casa de Shows Rock',
    'Rua das Bandas, 123',
    5000.00,
    'Show de rock com a banda de teste',
    'confirmado',
    'banda-teste-id-1234567890',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  ),
  (
    'evento-2-test-id',
    'Ensaio Geral',
    'ensaio',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '2 hours',
    'Estúdio de Ensaio',
    'Rua dos Músicos, 456',
    200.00,
    'Ensaio para preparação do show',
    'agendado',
    'banda-teste-id-1234567890',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  ),
  (
    'evento-3-test-id',
    'Aula de Música',
    'aula',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    'Escola de Música',
    'Av. da Música, 789',
    100.00,
    'Aula particular de guitarra',
    'agendado',
    NULL,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir algumas transações de teste
INSERT INTO transactions (id, description, amount, type, category, date, evento_id, tenant_id, created_at, updated_at)
VALUES 
  (
    'trans-1-test-id',
    'Pagamento do Show de Rock',
    5000.00,
    'income',
    'performance',
    NOW() + INTERVAL '7 days',
    'evento-1-test-id',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  ),
  (
    'trans-2-test-id',
    'Aluguel do Estúdio',
    -200.00,
    'expense',
    'venue',
    NOW() + INTERVAL '2 days',
    'evento-2-test-id',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir alguns pagamentos de teste
INSERT INTO payouts (id, description, amount, due_date, status, evento_id, tenant_id, created_at, updated_at)
VALUES 
  (
    'payout-1-test-id',
    'Pagamento aos Músicos - Show de Rock',
    2500.00,
    NOW() + INTERVAL '8 days',
    'pending',
    'evento-1-test-id',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  ),
  (
    'payout-2-test-id',
    'Pagamento do Professor - Aula',
    80.00,
    NOW() + INTERVAL '2 days',
    'pending',
    'evento-3-test-id',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;