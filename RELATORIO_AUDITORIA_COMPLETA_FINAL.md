# RELATÓRIO DE AUDITORIA COMPLETA - SCHEMA PUBLIC
**Data**: 2025-01-24  
**Escopo**: Tabelas principais e RPCs críticas  
**Status**: ✅ CONCLUÍDA

---

## 📋 RESUMO EXECUTIVO

### Tabelas Auditadas:
- ✅ `evento` (33 campos)
- ✅ `evento_banda` (4 campos) 
- ✅ `banda` (10 campos)
- ✅ `banda_membro` (7 campos)
- ✅ `profiles` (5 campos)
- ✅ `financeiro` (8 campos)
- ✅ `transactions` (17 campos)
- ✅ `unidade` (5 campos)

### RPCs Auditadas:
- ✅ `public.get_evento_full(uuid)`
- ✅ `public.update_evento_full(...)`

---

## ✅ PONTOS POSITIVOS

### 1. **Segurança Multi-Tenant Robusta**
- **Evidência**: Todas as tabelas principais implementam RLS baseado em `tenant_id`
- **Detalhes**: 
  - `banda`, `evento`, `financeiro`, `transactions`, `unidade` têm `tenant_id NOT NULL`
  - Políticas RLS validam `tenant_id` via `public.profiles`
  - RPCs usam `SECURITY INVOKER` mantendo RLS ativo

### 2. **Integridade Referencial Bem Definida**
- **Evidência**: Foreign keys com CASCADE apropriados
- **Detalhes**:
  - `banda_membro.banda_id → banda(id) ON DELETE CASCADE`
  - `evento_banda.banda_id → banda(id) ON DELETE CASCADE`
  - `profiles.id → auth.users(id) ON DELETE CASCADE`

### 3. **Auditoria Temporal Completa**
- **Evidência**: Campos `created_at` e `updated_at` em todas as tabelas
- **Detalhes**: 
  - Triggers `update_updated_at_column()` implementados
  - Timestamps com timezone (`TIMESTAMP WITH TIME ZONE`)

### 4. **Validação de Dados Consistente**
- **Evidência**: CHECK constraints em campos críticos
- **Detalhes**:
  - `financeiro.tipo IN ('receita', 'despesa')`
  - `transactions.type IN ('income','expense')`
  - `transactions.status IN ('pending','scheduled','settled')`

### 5. **RPCs com Validação Rigorosa**
- **Evidência**: Funções `get_evento_full` e `update_evento_full`
- **Detalhes**:
  - Validação de `tenant_id` antes de qualquer operação
  - Tratamento de erros com mensagens específicas
  - Retorno estruturado em JSON

---

## ⚠️ ALERTAS QUE REQUEREM ATENÇÃO

### 1. **Conflito de Relacionamento Evento-Banda**
- **Problema**: Dois mecanismos para relacionar eventos e bandas
- **Evidência**: 
  - Campo direto: `evento.banda_id` (1:1)
  - Tabela junção: `evento_banda` (N:N)
- **Impacto**: Inconsistência na lógica de negócio
- **Patch Sugerido**:
```sql
-- Opção 1: Remover campo direto (recomendado para N:N)
ALTER TABLE public.evento DROP COLUMN banda_id;

-- Opção 2: Remover tabela junção (se 1:1 for suficiente)
DROP TABLE public.evento_banda;
```

### 2. **Tabela `banda_membro` Sem `tenant_id`**
- **Problema**: Isolamento multi-tenant indireto
- **Evidência**: RLS depende de JOIN com `banda` para obter `tenant_id`
- **Impacto**: Performance degradada e complexidade desnecessária
- **Patch Sugerido**:
```sql
ALTER TABLE public.banda_membro ADD COLUMN tenant_id UUID;
UPDATE public.banda_membro SET tenant_id = (
  SELECT b.tenant_id FROM public.banda b WHERE b.id = banda_membro.banda_id
);
ALTER TABLE public.banda_membro ALTER COLUMN tenant_id SET NOT NULL;
```

