# ✅ CHECKLIST DE VERIFICAÇÃO - Mudança p_descricao → p_observacoes

## 🎯 Pré-Aplicação

### Backup e Segurança
- [ ] **Backup da base de dados criado**
- [ ] **Ambiente de desenvolvimento testado**
- [ ] **Verificar se não há transações ativas usando a função**

### Validação de Dependências
- [ ] **Verificar se há jobs/scripts automatizados usando a função**
- [ ] **Confirmar que frontend usa apenas chamadas posicionais**

## 🔧 Aplicação do Patch

### 1. Aplicar Migração
```bash
# Aplicar o patch
git apply patch_migration_p_observacoes.diff

# Verificar mudanças
git diff supabase/migrations/20250127000001_create_event_modal_rpcs.sql

# Aplicar migração
npx supabase db push
```

- [ ] **Patch aplicado sem erros**
- [ ] **Migração executada com sucesso**
- [ ] **Sem erros no log do Supabase**

### 2. Verificar Assinatura da Função
```sql
-- Executar no Supabase SQL Editor
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_evento_full';
```

- [ ] **Função existe e está ativa**
- [ ] **Parâmetro p_observacoes presente na assinatura**
- [ ] **SECURITY INVOKER mantido**

## 🧪 Testes Funcionais

### 3. Teste de Chamada Básica
```sql
-- Teste com dados mínimos
SELECT public.update_evento_full(
  'evento-id-teste',
  'Título Teste',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local Teste',
  NULL,
  NULL,
  'Observações de teste',  -- 9º parâmetro (p_observacoes)
  '{}'
);
```

- [ ] **Chamada executada sem erro**
- [ ] **Retorno JSON válido**
- [ ] **Campo 'descricao' atualizado corretamente**

### 4. Teste de Validação de Segurança
```sql
-- Teste com evento de outro tenant (deve falhar)
SELECT public.update_evento_full(
  'evento-outro-tenant',
  'Hack Test',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local',
  NULL,
  NULL,
  'Teste hack',
  '{}'
);
```

- [ ] **Erro de segurança retornado corretamente**
- [ ] **Mensagem: "Acesso negado: evento pertence a outro tenant"**

### 5. Teste com Bandas
```sql
-- Teste com array de bandas
SELECT public.update_evento_full(
  'evento-id-teste',
  'Evento com Bandas',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  '2024-03-16 00:00:00+00'::timestamp with time zone,
  'Local Teste',
  'Endereço Teste',
  1500.00,
  'Observações do evento com bandas',
  ARRAY['banda-id-1', 'banda-id-2']::UUID[]
);
```

- [ ] **Relacionamentos N:N criados corretamente**
- [ ] **JSON retornado inclui array de bandas**
- [ ] **Dados persistidos na tabela evento_banda**

## 🔍 Verificações de Integridade

### 6. Verificar Dados na Tabela
```sql
-- Verificar se dados foram salvos corretamente
SELECT 
  id,
  titulo,
  descricao,  -- Campo da tabela (não mudou)
  updated_at
FROM public.evento 
WHERE titulo LIKE '%Teste%'
ORDER BY updated_at DESC;
```

- [ ] **Campo 'descricao' contém o valor passado em p_observacoes**
- [ ] **Timestamp updated_at atualizado**
- [ ] **Outros campos mantidos corretamente**

### 7. Verificar Relacionamentos
```sql
-- Verificar relacionamentos evento_banda
SELECT 
  eb.evento_id,
  eb.banda_id,
  e.titulo,
  b.nome
FROM public.evento_banda eb
JOIN public.evento e ON eb.evento_id = e.id
JOIN public.banda b ON eb.banda_id = b.id
WHERE e.titulo LIKE '%Teste%';
```

- [ ] **Relacionamentos corretos criados**
- [ ] **Relacionamentos antigos removidos (se aplicável)**
- [ ] **Sem duplicatas**

## 🌐 Testes de Integração Frontend

### 8. Teste via Interface (se aplicável)
- [ ] **Modal de edição de evento abre corretamente**
- [ ] **Campos carregam dados existentes**
- [ ] **Salvamento funciona sem erros**
- [ ] **Dados aparecem atualizados na interface**

## 📊 Verificações de Performance

### 9. Análise de Performance
```sql
-- Verificar plano de execução
EXPLAIN (ANALYZE, BUFFERS) 
SELECT public.update_evento_full(
  'evento-id-teste',
  'Performance Test',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local',
  NULL,
  NULL,
  'Teste de performance',
  ARRAY['banda-id-1']::UUID[]
);
```

- [ ] **Tempo de execução aceitável (< 100ms)**
- [ ] **Sem table scans desnecessários**
- [ ] **Índices sendo utilizados corretamente**

## 🚨 Rollback (se necessário)

### 10. Plano de Rollback
```sql
-- Se algo der errado, reverter:
CREATE OR REPLACE FUNCTION public.update_evento_full(
  p_evento_id UUID,
  p_titulo TEXT,
  p_tipo TEXT,
  p_inicio TIMESTAMP WITH TIME ZONE,
  p_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_local TEXT,
  p_endereco TEXT DEFAULT NULL,
  p_orcamento NUMERIC DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL,  -- ← Voltar para p_descricao
  p_banda_ids UUID[] DEFAULT '{}'
)
-- ... resto da função igual
```

- [ ] **Script de rollback preparado**
- [ ] **Backup testado e funcional**

## ✅ Conclusão

### Status Final
- [ ] **Todos os testes passaram**
- [ ] **Performance mantida**
- [ ] **Segurança validada**
- [ ] **Integração frontend funcionando**
- [ ] **Documentação atualizada**

### Próximos Passos
- [ ] **Monitorar logs por 24h**
- [ ] **Verificar métricas de erro**
- [ ] **Comunicar mudança para equipe**
- [ ] **Atualizar documentação técnica**

---

**⚠️ IMPORTANTE**: Se qualquer item falhar, considere fazer rollback imediatamente e revisar a necessidade da mudança conforme documentado em `RISCOS_MUDANCA_P_OBSERVACOES.md`.