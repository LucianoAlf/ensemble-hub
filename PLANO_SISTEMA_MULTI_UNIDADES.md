# 📋 **PLANO COMPLETO: Sistema Multi-Unidades com Categorias de Bandas**

Baseado na análise da estrutura atual, aqui está o plano detalhado para implementar o sistema de 3 unidades com categorias de bandas:

## 🔍 **ANÁLISE DA ESTRUTURA ATUAL**

**✅ Estrutura Existente Identificada:**
- Tabela `banda` já tem campo `unidade_id` (UUID)
- Tabela `unidade` já existe com as colunas: `id`, `nome`, `created_at`
- Sistema de RLS já implementado
- Relacionamentos já estabelecidos

**⚠️ Lacunas Identificadas:**
- Falta campo `categoria` na tabela `banda` (Kids, Teen, Adulto)
- Unidades não estão populadas no banco
- Frontend não utiliza os campos de unidade/categoria

---

## 🏗️ **PLANO DE IMPLEMENTAÇÃO**

### **FASE 1: Estrutura do Banco de Dados**

#### 1.1 **Migração: Adicionar Campo Categoria**
```sql
-- Nova migração: 20250907000000_add_banda_categoria.sql
ALTER TABLE public.banda ADD COLUMN categoria TEXT;
ALTER TABLE public.banda ADD CONSTRAINT banda_categoria_check 
  CHECK (categoria IN ('kids', 'teen', 'adulto'));
```

#### 1.2 **Migração: Popular Unidades**
```sql
-- Nova migração: 20250907000001_populate_unidades.sql
INSERT INTO public.unidade (nome) VALUES 
  ('Campo Grande'),
  ('Recreio'),
  ('Barra')
ON CONFLICT (nome) DO NOTHING;
```

#### 1.3 **Migração: Índices de Performance**
```sql
-- Nova migração: 20250907000002_add_banda_indexes.sql
CREATE INDEX IF NOT EXISTS idx_banda_unidade_categoria ON public.banda(unidade_id, categoria);
CREATE INDEX IF NOT EXISTS idx_banda_categoria ON public.banda(categoria);
```

### **FASE 2: Backend/API**

#### 2.1 **Atualizar Tipos TypeScript**
- Adicionar `categoria: 'kids' | 'teen' | 'adulto'` no tipo `Banda`
- Criar tipo `Unidade` com campos necessários
- Atualizar interfaces de formulários

#### 2.2 **Hooks e Serviços**
- `useUnidades()`: Hook para buscar unidades
- `useBandas()`: Atualizar para incluir filtros por unidade/categoria
- Atualizar `useBandStats()` para métricas segmentadas

#### 2.3 **Validações**
- Zod schemas para validar categoria obrigatória
- Validação de unidade obrigatória no cadastro

### **FASE 3: Frontend - Formulários**

#### 3.1 **Cadastro de Bandas**
- Adicionar dropdown "Unidade" (Campo Grande, Recreio, Barra)
- Adicionar dropdown "Categoria" (Kids, Teen, Adulto)
- Validação obrigatória para ambos campos
- Manter compatibilidade com bandas existentes

#### 3.2 **Filtros e Listagens**
- Filtros por unidade na listagem de bandas
- Filtros por categoria na listagem de bandas
- Busca combinada (unidade + categoria)

### **FASE 4: Dashboard - Layout Otimizado**

#### 4.1 **Cards Essenciais (5 cards únicos)**

**Linha Principal (5 cards sem redundâncias):**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Bandas Ativas │ Próximos Eventos│  Total Membros  │  Receita Mensal │ Despesa Mensal  │
│   🎵 35 bandas  │   📅 12 eventos │   👥 180 pessoas│   💰 R$ 15.500  │   💸 R$ 8.200   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### 4.2 **Gráficos Visuais (substituem cards excessivos)**

**Métricas por Unidade - Gráfico de Pizza:**
```
┌─────────────────────────────────────────────────────────┐
│                 Distribuição por Unidade                │
│                                                         │
│    🟢 Campo Grande (40%)    🔵 Recreio (25%)           │
│    🟡 Barra (35%)                                       │
│                                                         │
│    📊 Gráfico interativo com tooltips                   │
└─────────────────────────────────────────────────────────┘
```

**Métricas por Categoria - Gráfico de Barras:**
```
┌─────────────────────────────────────────────────────────┐
│              Bandas por Categoria e Unidade             │
│                                                         │
│  Kids   ████████ (8)                                   │
│  Teen   ████████████ (12)                              │
│  Adulto ███████████████ (15)                           │
│                                                         │
│    📊 Barras segmentadas por unidade                    │
└─────────────────────────────────────────────────────────┘
```