### 3. **Campos Financeiros Sem Validação**
- **Problema**: Valores monetários podem ser negativos inadequadamente
- **Evidência**: `orcamento DECIMAL(10,2)` sem CHECK constraint
- **Patch Sugerido**:
```sql
ALTER TABLE public.evento ADD CONSTRAINT check_orcamento_positive 
  CHECK (orcamento IS NULL OR orcamento >= 0);
ALTER TABLE public.financeiro ADD CONSTRAINT check_valor_not_zero 
  CHECK (valor != 0);
```

### 4. **Ausência de Índices de Performance**
- **Problema**: Consultas por `tenant_id` podem ser lentas
- **Evidência**: Não foram encontrados índices específicos
- **Patch Sugerido**:
```sql
CREATE INDEX idx_evento_tenant_id ON public.evento(tenant_id);
CREATE INDEX idx_banda_tenant_id ON public.banda(tenant_id);
CREATE INDEX idx_evento_inicio ON public.evento(inicio);
CREATE INDEX idx_transactions_tenant_date ON public.transactions(tenant_id, transaction_date);
```

---

## 🚨 PONTOS CRÍTICOS

### 1. **Inconsistência Arquitetural Crítica**
- **Problema**: Relacionamento Evento-Banda duplicado
- **Evidência**: Frontend desabilita `evento_banda` mas backend suporta
- **Impacto**: 
  - Dados inconsistentes
  - Lógica de negócio fragmentada
  - Potencial para registros órfãos
- **Ação Requerida**: Decisão arquitetural imediata

### 2. **Política RLS Inconsistente em `financeiro`**
- **Problema**: Política SELECT usa EXISTS sem EXISTS
- **Evidência**: 
```sql
FOR SELECT USING (
  SELECT 1 FROM public.profiles  -- FALTA EXISTS
  WHERE id = auth.uid() AND tenant_id = financeiro.tenant_id
)
```
- **Impacto**: Política pode falhar silenciosamente
- **Patch Crítico**:
```sql
DROP POLICY "Users can view financial data from their tenant" ON public.financeiro;
CREATE POLICY "Users can view financial data from their tenant" ON public.financeiro
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = financeiro.tenant_id
    )
  );
```

### 3. **Ausência de Validação de Datas**
- **Problema**: `evento.fim` pode ser anterior a `evento.inicio`
- **Impacto**: Dados logicamente inválidos
- **Patch Crítico**:
```sql
ALTER TABLE public.evento ADD CONSTRAINT check_evento_dates 
  CHECK (fim IS NULL OR fim >= inicio);
```

---

## 📊 INVENTÁRIO DETALHADO DO SCHEMA

### Tabela: `public.evento`
| Campo | Tipo | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | - | FK (implícito) |
| unidade_id | UUID | YES | - | FK → unidade(id) |
| banda_id | UUID | YES | - | FK → banda(id) |
| sala_id | UUID | YES | - | - |
| titulo | TEXT | NO | - | - |
| tipo | TEXT | NO | 'show' | - |
| status | TEXT | YES | 'agendado' | - |
| inicio | TIMESTAMP WITH TIME ZONE | NO | - | - |
| fim | TIMESTAMP WITH TIME ZONE | YES | - | - |
| local | TEXT | YES | - | - |
| endereco | TEXT | YES | - | - |
| orcamento | DECIMAL(10,2) | YES | - | - |
| descricao | TEXT | YES | - | - |
| created_at | TIMESTAMP WITH TIME ZONE | YES | now() | - |
| updated_at | TIMESTAMP WITH TIME ZONE | YES | now() | - |

