# RELATÓRIO DE AUDITORIA COMPLETA DO BANCO DE DADOS

**Data da Auditoria:** [DATA_EXECUCAO]
**Schema Auditado:** `public`
**Objetivo:** Garantir alinhamento 100% entre frontend e backend

---

## RESUMO EXECUTIVO

| Seção | Status | Crítico | Observações |
|-------|--------|---------|-------------|
| 1. Inventário de Schema | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 2. RLS & Políticas | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 3. RPCs/Funções/Triggers | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 4. Integridade Referencial | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 5. Consistência de Tenant | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 6. Data/Hora & Timezone | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 7. Performance & Índices | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |
| 8. Contrato Frontend ⇄ Backend | [PASS/FAIL] | [SIM/NÃO] | [RESUMO] |

**Status Geral:** [PASS/FAIL]
**Itens Críticos Encontrados:** [NÚMERO]
**Patches SQL Necessários:** [NÚMERO]

---

## 1. INVENTÁRIO DE SCHEMA

### 1.1 Tabelas Principais
**Status:** [PASS/FAIL]
**Evidência:** [RESULTADO_QUERY]
**Observações:** [DETALHES]

### 1.2 Primary Keys
**Status:** [PASS/FAIL]
**Evidência:** 
```sql
[RESULTADO_QUERY_PK]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 1.3 Coluna tenant_id
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_TENANT]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 1.4 Foreign Keys
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_FK]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 1.5 Índices
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_INDICES]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 1.6 UNIQUE Constraints N:N
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_UNIQUE]
```
**Falhas Identificadas:** [LISTA_FALHAS]

**PATCHES SQL SUGERIDOS - SEÇÃO 1:**
```sql
-- Exemplo de patches que serão preenchidos após análise
-- ALTER TABLE public.evento ADD COLUMN tenant_id UUID NOT NULL;
-- CREATE INDEX idx_evento_tenant_inicio ON public.evento(tenant_id, inicio DESC);
-- ALTER TABLE public.evento_banda ADD CONSTRAINT unique_evento_banda UNIQUE(evento_id, banda_id);
```

---

## 2. RLS & POLÍTICAS

### 2.1 RLS Habilitado
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_RLS]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 2.2 Políticas Existentes
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_POLICIES]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 2.3 Views e RLS
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_VIEWS]
```
**Falhas Identificadas:** [LISTA_FALHAS]

**PATCHES SQL SUGERIDOS - SEÇÃO 2:**
```sql
-- Exemplo de patches RLS
-- ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY evento_tenant_policy ON public.evento
--   USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
--   WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
```

---

## 3. RPCs/FUNÇÕES/TRIGGERS

### 3.1 Assinaturas Principais
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_FUNCTIONS]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 3.2 Parâmetros das Funções
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_PARAMETERS]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 3.3 Triggers
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_TRIGGERS]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 3.4 Contrato get_evento_full
**Status:** [PASS/FAIL]
**Campos Esperados:** id, titulo, tipo, inicio, fim, local, endereco, orcamento, observacoes/descricao, bandas[]
**Campos Retornados:** [LISTA_CAMPOS_REAIS]
**Divergências:** [LISTA_DIVERGENCIAS]

### 3.5 Contrato update_evento_full
**Status:** [PASS/FAIL]
**Parâmetros Esperados:** p_evento_id, p_titulo, p_tipo, p_inicio, p_local, p_fim, p_endereco, p_orcamento, p_observacoes/p_descricao, p_banda_ids
**Parâmetros Reais:** [LISTA_PARAMETROS_REAIS]
**Divergências:** [LISTA_DIVERGENCIAS]

**PATCHES SQL SUGERIDOS - SEÇÃO 3:**
```sql
-- Exemplo de patches para funções
-- CREATE OR REPLACE FUNCTION public.get_evento_full(p_evento_id uuid)
-- RETURNS json
-- LANGUAGE plpgsql
-- SECURITY INVOKER
-- AS $$...
```

---

## 4. INTEGRIDADE REFERENCIAL & ORFÃOS

### 4.1 Orfãos evento_banda -> evento
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_ORFAOS] registros órfãos
**Amostras:** [LISTA_IDS_ORFAOS]

### 4.2 Orfãos evento_banda -> banda
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_ORFAOS] registros órfãos
**Amostras:** [LISTA_IDS_ORFAOS]

### 4.3 Orfãos banda_membro -> banda
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_ORFAOS] registros órfãos
**Amostras:** [LISTA_IDS_ORFAOS]

### 4.4 Orfãos banda_membro -> profiles
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_ORFAOS] registros órfãos
**Amostras:** [LISTA_IDS_ORFAOS]

**PATCHES SQL SUGERIDOS - SEÇÃO 4:**
```sql
-- Limpeza de orfãos
-- DELETE FROM public.evento_banda WHERE NOT EXISTS (SELECT 1 FROM public.evento WHERE id = evento_banda.evento_id);
-- DELETE FROM public.evento_banda WHERE NOT EXISTS (SELECT 1 FROM public.banda WHERE id = evento_banda.banda_id);
-- 
-- Adicionar ON DELETE CASCADE
-- ALTER TABLE public.evento_banda DROP CONSTRAINT IF EXISTS fk_evento_banda_evento;
-- ALTER TABLE public.evento_banda ADD CONSTRAINT fk_evento_banda_evento 
--   FOREIGN KEY (evento_id) REFERENCES public.evento(id) ON DELETE CASCADE;
```

---

## 5. CONSISTÊNCIA DE TENANT

### 5.1 evento <-> evento_banda
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_INCONSISTENCIAS] inconsistências
**Amostras:** [LISTA_INCONSISTENCIAS]

### 5.2 banda <-> evento_banda
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_INCONSISTENCIAS] inconsistências
**Amostras:** [LISTA_INCONSISTENCIAS]

### 5.3 banda <-> banda_membro
**Status:** [PASS/FAIL]
**Evidência:** [COUNT_INCONSISTENCIAS] inconsistências
**Amostras:** [LISTA_INCONSISTENCIAS]

**PATCHES SQL SUGERIDOS - SEÇÃO 5:**
```sql
-- Correção de inconsistências de tenant
-- UPDATE public.evento_banda SET tenant_id = e.tenant_id 
-- FROM public.evento e WHERE e.id = evento_banda.evento_id AND evento_banda.tenant_id != e.tenant_id;
```

---

## 6. DATA/HORA & TIMEZONE

### 6.1 Tipos timestamp em evento
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_TIMESTAMP]
```
**Falhas Identificadas:** [LISTA_FALHAS]

