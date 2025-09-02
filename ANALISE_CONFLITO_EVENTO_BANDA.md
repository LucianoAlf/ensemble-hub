# Análise do Conflito de Relacionamentos: Evento ↔ Banda

## Resumo Executivo

🚨 **CONFLITO IDENTIFICADO**: Existem dois mecanismos distintos para relacionar eventos e bandas:
1. **Campo direto**: `evento.banda_id` (relacionamento 1:1)
2. **Tabela de junção**: `evento_banda` (relacionamento N:N)

**Status**: ⚠️ **ARQUITETURA INCONSISTENTE** - Necessita resolução

---

## 1. Campos na Tabela `evento` que Referenciam Banda

### Campo Principal:
```sql
banda_id UUID REFERENCES public.banda(id)
```

### Detalhes:
- **Tipo**: `UUID`
- **Nullable**: `TRUE` (pode ser NULL)
- **Foreign Key**: `fk_evento_banda`
- **Referencia**: `public.banda(id)`
- **Cascade**: Não especificado (padrão: RESTRICT)

### Outros Campos Relacionados:
- `unidade_id UUID` - Referencia unidade organizacional
- `sala_id UUID` - Referencia sala/local do evento
- `tenant_id UUID` - Isolamento multi-tenant

---

## 2. Estrutura Completa da Tabela `evento_banda`

### Definição SQL:
```sql
CREATE TABLE public.evento_banda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL,
  banda_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(evento_id, banda_id)
);
```

### Campos:
| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|----------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Identificador único |
| `evento_id` | UUID | NOT NULL, FK | Referência ao evento |
| `banda_id` | UUID | NOT NULL, FK | Referência à banda |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data de criação |

### Constraints:
- **Primary Key**: `id`
- **Unique Constraint**: `(evento_id, banda_id)` - Previne duplicatas
- **Foreign Keys**:
  - `fk_evento_banda_evento`: `evento_id → evento(id)`
  - `fk_evento_banda_banda`: `banda_id → banda(id) ON DELETE CASCADE`

### Políticas RLS:
```sql
-- SELECT
"Users can view event bands from their tenant"
USING (EXISTS (
  SELECT 1 FROM public.evento e
  JOIN public.profiles p ON p.tenant_id = e.tenant_id
  WHERE e.id = evento_banda.evento_id AND p.id = auth.uid()
));

-- INSERT
"Users can create event bands in their tenant"
WITH CHECK (EXISTS (
  SELECT 1 FROM public.evento e
  JOIN public.profiles p ON p.tenant_id = e.tenant_id
  WHERE e.id = evento_banda.evento_id AND p.id = auth.uid()
));

-- DELETE
"Users can delete event bands in their tenant"
USING (EXISTS (
  SELECT 1 FROM public.evento e
  JOIN public.profiles p ON p.tenant_id = e.tenant_id
  WHERE e.id = evento_banda.evento_id AND p.id = auth.uid()
));
```

---

## 3. Relacionamentos e Foreign Keys

### Relacionamentos Identificados:

#### 3.1 Evento → Banda (Direto)
```sql
ALTER TABLE public.evento 
ADD CONSTRAINT fk_evento_banda 
FORIGN KEY (banda_id) REFERENCES public.banda(id);
```
- **Tipo**: 1:1 ou 1:0 (opcional)
- **Cardinalidade**: Um evento pode ter uma banda
- **Cascade**: Não especificado

#### 3.2 Evento ↔ Banda (Via Junção)
```sql
-- evento_banda → evento
ALTER TABLE public.evento_banda 
ADD CONSTRAINT fk_evento_banda_evento 
FOREIGN KEY (evento_id) REFERENCES public.evento(id);

-- evento_banda → banda
ALTER TABLE public.evento_banda 
ADD CONSTRAINT fk_evento_banda_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;
```
- **Tipo**: N:N (muitos para muitos)
- **Cardinalidade**: Um evento pode ter múltiplas bandas
- **Cascade**: CASCADE na banda, não especificado no evento

