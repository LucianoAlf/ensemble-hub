# Correção do Erro "null value in column id of relation profiles"

## Problema Identificado
O erro `null value in column id of relation profiles violates NOT NULL constraint` ocorre quando:
1. A tabela `profiles` tem um DEFAULT na coluna `id` gerando UUIDs aleatórios
2. Não há foreign key adequada para `auth.users(id)`
3. O trigger de criação automática de profiles não está funcionando corretamente

## Solução Implementada
Padronização da tabela `profiles` seguindo as melhores práticas da Supabase:
- `profiles.id` deve referenciar diretamente `auth.users(id)`
- Remoção do DEFAULT para evitar UUIDs aleatórios
- Trigger automático para criar profiles na criação de usuários

## Passos para Execução

### 1. Diagnóstico (OBRIGATÓRIO)
```bash
# Abra o Supabase SQL Editor ou conecte via psql
# Execute o conteúdo do arquivo: diagnostico_profiles.sql
```

**Comandos principais do diagnóstico:**
```sql
-- Estrutura da tabela
\d+ public.profiles;

-- Verificar extensões
SELECT * FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp');

-- Triggers existentes
SELECT tgname, tgtype::int, tgenabled FROM pg_trigger WHERE tgrelid='public.profiles'::regclass;

-- Políticas RLS
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='profiles';
```

### 2. Análise dos Resultados
Antes de aplicar a correção, verifique:
- [ ] Se existe DEFAULT na coluna `id`
- [ ] Se há foreign key para `auth.users`
- [ ] Se existem triggers ativos
- [ ] Quantos profiles têm `id` NULL
- [ ] Quantos usuários não têm profile

### 3. Backup (RECOMENDADO)
```sql
CREATE TABLE profiles_backup AS SELECT * FROM public.profiles;
```

### 4. Aplicar Correção
```bash
# Execute o conteúdo do arquivo: correcao_profiles.sql
# ⚠️ ATENÇÃO: Execute em ambiente de desenvolvimento primeiro!
```

### 5. Verificação Final
Após aplicar a correção, execute:
```sql
-- Verificar se não há mais profiles com id NULL
SELECT COUNT(*) FROM public.profiles WHERE id IS NULL;

-- Verificar se não há usuários sem profile
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Testar trigger criando um usuário de teste
-- (faça isso em ambiente de desenvolvimento)
```

## Arquivos Criados

1. **`diagnostico_profiles.sql`** - Comandos para análise da situação atual
2. **`correcao_profiles.sql`** - Script completo de correção
3. **`README_CORRECAO_PROFILES.md`** - Este arquivo com instruções

## Principais Mudanças na Correção

### Antes (Problemático)
```sql
-- profiles.id com DEFAULT gerando UUID aleatório
id UUID DEFAULT gen_random_uuid() PRIMARY KEY

-- Sem foreign key adequada
-- Trigger pode não estar funcionando
```

### Depois (Padrão Supabase)
```sql
-- profiles.id sem DEFAULT, referenciando auth.users
id UUID NOT NULL PRIMARY KEY
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE

-- Trigger robusto para criação automática
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Benefícios da Correção

1. **Integridade Referencial**: FK com CASCADE garante consistência
2. **Sem UUIDs Órfãos**: profiles.id sempre corresponde a um usuário real
3. **Criação Automática**: Novos usuários sempre terão profile
4. **Padrão Supabase**: Segue as melhores práticas recomendadas
5. **Tenant ID Automático**: Gerado automaticamente se não fornecido

## Próximos Passos

1. Execute o diagnóstico e analise os resultados
2. Faça backup dos dados
3. Aplique a correção em ambiente de desenvolvimento
4. Teste criação de novos usuários
5. Aplique em produção após validação

## Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Confirme que as extensões estão instaladas
3. Valide as permissões RLS
4. Teste em ambiente isolado primeiro

---

**⚠️ IMPORTANTE**: Sempre teste em ambiente de desenvolvimento antes de aplicar em produção!