### Tabela: `public.banda`
| Campo | Tipo | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | - | - |
| unidade_id | UUID | YES | - | FK → unidade(id) |
| nome | TEXT | NO | - | - |
| genero | TEXT | YES | - | - |
| descricao | TEXT | YES | - | - |
| logo_url | TEXT | YES | - | - |
| ativa | BOOLEAN | YES | true | - |
| created_at | TIMESTAMP WITH TIME ZONE | YES | now() | - |
| updated_at | TIMESTAMP WITH TIME ZONE | YES | now() | - |

### Tabela: `public.transactions`
| Campo | Tipo | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | - | - |
| type | TEXT | NO | - | CHECK IN ('income','expense') |
| category | TEXT | NO | - | - |
| description | TEXT | YES | - | - |
| banda_id | UUID | YES | - | FK → banda(id) |
| evento_id | UUID | YES | - | FK → evento(id) |
| counterparty | TEXT | YES | - | - |
| gross_amount | NUMERIC | NO | - | - |
| fee_amount | NUMERIC | YES | 0 | - |
| net_amount | NUMERIC | NO | GENERATED | STORED |
| status | TEXT | YES | 'pending' | CHECK IN ('pending','scheduled','settled') |
| transaction_date | DATE | NO | - | - |
| settled_at | TIMESTAMP WITH TIME ZONE | YES | - | - |
| attachment_url | TEXT | YES | - | - |
| created_at | TIMESTAMP WITH TIME ZONE | YES | now() | - |
| updated_at | TIMESTAMP WITH TIME ZONE | YES | now() | - |

---

## 🔧 PATCHES SQL CONSOLIDADOS

```sql
-- PATCH 1: Corrigir política RLS do financeiro
DROP POLICY "Users can view financial data from their tenant" ON public.financeiro;
CREATE POLICY "Users can view financial data from their tenant" ON public.financeiro
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND tenant_id = financeiro.tenant_id
    )
  );

-- PATCH 2: Adicionar validação de datas
ALTER TABLE public.evento ADD CONSTRAINT check_evento_dates 
  CHECK (fim IS NULL OR fim >= inicio);

-- PATCH 3: Adicionar validações financeiras
ALTER TABLE public.evento ADD CONSTRAINT check_orcamento_positive 
  CHECK (orcamento IS NULL OR orcamento >= 0);
ALTER TABLE public.financeiro ADD CONSTRAINT check_valor_not_zero 
  CHECK (valor != 0);

-- PATCH 4: Índices de performance
CREATE INDEX idx_evento_tenant_id ON public.evento(tenant_id);
CREATE INDEX idx_banda_tenant_id ON public.banda(tenant_id);
CREATE INDEX idx_evento_inicio ON public.evento(inicio);
CREATE INDEX idx_transactions_tenant_date ON public.transactions(tenant_id, transaction_date);

-- PATCH 5: Resolver conflito evento-banda (DECISÃO REQUERIDA)
-- Opção A: Manter apenas relacionamento N:N
-- ALTER TABLE public.evento DROP COLUMN banda_id;
-- Opção B: Manter apenas relacionamento 1:1
-- DROP TABLE public.evento_banda;
```

---

## 📈 SCORE DE QUALIDADE

| Categoria | Score | Observações |
|-----------|-------|-------------|
| **Segurança** | 8/10 | RLS robusto, pequenos ajustes necessários |
| **Integridade** | 7/10 | FKs bem definidas, falta validação de datas |
| **Performance** | 6/10 | Ausência de índices específicos |
| **Consistência** | 5/10 | Conflito arquitetural crítico |
| **Manutenibilidade** | 7/10 | Código bem estruturado, documentação presente |

**Score Geral**: **6.6/10** - BOM com pontos críticos a resolver

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **URGENTE**: Resolver conflito evento-banda
2. **ALTA**: Aplicar patches SQL críticos
3. **MÉDIA**: Implementar índices de performance
4. **BAIXA**: Adicionar tenant_id em banda_membro

---

**Auditoria realizada por**: Sistema de Auditoria Automatizada  
**Próxima auditoria recomendada**: 30 dias