### 3.3 Outros Relacionamentos:
```sql
-- evento → unidade
fk_evento_unidade: evento.unidade_id → unidade(id)

-- Views que referenciam evento:
- vw_eventos_proximos
- vw_eventos_todos
```

---

## 4. Análise de Dados (Baseada no Código)

### 4.1 Uso no Frontend:

#### Em `Events.tsx`:
```typescript
// RELACIONAMENTO COMENTADO - Indica problema conhecido
// evento_banda?: { banda?: { nome?: string } }[] | null; // Comentado temporariamente

// Temporarily disabled band relationships - TODO: fix schema relationships
let bandName: string | undefined;
// if (row.evento_banda && Array.isArray(row.evento_banda) && row.evento_banda.length > 0) {
//   const firstBandRelation = row.evento_banda[0];
//   if (firstBandRelation?.banda?.nome) {
//     bandName = String(firstBandRelation.banda.nome).trim();
//   }
// }
```

**Observação**: O código frontend **DESABILITOU** o uso da tabela `evento_banda` devido a problemas de relacionamento.

#### Em `create_evento` Function:
```sql
-- A função suporta múltiplas bandas via array
CREATE OR REPLACE FUNCTION public.create_evento(
  p_banda_ids UUID[] DEFAULT NULL -- Array de IDs de banda
)

-- Insere relacionamentos em evento_banda
IF p_banda_ids IS NOT NULL THEN
  FOREACH v_banda_id IN ARRAY p_banda_ids
  LOOP
    INSERT INTO public.evento_banda (evento_id, banda_id)
    VALUES (v_evento_id, v_banda_id);
  END LOOP;
END IF;
```

### 4.2 Views do Sistema:

#### `vw_eventos_proximos` e `vw_eventos_todos`:
```sql
-- Usam APENAS o campo direto banda_id
SELECT 
  e.banda_id,
  b.nome as banda_nome
FROM public.evento e
LEFT JOIN public.banda b ON e.banda_id = b.id  -- Campo direto
-- NÃO usa evento_banda
```

---

## 5. Cenários de Conflito Identificados

### 5.1 Possíveis Estados dos Dados:

| Cenário | `evento.banda_id` | `evento_banda` | Status | Problema |
|---------|-------------------|----------------|--------|----------|
| A | `NULL` | Vazio | ✅ OK | Evento sem banda |
| B | `NULL` | Com registros | ⚠️ Inconsistente | Banda só via junção |
| C | Preenchido | Vazio | ⚠️ Inconsistente | Banda só via campo direto |
| D | Preenchido | Com registros | 🚨 **CONFLITO** | Duas fontes de verdade |

### 5.2 Sub-cenários do Conflito (Cenário D):

#### D1 - Mesma Banda:
- `evento.banda_id = 'banda-123'`
- `evento_banda.banda_id = 'banda-123'`
- **Impacto**: Redundância, mas dados consistentes

#### D2 - Bandas Diferentes:
- `evento.banda_id = 'banda-123'`
- `evento_banda.banda_id = 'banda-456'`
- **Impacto**: 🚨 **DADOS INCONSISTENTES** - Qual banda é a correta?

---

## 6. Impactos Identificados

### 6.1 No Frontend:
- ❌ Relacionamentos com `evento_banda` **DESABILITADOS**
- ⚠️ Apenas `banda_id` direto é usado nas views
- 🐛 Comentários indicam "TODO: fix schema relationships"

### 6.2 No Backend:
- ✅ Função `create_evento` suporta múltiplas bandas
- ❌ Views ignoram tabela `evento_banda`
- ⚠️ Inconsistência entre criação e consulta

### 6.3 Na Arquitetura:
- 🚨 **Duas fontes de verdade** para o mesmo relacionamento
- ⚠️ Lógica de negócio inconsistente
- 🐛 Potencial para dados órfãos

