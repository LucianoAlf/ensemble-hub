# Observações de Segurança e Performance - RPCs do Modal de Eventos

## 🔒 Segurança e RLS (Row Level Security)

### Configuração Atual Necessária

Para que os RPCs funcionem corretamente, as seguintes políticas RLS devem estar ativas:

#### Tabela `evento`
```sql
-- Política para SELECT
CREATE POLICY "Users can view events from their tenant" ON public.evento
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Política para UPDATE
CREATE POLICY "Users can update events from their tenant" ON public.evento
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
```

#### Tabela `evento_banda`
```sql
-- Política para SELECT
CREATE POLICY "Users can view event-band relations from their tenant" ON public.evento_banda
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evento e 
      WHERE e.id = evento_banda.evento_id 
      AND e.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Política para INSERT
CREATE POLICY "Users can create event-band relations from their tenant" ON public.evento_banda
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evento e 
      WHERE e.id = evento_banda.evento_id 
      AND e.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Política para DELETE
CREATE POLICY "Users can delete event-band relations from their tenant" ON public.evento_banda
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.evento e 
      WHERE e.id = evento_banda.evento_id 
      AND e.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );
```

#### Tabela `banda`
```sql
-- Política para SELECT
CREATE POLICY "Users can view bands from their tenant" ON public.banda
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
```

#### Tabela `profiles`
```sql
-- Política para SELECT (próprio perfil)
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
```

### Por que SECURITY INVOKER?

1. **RLS Ativo**: Mantém todas as políticas de segurança ativas
2. **Contexto do Usuário**: Executa com as permissões do usuário autenticado
3. **Auditoria**: Logs mostram o usuário real que executou a operação
4. **Princípio do Menor Privilégio**: Não eleva privilégios desnecessariamente

### Validações Explícitas nos RPCs

Além do RLS, os RPCs incluem validações explícitas:

1. **Verificação de tenant_id**: Garante que o usuário tem um tenant válido
2. **Validação cruzada**: Verifica se evento e bandas pertencem ao mesmo tenant
3. **Mensagens de erro claras**: Facilita debugging e não vaza informações

## 📊 Índices Recomendados

### Índices Existentes (verificar se estão presentes)

```sql
-- Verificar índices existentes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY tablename, indexname;
```

### Índices Necessários para Performance

#### 1. Tabela `evento`
```sql
-- Índice composto para lookup por ID e tenant (mais eficiente)
CREATE INDEX IF NOT EXISTS idx_evento_id_tenant 
ON public.evento (id, tenant_id);

-- Índice para filtros por tenant
CREATE INDEX IF NOT EXISTS idx_evento_tenant 
ON public.evento (tenant_id);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_evento_inicio 
ON public.evento (inicio DESC);
```

#### 2. Tabela `evento_banda`
```sql
-- Índice composto para lookup eficiente (já deve existir como UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_evento_banda_unique 
ON public.evento_banda (evento_id, banda_id);

-- Índice reverso para lookup por banda
CREATE INDEX IF NOT EXISTS idx_evento_banda_banda 
ON public.evento_banda (banda_id);
```

#### 3. Tabela `banda`
```sql
-- Índice para filtros por tenant
CREATE INDEX IF NOT EXISTS idx_banda_tenant 
ON public.banda (tenant_id);

-- Índice composto para lookup por ID e tenant
CREATE INDEX IF NOT EXISTS idx_banda_id_tenant 
ON public.banda (id, tenant_id);
```

#### 4. Tabela `profiles`
```sql
-- Índice para lookup por auth.uid() (já deve existir como PK)
-- Índice para lookup por tenant_id
CREATE INDEX IF NOT EXISTS idx_profiles_tenant 
ON public.profiles (tenant_id);
```

### Verificação de Performance

```sql
-- Testar performance dos RPCs
EXPLAIN (ANALYZE, BUFFERS) 
SELECT public.get_evento_full('seu-evento-id-aqui');

EXPLAIN (ANALYZE, BUFFERS) 
SELECT public.update_evento_full(
  'seu-evento-id-aqui',
  'Título Teste',
  'show',
  '2024-03-15 20:00:00+00'::timestamp with time zone,
  NULL,
  'Local Teste',
  NULL,
  NULL,
  NULL,
  ARRAY['banda-id-aqui']::UUID[]
);
```

## 🚨 Pontos de Atenção

### 1. Conflito Arquitetural

O schema atual tem tanto `evento.banda_id` (1:1) quanto `evento_banda` (N:N). Os RPCs foram implementados para usar apenas a relação N:N (`evento_banda`), ignorando o campo `banda_id` da tabela `evento`.

**Recomendação**: Considere remover o campo `banda_id` da tabela `evento` em uma migração futura para evitar confusão.

### 2. Campos de Data/Hora

O RPC `update_evento_full` usa apenas `inicio` e `fim` (TIMESTAMP WITH TIME ZONE). Se existir um campo `hora` separado no schema, será necessário ajustar o RPC.

### 3. Validação de Tipos

Os RPCs assumem que:
- `orcamento` é NUMERIC
- `inicio`/`fim` são TIMESTAMP WITH TIME ZONE
- `banda_ids` é array de UUID

Verifique se os tipos no schema estão alinhados.

### 4. Tratamento de Erros

Os RPCs retornam erros específicos para:
- Usuário sem tenant_id
- Evento não encontrado
- Evento de outro tenant
- Banda não encontrada
- Banda de outro tenant

Esses erros devem ser tratados adequadamente no frontend.

## 🔧 Comandos de Verificação

### Verificar RLS Ativo
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles');
```

### Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('evento', 'evento_banda', 'banda', 'profiles')
ORDER BY tablename, policyname;
```

### Verificar Funções
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_evento_full', 'update_evento_full');
```

## 📝 Checklist de Implementação

- [ ] Aplicar migração com os RPCs
- [ ] Verificar se RLS está ativo em todas as tabelas
- [ ] Confirmar políticas RLS adequadas
- [ ] Criar índices recomendados (se não existirem)
- [ ] Executar casos de teste SQL
- [ ] Verificar performance com EXPLAIN ANALYZE
- [ ] Testar no frontend com dados reais
- [ ] Configurar monitoramento de erros
- [ ] Documentar para a equipe

## 🎯 Próximos Passos

1. **Aplicar a migração**: `supabase db push`
2. **Executar testes**: Usar o arquivo `test_event_modal_rpcs.sql`
3. **Verificar performance**: Analisar planos de execução
4. **Integrar no frontend**: Atualizar hooks e componentes
5. **Monitorar em produção**: Configurar alertas para erros