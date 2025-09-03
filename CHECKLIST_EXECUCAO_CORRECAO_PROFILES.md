# Checklist de Execução - Correção Profiles

## 📋 Status da Execução

### ✅ Fase 1: Preparação (CONCLUÍDA)
- [x] Arquivo de diagnóstico criado (`diagnostico_profiles.sql`)
- [x] Arquivo de correção criado (`correcao_profiles.sql`)
- [x] Documentação completa criada (`README_CORRECAO_PROFILES.md`)

### 🔍 Fase 2: Diagnóstico (PENDENTE)
- [ ] **PASSO 1**: Executar diagnóstico no Supabase SQL Editor
  - [ ] Abrir Supabase Dashboard → SQL Editor
  - [ ] Executar conteúdo de `diagnostico_profiles.sql`
  - [ ] Documentar resultados abaixo

#### Resultados do Diagnóstico:
```sql
-- Cole aqui os resultados de cada comando:

-- 1. Estrutura da tabela profiles
-- \d+ public.profiles;
-- RESULTADO:


-- 2. Extensões instaladas
-- SELECT * FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp');
-- RESULTADO:


-- 3. Triggers existentes
-- SELECT tgname, tgtype::int, tgenabled FROM pg_trigger WHERE tgrelid='public.profiles'::regclass;
-- RESULTADO:


-- 4. Políticas RLS
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='profiles';
-- RESULTADO:


-- 5. Constraints e Foreign Keys
-- RESULTADO:


-- 6. Dados existentes
-- RESULTADO:


-- 7. Usuários sem profile
-- RESULTADO:

```

### 📊 Fase 3: Análise dos Resultados (PENDENTE)
- [ ] **PASSO 2**: Analisar minuciosamente os resultados
  - [ ] Verificar se existe DEFAULT na coluna `id`
  - [ ] Confirmar se há foreign key para `auth.users`
  - [ ] Identificar triggers ativos
  - [ ] Contar profiles com `id` NULL
  - [ ] Contar usuários sem profile
  - [ ] Avaliar políticas RLS existentes

#### Análise Detalhada:
```
✅ PROBLEMAS IDENTIFICADOS:
- [ ] DEFAULT na coluna profiles.id: SIM/NÃO
- [ ] Foreign Key para auth.users: EXISTE/NÃO EXISTE
- [ ] Trigger handle_new_user: ATIVO/INATIVO/NÃO EXISTE
- [ ] Profiles com id NULL: _____ registros
- [ ] Usuários sem profile: _____ registros
- [ ] Políticas RLS: ADEQUADAS/PRECISAM AJUSTE

🎯 AÇÕES NECESSÁRIAS:
- [ ] Remover DEFAULT de profiles.id
- [ ] Adicionar/corrigir Foreign Key
- [ ] Criar/ajustar trigger
- [ ] Limpar dados inconsistentes
- [ ] Criar profiles para usuários órfãos
```

### 💾 Fase 4: Backup (CRÍTICO)
- [ ] **PASSO 3**: Realizar backup completo
  ```sql
  -- EXECUTAR NO SUPABASE SQL EDITOR:
  CREATE TABLE profiles_backup AS SELECT * FROM public.profiles;
  
  -- VERIFICAR BACKUP:
  SELECT COUNT(*) as total_backup FROM profiles_backup;
  SELECT COUNT(*) as total_original FROM public.profiles;
  ```
  - [ ] Backup criado com sucesso
  - [ ] Contagem de registros confere
  - [ ] Data/hora do backup: _______________

### 🔧 Fase 5: Implementação em DEV (PENDENTE)
- [ ] **PASSO 4**: Aplicar correção em desenvolvimento
  - [ ] Confirmar que está em ambiente de DEV
  - [ ] Executar `correcao_profiles.sql` linha por linha
  - [ ] Verificar cada etapa sem erros
  - [ ] Documentar problemas encontrados

