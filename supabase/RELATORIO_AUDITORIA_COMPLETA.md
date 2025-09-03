# RELATÓRIO DE AUDITORIA COMPLETA - SCHEMA PUBLIC

**Data:** $(date)
**Escopo:** Schema `public` - Ensemble Hub Database
**Status:** Auditoria baseada em análise de código (acesso direto ao Supabase indisponível)

---

## 🔍 RESUMO EXECUTIVO

**CRÍTICO:** Esta auditoria foi realizada com base na análise dos arquivos de código disponíveis, pois o acesso direto ao Supabase não está disponível devido a privilégios insuficientes.

**RECOMENDAÇÃO URGENTE:** Execute o arquivo `auditoria_completa.sql` diretamente no Supabase SQL Editor para obter dados reais do banco.

---

## 📊 SEÇÃO 1: INVENTÁRIO DE SCHEMA

### 1.1 Tabela: `evento`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Baseado em análise de código
- **Campos esperados:** id, titulo, tipo, inicio, fim, local, endereco, orcamento, observacoes/descricao, tenant_id, created_at, updated_at
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

### 1.2 Tabela: `evento_banda`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Tabela de relacionamento N:N
- **Campos esperados:** id, evento_id, banda_id, tenant_id
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

### 1.3 Tabela: `banda`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Baseado em análise de código
- **Campos esperados:** id, nome, genero, tenant_id, created_at, updated_at
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

### 1.4 Tabela: `banda_membro`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Tabela de relacionamento N:N
- **Campos esperados:** id, banda_id, profile_id, tenant_id
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

### 1.5 Tabela: `profiles`
**STATUS:** 🔴 **FAIL** (Problema conhecido)
- **Evidência:** Erro "null value in column id" documentado
- **Problemas identificados:**
  - Constraint NOT NULL em `id` com DEFAULT problemático
  - Possível ausência de FK para `auth.users(id)`
  - Trigger `handle_new_user` pode estar inadequado
- **Patch SQL:** Ver `correcao_profiles.sql` (já criado)

### 1.6 Tabela: `financeiro`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Baseado em análise de código
- **Campos esperados:** id, tenant_id, created_at, updated_at
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

### 1.7 Tabela: `transactions`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Baseado em análise de código
- **Campos esperados:** id, tenant_id, created_at, updated_at
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

### 1.8 Tabela: `unidade`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Baseado em análise de código
- **Campos esperados:** id, tenant_id, created_at, updated_at
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1

---

## 🔒 SEÇÃO 2: RLS & POLÍTICAS

### 2.1 Row Level Security (RLS)
**STATUS:** 🔴 **FAIL PROVÁVEL**
- **Evidência:** Análise de código não mostra configuração RLS
- **Problema:** RLS provavelmente não habilitado nas tabelas
- **Impacto:** CRÍTICO - Dados podem estar expostos entre tenants
- **Patch SQL:**
```sql
ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_banda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banda_membro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidade ENABLE ROW LEVEL SECURITY;
```

### 2.2 Políticas de Tenant
**STATUS:** 🔴 **FAIL PROVÁVEL**
- **Evidência:** Nenhuma política encontrada na análise
- **Problema:** Ausência de políticas baseadas em tenant_id
- **Impacto:** CRÍTICO - Isolamento de dados comprometido
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 2

---

## ⚙️ SEÇÃO 3: RPCs/FUNÇÕES/TRIGGERS

### 3.1 Função: `get_evento_full`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Função referenciada no código frontend
- **Contrato esperado:**
  - Input: `p_evento_id uuid`
  - Output: JSON com evento + bandas
  - Segurança: Verificação de tenant_id
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 3

### 3.2 Função: `update_evento_full`
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Função referenciada no código frontend
- **Contrato esperado:**
  - Input: Dados do evento + array de banda_ids
  - Output: JSON com status
  - Segurança: Verificação de tenant_id
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 3