---

## 7. Queries para Diagnóstico

### 7.1 Queries Solicitadas:

```sql
-- 1. Eventos com banda_id preenchido
SELECT COUNT(*) FROM evento WHERE banda_id IS NOT NULL;

-- 2. Registros na tabela evento_banda
SELECT COUNT(*) FROM evento_banda;

-- 3. Eventos com registros em evento_banda
SELECT COUNT(DISTINCT e.id) 
FROM evento e 
JOIN evento_banda eb ON e.id = eb.evento_id;

-- 4. CONFLITO: Eventos com AMBOS
SELECT COUNT(*) 
FROM evento e
WHERE e.banda_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM evento_banda eb WHERE eb.evento_id = e.id);

-- 5. Detalhes dos conflitos
SELECT 
  e.id,
  e.titulo,
  e.banda_id as evento_banda_id,
  b1.nome as banda_direta,
  eb.banda_id as evento_banda_banda_id,
  b2.nome as banda_via_evento_banda,
  CASE 
    WHEN e.banda_id = eb.banda_id THEN 'MESMO_BANDA'
    ELSE 'BANDAS_DIFERENTES'
  END as status_conflito
FROM evento e
JOIN evento_banda eb ON e.id = eb.evento_id
LEFT JOIN banda b1 ON e.banda_id = b1.id
LEFT JOIN banda b2 ON eb.banda_id = b2.id
WHERE e.banda_id IS NOT NULL
ORDER BY e.titulo;
```

---

## 8. Recomendações de Resolução

### 8.1 Opção 1: Migrar para Relacionamento N:N (Recomendado)

**Vantagens**:
- ✅ Suporta múltiplas bandas por evento
- ✅ Mais flexível para casos futuros
- ✅ Função `create_evento` já implementada

**Passos**:
1. Migrar dados de `evento.banda_id` para `evento_banda`
2. Remover coluna `evento.banda_id`
3. Atualizar views para usar `evento_banda`
4. Reabilitar relacionamentos no frontend

### 8.2 Opção 2: Manter Relacionamento 1:1

**Vantagens**:
- ✅ Mais simples
- ✅ Views já implementadas
- ✅ Frontend já funciona

**Passos**:
1. Migrar dados de `evento_banda` para `evento.banda_id`
2. Remover tabela `evento_banda`
3. Simplificar função `create_evento`

### 8.3 Opção 3: Híbrida (Não Recomendado)

**Conceito**:
- `evento.banda_id`: Banda principal
- `evento_banda`: Bandas adicionais

**Problemas**:
- ❌ Complexidade desnecessária
- ❌ Confuso para desenvolvedores
- ❌ Propenso a erros

---

## 9. Próximos Passos

### 9.1 Imediatos:
1. ✅ **Executar queries de diagnóstico** para quantificar o problema
2. 📊 **Analisar dados existentes** para entender o impacto
3. 🎯 **Decidir estratégia** (Opção 1 ou 2)

### 9.2 Implementação:
1. 📝 **Criar migração** para resolver conflitos
2. 🔄 **Atualizar código** (views, frontend, funções)
3. 🧪 **Testar** em ambiente de desenvolvimento
4. 📋 **Documentar** a decisão arquitetural

---

## 10. Conclusão

**Status Atual**: 🚨 **ARQUITETURA INCONSISTENTE**

**Evidências**:
- Dois mecanismos para o mesmo relacionamento
- Frontend desabilitou funcionalidade devido ao conflito
- Views ignoram tabela de junção
- Comentários no código indicam problema conhecido

**Recomendação**: **Migrar para relacionamento N:N** (Opção 1) para suportar casos de uso mais complexos e manter a flexibilidade do sistema.

**Prioridade**: 🔥 **ALTA** - Impacta funcionalidade core do sistema