#### Log de Execução DEV:
```sql
-- PASSO 2: Remover trigger existente
-- STATUS: SUCESSO/ERRO
-- OBSERVAÇÕES:

-- PASSO 3: Limpar dados problemáticos
-- STATUS: SUCESSO/ERRO
-- REGISTROS REMOVIDOS: _____

-- PASSO 4: Remover DEFAULT
-- STATUS: SUCESSO/ERRO
-- OBSERVAÇÕES:

-- PASSO 5: Adicionar Foreign Key
-- STATUS: SUCESSO/ERRO
-- OBSERVAÇÕES:

-- PASSO 6: Criar função handle_new_user
-- STATUS: SUCESSO/ERRO
-- OBSERVAÇÕES:

-- PASSO 7: Criar trigger
-- STATUS: SUCESSO/ERRO
-- OBSERVAÇÕES:

-- PASSO 8: Criar profiles para usuários existentes
-- STATUS: SUCESSO/ERRO
-- PROFILES CRIADOS: _____

-- PASSO 9: Verificação final
-- STATUS: SUCESSO/ERRO
-- RESULTADOS:
```

### 🧪 Fase 6: Testes Rigorosos (PENDENTE)
- [ ] **PASSO 5**: Executar testes de validação
  - [ ] Teste 1: Criar novo usuário via Auth
  - [ ] Teste 2: Verificar se profile foi criado automaticamente
  - [ ] Teste 3: Validar dados do profile (id, email, tenant_id)
  - [ ] Teste 4: Testar exclusão de usuário (CASCADE)
  - [ ] Teste 5: Verificar políticas RLS

#### Resultados dos Testes:
```
✅ TESTE 1 - Criação de usuário:
- Email de teste: _______________
- Usuário criado: SIM/NÃO
- Timestamp: _______________

✅ TESTE 2 - Profile automático:
- Profile criado automaticamente: SIM/NÃO
- ID do profile = ID do usuário: SIM/NÃO
- Trigger funcionando: SIM/NÃO

✅ TESTE 3 - Dados do profile:
- Email correto: SIM/NÃO
- Display_name preenchido: SIM/NÃO
- Tenant_id gerado: SIM/NÃO

✅ TESTE 4 - Cascade delete:
- Usuário removido: SIM/NÃO
- Profile removido automaticamente: SIM/NÃO
- Foreign key funcionando: SIM/NÃO

✅ TESTE 5 - RLS:
- Políticas ativas: SIM/NÃO
- Acesso restrito ao owner: SIM/NÃO
- Segurança mantida: SIM/NÃO
```

### 🚀 Fase 7: Produção (AGUARDANDO VALIDAÇÃO)
- [ ] **PASSO 6**: Aplicar em produção
  - [ ] ⚠️ TODOS os testes passaram em DEV
  - [ ] ⚠️ Backup de produção realizado
  - [ ] ⚠️ Janela de manutenção agendada
  - [ ] ⚠️ Plano de rollback preparado
  - [ ] Executar correção em produção
  - [ ] Validar funcionamento
  - [ ] Monitorar por 24h

## 🎯 Critérios de Sucesso

### ✅ Validação Final:
- [ ] Zero profiles com `id` NULL
- [ ] Zero usuários sem profile
- [ ] Trigger criando profiles automaticamente
- [ ] Foreign key com CASCADE funcionando
- [ ] Erro "null value in column id" eliminado
- [ ] Performance mantida
- [ ] RLS funcionando corretamente

## 🚨 Plano de Rollback

Em caso de problemas:

```sql
-- 1. Restaurar backup
DROP TABLE IF EXISTS public.profiles;
ALTER TABLE profiles_backup RENAME TO profiles;

-- 2. Recriar índices se necessário
-- 3. Verificar aplicação funcionando
-- 4. Investigar causa do problema
```

## 📞 Contatos de Emergência

- **DBA**: _______________
- **DevOps**: _______________
- **Product Owner**: _______________

---

**⚠️ IMPORTANTE**: 
- Nunca pule o backup
- Sempre teste em DEV primeiro
- Documente todos os resultados
- Em caso de dúvida, pare e consulte a equipe

**📅 Última atualização**: _______________
**👤 Responsável**: _______________