### 3.3 Trigger: `handle_new_user`
**STATUS:** 🔴 **FAIL** (Problema conhecido)
- **Evidência:** Erro na criação de profiles documentado
- **Problema:** Trigger não está criando profiles corretamente
- **Patch SQL:** Ver `correcao_profiles.sql`

---

## 🔗 SEÇÃO 4: INTEGRIDADE REFERENCIAL

### 4.1 Foreign Keys
**STATUS:** 🔴 **FAIL PROVÁVEL**
- **Evidência:** Análise de código sugere ausência de FKs
- **Problemas esperados:**
  - `evento_banda.evento_id` → `evento.id`
  - `evento_banda.banda_id` → `banda.id`
  - `banda_membro.banda_id` → `banda.id`
  - `banda_membro.profile_id` → `profiles.id`
  - `profiles.id` → `auth.users.id`
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 2 (Prioridade 2)

### 4.2 Registros Órfãos
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Sem FKs, órfãos são possíveis
- **Verificação necessária:** Execute `auditoria_completa.sql` - Seção 4
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 4

---

## 🏢 SEÇÃO 5: CONSISTÊNCIA DE TENANT

### 5.1 Campo tenant_id
**STATUS:** 🔴 **FAIL PROVÁVEL**
- **Evidência:** Campo tenant_id pode estar ausente
- **Problema:** Sem tenant_id, não há isolamento de dados
- **Impacto:** CRÍTICO
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 1 (Prioridade 1)

### 5.2 Consistência entre Tabelas
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Sem dados reais, não é possível verificar
- **Verificação:** Execute `auditoria_completa.sql` - Seção 5
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 5

---

## 🕐 SEÇÃO 6: DATA/HORA & TIMEZONE

### 6.1 Campos de Timestamp
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Evidência:** Campos podem estar como `timestamp` sem timezone
- **Problema:** Inconsistência de timezone
- **Campos afetados:** `inicio`, `fim`, `created_at`, `updated_at`
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 6

---

## 🚀 SEÇÃO 7: PERFORMANCE & ÍNDICES

### 7.1 Índices Críticos
**STATUS:** 🔴 **FAIL PROVÁVEL**
- **Evidência:** Análise sugere ausência de índices otimizados
- **Índices necessários:**
  - `idx_evento_tenant_inicio` (tenant_id, inicio DESC)
  - `idx_evento_banda_evento` (evento_id)
  - `idx_evento_banda_banda` (banda_id)
  - `idx_banda_membro_banda` (banda_id)
  - `idx_banda_membro_profile` (profile_id)
  - Índices de tenant_id em todas as tabelas
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 7

---

## 📋 SEÇÃO 8: CHECKLIST FRONTEND ⇄ BACKEND

### 8.1 Contrato de Dados - Evento
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Problema potencial:** Campo `observacoes` vs `descricao`
- **Frontend espera:** `descricao`
- **Backend pode ter:** `observacoes`
- **Patch SQL:** Ver `patches_auditoria.sql` - Seção 8

### 8.2 Função get_evento_full
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Contrato:** Deve retornar evento com array de bandas
- **Verificação:** Execute função e compare com frontend

### 8.3 Função update_evento_full
**STATUS:** ⚠️ **VERIFICAÇÃO NECESSÁRIA**
- **Contrato:** Deve aceitar dados do evento + banda_ids
- **Verificação:** Teste com dados do frontend

---

## 📈 RESUMO & TOP 10 CORREÇÕES PRIORITÁRIAS

### 🔥 CRÍTICAS (Executar IMEDIATAMENTE)

1. **🔴 CRÍTICO:** Corrigir tabela `profiles` (erro null constraint)
   - **Arquivo:** `correcao_profiles.sql`
   - **Impacto:** Sistema não funciona para novos usuários

2. **🔴 CRÍTICO:** Habilitar RLS em todas as tabelas
   - **Patch:** `patches_auditoria.sql` - Seção 2.1
   - **Impacto:** Dados expostos entre tenants

3. **🔴 CRÍTICO:** Adicionar campo `tenant_id` onde ausente
   - **Patch:** `patches_auditoria.sql` - Seção 1
   - **Impacto:** Sem isolamento de dados

