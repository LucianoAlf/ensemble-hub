# Solução: Erro "User must have a tenant_id" no get_dashboard_metrics

## Diagnóstico do Problema

O erro ocorre porque:
1. A função `get_dashboard_metrics` busca o `tenant_id` na tabela `profiles`
2. O usuário atual não tem um registro na tabela `profiles` OU
3. O registro existe mas o campo `tenant_id` está NULL

## Como Resolver

### Passo 1: Executar Diagnóstico

Execute o arquivo `debug_tenant_id_issue.sql` no SQL Editor para identificar a causa exata:

```sql
-- Verificar se o usuário está autenticado
SELECT auth.uid() as current_user_id;

-- Verificar se existe perfil para o usuário
SELECT id, tenant_id, created_at
FROM public.profiles 
WHERE id = auth.uid();
```

### Passo 2: Soluções Baseadas no Diagnóstico

#### Cenário A: Usuário não tem perfil na tabela profiles

**Solução**: Criar perfil manualmente

```sql
INSERT INTO public.profiles (id, tenant_id, display_name)
VALUES (
    auth.uid(),
    gen_random_uuid(), -- Gera um novo tenant_id
    (SELECT email FROM auth.users WHERE id = auth.uid())
)
ON CONFLICT (id) DO NOTHING;
```

#### Cenário B: Perfil existe mas tenant_id é NULL

**Solução**: Atualizar o tenant_id

```sql
UPDATE public.profiles 
SET tenant_id = gen_random_uuid()
WHERE id = auth.uid() AND tenant_id IS NULL;
```

#### Cenário C: Problema de autenticação

**Solução**: Fazer logout/login novamente

### Passo 3: Verificar a Correção

Após aplicar a solução, teste:

```sql
-- Verificar se o perfil foi criado/atualizado
SELECT id, tenant_id, display_name 
FROM public.profiles 
WHERE id = auth.uid();

-- Testar a função dashboard
SELECT public.get_dashboard_metrics();
```

## Prevenção Futura

### Verificar se o Trigger Automático Está Funcionando

O sistema deveria criar perfis automaticamente via trigger `on_auth_user_created`. Verifique:

```sql
-- Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar se a função handle_new_user existe
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

### Solução Robusta para Novos Usuários

Se o trigger não estiver funcionando, você pode:

1. **Recriar o trigger** (execute a migração novamente)
2. **Criar perfis em lote** para usuários existentes:

```sql
INSERT INTO public.profiles (id, tenant_id, display_name)
SELECT 
    u.id,
    gen_random_uuid(),
    u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

## Teste Final

Após aplicar a correção:

1. Recarregue a página do Dashboard
2. Verifique se as métricas aparecem corretamente
3. Confirme que não há mais erros no console

## Arquivos Relacionados

- `debug_tenant_id_issue.sql` - Diagnóstico completo
- `supabase/migrations/20250811170652_b4dc7e66-76a0-4424-996e-102a58a77a88.sql` - Criação da tabela profiles
- `supabase/migrations/20250127000003_fix_dashboard_metrics_final.sql` - Função get_dashboard_metrics