### 6.2 Configuração Timezone
**Status:** [PASS/FAIL]
**Evidência:** Timezone atual: [TIMEZONE_ATUAL]
**Observações:** [DETALHES]

**PATCHES SQL SUGERIDOS - SEÇÃO 6:**
```sql
-- Conversão para timestamptz
-- ALTER TABLE public.evento ALTER COLUMN inicio TYPE timestamptz USING inicio AT TIME ZONE 'UTC';
-- ALTER TABLE public.evento ALTER COLUMN fim TYPE timestamptz USING fim AT TIME ZONE 'UTC';
```

---

## 7. PERFORMANCE & ÍNDICES CRÍTICOS

### 7.1 Índices recomendados evento
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_INDICES_EVENTO]
```
**Índices Faltantes:** [LISTA_INDICES_FALTANTES]

### 7.2 Índices evento_banda
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_INDICES_EVENTO_BANDA]
```
**Índices Faltantes:** [LISTA_INDICES_FALTANTES]

**PATCHES SQL SUGERIDOS - SEÇÃO 7:**
```sql
-- Índices de performance
-- CREATE INDEX idx_evento_tenant_inicio ON public.evento(tenant_id, inicio DESC);
-- CREATE INDEX idx_evento_lookup ON public.evento(id, tenant_id);
-- CREATE INDEX idx_evento_banda_evento ON public.evento_banda(evento_id);
-- CREATE INDEX idx_evento_banda_banda ON public.evento_banda(banda_id);
-- CREATE INDEX idx_banda_tenant ON public.banda(tenant_id);
-- CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
```

---

## 8. CHECKLIST FRONTEND ⇄ BACKEND

### 8.1 Campos evento esperados
**Status:** [PASS/FAIL]
**Evidência:**
```sql
[RESULTADO_QUERY_CAMPOS_EVENTO]
```
**Campos Faltantes:** [LISTA_CAMPOS_FALTANTES]
**Campos Extras:** [LISTA_CAMPOS_EXTRAS]

### 8.2 Campo texto longo (observacoes vs descricao)
**Status:** [PASS/FAIL]
**Campo Oficial:** [CAMPO_ENCONTRADO]
**Evidência:** [RESULTADO_QUERY]
**Ação Requerida:** [ACAO_NECESSARIA]

### 8.3 Contrato bandas[] no JSON
**Status:** [PASS/FAIL]
**Estrutura Esperada:** `{ id: uuid, nome: text, genero: text|null }`
**Estrutura Real:** [ESTRUTURA_REAL]
**Divergências:** [LISTA_DIVERGENCIAS]