4. **🔴 CRÍTICO:** Criar políticas RLS baseadas em tenant
   - **Patch:** `patches_auditoria.sql` - Seção 2.2
   - **Impacto:** Dados acessíveis por qualquer usuário

### 🟡 IMPORTANTES (Executar em seguida)

5. **🟡 IMPORTANTE:** Adicionar Foreign Keys com ON DELETE CASCADE
   - **Patch:** `patches_auditoria.sql` - Seção 2 (Prioridade 2)
   - **Impacto:** Integridade referencial comprometida

6. **🟡 IMPORTANTE:** Adicionar Primary Keys onde ausentes
   - **Patch:** `patches_auditoria.sql` - Seção 2 (Prioridade 2)
   - **Impacto:** Performance e integridade

7. **🟡 IMPORTANTE:** Converter timestamps para timestamptz
   - **Patch:** `patches_auditoria.sql` - Seção 6
   - **Impacto:** Problemas de timezone

### 🟢 MELHORIAS (Executar quando possível)

8. **🟢 MELHORIA:** Criar índices de performance
   - **Patch:** `patches_auditoria.sql` - Seção 7
   - **Impacto:** Queries lentas

9. **🟢 MELHORIA:** Padronizar campo observacoes/descricao
   - **Patch:** `patches_auditoria.sql` - Seção 8
   - **Impacto:** Inconsistência frontend/backend

10. **🟢 MELHORIA:** Limpar registros órfãos
    - **Patch:** `patches_auditoria.sql` - Seção 4
    - **Impacto:** Dados inconsistentes

---

## 🚨 AÇÕES IMEDIATAS REQUERIDAS

### 1. EXECUTAR AUDITORIA REAL
```bash
# No Supabase SQL Editor, execute:
# Arquivo: auditoria_completa.sql
```

### 2. CORRIGIR PROBLEMA CRÍTICO DE PROFILES
```bash
# No Supabase SQL Editor, execute:
# 1. diagnostico_profiles.sql (verificar problema)
# 2. correcao_profiles.sql (aplicar correção)
```

### 3. APLICAR PATCHES CRÍTICOS
```bash
# No Supabase SQL Editor, execute em ordem:
# 1. Patches Críticos (Prioridade 1)
# 2. Patches Importantes (Prioridade 2)
# 3. Patches de Performance (Prioridade 3)
```

---

## ⚠️ AVISOS IMPORTANTES

1. **BACKUP OBRIGATÓRIO:** Faça backup completo antes de aplicar qualquer patch
2. **TESTE EM DEV:** Execute todos os patches em ambiente de desenvolvimento primeiro
3. **ACESSO SUPABASE:** Resolva o problema de privilégios para executar auditoria real
4. **MONITORAMENTO:** Monitore performance após aplicar índices
5. **ROLLBACK:** Tenha plano de rollback preparado

---

## 📞 PRÓXIMOS PASSOS

1. ✅ **CONCLUÍDO:** Arquivos de auditoria e patches criados
2. 🔄 **EM ANDAMENTO:** Resolver acesso ao Supabase
3. ⏳ **PENDENTE:** Executar `auditoria_completa.sql` no Supabase SQL Editor
4. ⏳ **PENDENTE:** Analisar resultados reais e atualizar este relatório
5. ⏳ **PENDENTE:** Aplicar patches em ordem de prioridade
6. ⏳ **PENDENTE:** Executar nova auditoria para confirmar correções

---

**RELATÓRIO GERADO POR:** SOLO Coding Agent
**ARQUIVOS RELACIONADOS:**
- `auditoria_completa.sql` - Queries de auditoria
- `patches_auditoria.sql` - Patches SQL organizados
- `correcao_profiles.sql` - Correção específica para profiles
- `diagnostico_profiles.sql` - Diagnóstico da tabela profiles
- `CHECKLIST_EXECUCAO_CORRECAO_PROFILES.md` - Checklist de execução