#### 4.3 **Componentes Dashboard**
- `FinancialMetricsCard`: Card Despesa Mensal (Receita já existe)
- `UnidadeDistributionChart`: Gráfico de pizza por unidade
- `CategoriaBarChart`: Gráfico de barras por categoria
- `FinancialChart`: Gráfico Receitas vs Despesas (mantido do dashboard atual)

### **FASE 5: Compatibilidade e Migração**

#### 5.1 **Dados Existentes**
- Script para migrar bandas existentes (definir unidade/categoria padrão)
- Manter funcionalidade para bandas sem categoria (temporário)
- Gradual enforcement das validações

#### 5.2 **Testes**
- Testes unitários para novos componentes
- Testes de integração para formulários
- Testes E2E para fluxo completo

---

## 📊 **ESTRUTURA DE DADOS FINAL**

### **Tabela `banda` (atualizada)**
```sql
CREATE TABLE public.banda (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  unidade_id UUID REFERENCES public.unidade(id), -- ✅ Já existe
  nome TEXT NOT NULL,
  genero TEXT,
  categoria TEXT CHECK (categoria IN ('kids', 'teen', 'adulto')), -- 🆕 Novo
  descricao TEXT,
  logo_url TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **Tabela `unidade` (existente)**
```sql
CREATE TABLE public.unidade (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE, -- Campo Grande, Recreio, Barra
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎯 **BENEFÍCIOS DO PLANO**

### **✅ Vantagens**
1. **Aproveitamento**: Usa estrutura existente (`unidade_id` já existe)
2. **Não-Destrutivo**: Não quebra funcionalidades atuais
3. **Escalável**: Fácil adicionar novas unidades/categorias
4. **Performance**: Índices otimizados para consultas
5. **UX**: Dashboard rico em informações sem redundância

### **⚠️ Considerações**
1. **Migração Gradual**: Bandas existentes precisam ser categorizadas
2. **Validação**: Implementar validações progressivamente
3. **Testes**: Garantir que não quebra fluxos existentes
4. **Treinamento**: Usuários precisam entender nova estrutura

---

## 🚀 **ORDEM DE EXECUÇÃO SUGERIDA**

1. **Migrações do Banco** (Fase 1)
2. **Tipos e Interfaces** (Fase 2.1)
3. **Hooks e Serviços** (Fase 2.2-2.3)
4. **Formulário de Cadastro** (Fase 3.1)
5. **Dashboard Básico** (Fase 4.1)
6. **Filtros e Listagens** (Fase 3.2)
7. **Gráficos Avançados** (Fase 4.2-4.3)
8. **Testes e Refinamentos** (Fase 5)

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Banco de Dados**
- [ ] Migração: Adicionar campo `categoria` na tabela `banda`
- [ ] Migração: Popular tabela `unidade` com as 3 unidades
- [ ] Migração: Criar índices de performance
- [ ] Validar constraints e relacionamentos

### **Backend**
- [ ] Atualizar tipos TypeScript para `Banda` e `Unidade`
- [ ] Criar hook `useUnidades()`
- [ ] Atualizar hook `useBandas()` com filtros
- [ ] Implementar validações Zod
- [ ] Atualizar serviços de métricas

### **Frontend - Formulários**
- [ ] Adicionar dropdown "Unidade" no cadastro de bandas
- [ ] Adicionar dropdown "Categoria" no cadastro de bandas
- [ ] Implementar validações obrigatórias
- [ ] Adicionar filtros na listagem de bandas
- [ ] Testes de formulários

### **Frontend - Dashboard**
- [ ] **Manter cards existentes**: Bandas Ativas, Próximos Eventos, Total Membros, Receita Mensal
- [ ] **Adicionar novo card**: Despesa Mensal (único card novo)
- [ ] **Manter gráfico existente**: Receitas vs Despesas
- [ ] Implementar `UnidadeDistributionChart`: Gráfico de pizza por unidade
- [ ] Implementar `CategoriaBarChart`: Gráfico de barras por categoria
- [ ] Integrar gráficos com dados reais do Supabase
- [ ] **Garantir integração completa** com módulo financeiro existente

### **Testes e Validação**
- [ ] Testes unitários dos novos componentes
- [ ] Testes de integração dos formulários
- [ ] Testes E2E do fluxo completo
- [ ] Validação de performance
- [ ] Migração de dados existentes

---

**Status**: 📝 Plano criado - Aguardando aprovação para implementação
**Data**: 07/09/2025
**Versão**: 1.0