**PATCHES SQL SUGERIDOS - SEÇÃO 8:**
```sql
-- Ajustes de contrato
-- Exemplo: padronizar campo de texto longo
-- ALTER TABLE public.evento RENAME COLUMN observacoes TO descricao;
-- 
-- Ou ajustar função para mapear corretamente:
-- CREATE OR REPLACE FUNCTION public.get_evento_full(...)
-- -- Ajustar JSON build para usar campo correto
```

---

## RESUMO FINAL

### Status Geral da Auditoria
- **PASS:** [NÚMERO] seções
- **FAIL:** [NÚMERO] seções
- **Status Geral:** [PASS/FAIL]

### Criticidade dos Problemas
- **Críticos (Bloqueadores):** [NÚMERO]
- **Importantes (Impacto Alto):** [NÚMERO]
- **Menores (Melhorias):** [NÚMERO]

---

## TOP 10 CORREÇÕES PRIORITÁRIAS

| Prioridade | Seção | Problema | Impacto | Risco | Patch |
|------------|-------|----------|---------|-------|-------|
| 1 | [SEÇÃO] | [PROBLEMA] | Alto | Baixo | [PATCH_REF] |
| 2 | [SEÇÃO] | [PROBLEMA] | Alto | Baixo | [PATCH_REF] |
| 3 | [SEÇÃO] | [PROBLEMA] | Alto | Médio | [PATCH_REF] |
| 4 | [SEÇÃO] | [PROBLEMA] | Médio | Baixo | [PATCH_REF] |
| 5 | [SEÇÃO] | [PROBLEMA] | Médio | Baixo | [PATCH_REF] |
| 6 | [SEÇÃO] | [PROBLEMA] | Médio | Médio | [PATCH_REF] |
| 7 | [SEÇÃO] | [PROBLEMA] | Baixo | Baixo | [PATCH_REF] |
| 8 | [SEÇÃO] | [PROBLEMA] | Baixo | Baixo | [PATCH_REF] |
| 9 | [SEÇÃO] | [PROBLEMA] | Baixo | Baixo | [PATCH_REF] |
| 10 | [SEÇÃO] | [PROBLEMA] | Baixo | Baixo | [PATCH_REF] |

---

## PATCHES SQL CONSOLIDADOS

### Patches Críticos (Executar Primeiro)
```sql
-- [PATCHES_CRITICOS]
```

### Patches Importantes
```sql
-- [PATCHES_IMPORTANTES]
```

### Patches de Melhoria
```sql
-- [PATCHES_MELHORIAS]
```

---

## QUERIES DE VERIFICAÇÃO PÓS-CORREÇÃO

```sql
-- Queries para reauditoria após aplicação dos patches
-- Executar estas queries para verificar se as correções foram aplicadas corretamente

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles');

-- Verificar tenant_id em todas as tabelas
SELECT table_name, column_name, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND column_name = 'tenant_id'
AND table_name IN ('evento', 'evento_banda', 'banda', 'banda_membro', 'profiles');

-- Verificar orfãos após limpeza
SELECT 'evento_banda->evento' as check_type, COUNT(*) as orfaos
FROM public.evento_banda eb
WHERE NOT EXISTS (SELECT 1 FROM public.evento e WHERE e.id = eb.evento_id)
UNION ALL
SELECT 'evento_banda->banda', COUNT(*)
FROM public.evento_banda eb
WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id = eb.banda_id);

-- Verificar índices críticos
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (indexname LIKE '%tenant%' OR indexname LIKE '%evento_banda%')
ORDER BY tablename, indexname;
```

---

## OBSERVAÇÕES FINAIS

- **Data de Execução:** [DATA_EXECUCAO]
- **Responsável:** SOLO Coding Agent
- **Próximos Passos:** 
  1. Executar patches críticos em ambiente de desenvolvimento
  2. Testar funcionalidades afetadas
  3. Aplicar em produção com backup
  4. Executar queries de verificação
  5. Reauditoria completa

- **Contato para Dúvidas:** [CONTATO]
- **Arquivo de Auditoria:** `supabase/auditoria_completa.sql`
- **Arquivo de Patches:** `supabase/patches_auditoria.sql` (a ser criado)

---

**IMPORTANTE:** Este relatório foi gerado automaticamente. Todos os patches SQL sugeridos devem ser revisados e testados em ambiente de desenvolvimento antes da aplicação em produção.