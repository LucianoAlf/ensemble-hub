# Plano de Melhoria - Modal de Nova Receita

## 1. Análise do Estado Atual

### 1.1 Componente Principal
- **Arquivo**: `UpsertIncomeDrawer.tsx`
- **Localização**: Modal drawer para criação/edição de receitas
- **Funcionalidade**: Formulário com campos para categoria, evento, banda, valores e observações

### 1.2 Problemas Identificados

#### Dados Mockados
- **Bandas**: Valores fixos "banda1", "banda2" no SelectItem
- **Eventos**: Valores fixos "evento1", "evento2" no SelectItem
- **Categorias**: Dados mockados "show", "ensaio", "gravacao"

#### Problemas de UX
- Layout pode ser otimizado para melhor fluxo
- Falta feedback visual claro durante ações
- Validações podem ser melhoradas
- Botão de salvamento precisa ser mais visível

#### Integração
- Não utiliza dados reais do banco de dados
- Desconectado do padrão estabelecido em outras páginas

## 2. Padrões do Projeto Identificados

### 2.1 Hook de Dados
- **useSupabaseOptimized**: Hook principal para queries
- **Cache**: Sistema de cache com TTL configurável
- **Error Handling**: Tratamento padronizado de erros com toasts

### 2.2 Estrutura de Dados
- **Bandas**: View `vw_bandas_lista` com campos `id`, `nome`, `genero`, `descricao`
- **Eventos**: Tabela `evento` com campos `id`, `titulo`, `tipo`, `inicio`, `fim`
- **Query Pattern**: Uso de `querySupabase` com cache e abort signals

### 2.3 Padrão de Componentes
- **Loading States**: Skeleton/spinner durante carregamento
- **Error States**: Toast notifications para erros
- **Empty States**: Mensagens quando não há dados

## 3. Estratégia de Integração com Dados Reais

### 3.1 Hook para Bandas
```typescript
// Novo hook: useBands
const useBands = () => {
  const { query } = useSupabaseOptimized();
  
  return useCallback(async () => {
    return await query(
      async ({ client }) => 
        client
          .from("vw_bandas_lista")
          .select("id, nome, genero")
          .order("nome", { ascending: true }),
      {
        cache: {
          enabled: true,
          ttlMs: 300000, // 5 minutos
          key: "bands:select-list",
        },
      }
    );
  }, [query]);
};
```

### 3.2 Hook para Eventos
```typescript
// Novo hook: useEvents
const useEvents = () => {
  const { query } = useSupabaseOptimized();
  
  return useCallback(async () => {
    return await query(
      async ({ client }) => 
        client
          .from("evento")
          .select("id, titulo, tipo, inicio")
          .gte("inicio", new Date().toISOString())
          .order("inicio", { ascending: true }),
      {
        cache: {
          enabled: true,
          ttlMs: 300000,
          key: "events:select-list",
        },
      }
    );
  }, [query]);
};
```

### 3.3 Integração no Modal
- Substituir dados mockados por hooks reais
- Implementar loading states nos selects
- Adicionar tratamento de erro
- Manter compatibilidade com schema existente

## 4. Melhorias de UX Propostas

### 4.1 Layout e Organização
- **Agrupamento Lógico**: Organizar campos em seções visuais
- **Fluxo Sequencial**: Ordem lógica de preenchimento
- **Espaçamento**: Melhor uso do espaço vertical
- **Responsividade**: Otimização para diferentes tamanhos de tela

### 4.2 Feedback Visual
- **Loading States**: Skeleton nos selects durante carregamento
- **Success Feedback**: Toast de sucesso após salvamento
- **Error Feedback**: Mensagens de erro específicas
- **Progress Indication**: Indicador de progresso durante salvamento

### 4.3 Validações em Tempo Real
- **Campo Obrigatório**: Validação imediata de campos obrigatórios
- **Formato de Valores**: Validação de formato monetário
- **Datas**: Validação de datas válidas
- **Dependências**: Validação de campos dependentes

### 4.4 Botão de Salvamento
- **Visibilidade**: Posição fixa e destacada
- **Estados**: Loading, disabled, enabled
- **Atalhos**: Suporte a Ctrl+S
- **Confirmação**: Feedback claro de ação realizada

## 5. Plano de Implementação

### 5.1 Fase 1: Preparação (Estimativa: 2h)
- [ ] Criar hooks `useBands` e `useEvents`
- [ ] Testar hooks isoladamente
- [ ] Verificar compatibilidade com dados existentes
- [ ] Backup do componente atual

### 5.2 Fase 2: Integração de Dados (Estimativa: 3h)
- [ ] Substituir dados mockados de bandas
- [ ] Substituir dados mockados de eventos
- [ ] Implementar loading states
- [ ] Adicionar tratamento de erro
- [ ] Testar integração completa

### 5.3 Fase 3: Melhorias de UX (Estimativa: 4h)
- [ ] Reorganizar layout do formulário
- [ ] Implementar validações em tempo real
- [ ] Melhorar botão de salvamento
- [ ] Adicionar feedback visual
- [ ] Otimizar fluxo de preenchimento

### 5.4 Fase 4: Testes e Validação (Estimativa: 2h)
- [ ] Teste de integração com backend
- [ ] Teste de compatibilidade com páginas existentes
- [ ] Teste de performance
- [ ] Validação de UX
- [ ] Documentação de mudanças

## 6. Critérios de Aceite

### 6.1 Funcionalidade
- [ ] Bandas carregadas do banco de dados real
- [ ] Eventos carregados do banco de dados real
- [ ] Salvamento funcional e integrado
- [ ] Validações funcionando corretamente
- [ ] Compatibilidade mantida com backend

### 6.2 UX/UI
- [ ] Layout intuitivo e organizado
- [ ] Feedback visual claro em todas as ações
- [ ] Loading states implementados
- [ ] Botão de salvamento visível e funcional
- [ ] Validações em tempo real

### 6.3 Performance
- [ ] Carregamento rápido dos dados
- [ ] Cache funcionando adequadamente
- [ ] Sem impacto negativo em outras páginas
- [ ] Responsividade mantida

## 7. Riscos e Mitigações

### 7.1 Riscos Identificados

#### Alto Risco
- **Quebra de Integração**: Mudanças podem afetar salvamento
  - *Mitigação*: Testes extensivos e backup do código atual

#### Médio Risco
- **Performance**: Queries adicionais podem impactar performance
  - *Mitigação*: Uso adequado de cache e otimização de queries

- **Compatibilidade**: Mudanças podem afetar outras funcionalidades
  - *Mitigação*: Implementação incremental e testes de regressão

#### Baixo Risco
- **UX**: Mudanças de layout podem confundir usuários
  - *Mitigação*: Manter padrões estabelecidos e testar usabilidade

### 7.2 Plano de Rollback
- Backup completo do componente atual
- Versionamento de mudanças por fase
- Possibilidade de reverter mudanças específicas
- Testes de rollback antes da implementação

## 8. Arquivos Afetados

### 8.1 Principais
- `src/components/financial/UpsertIncomeDrawer.tsx` - Componente principal
- `src/hooks/useBands.ts` - Novo hook (a criar)
- `src/hooks/useEvents.ts` - Novo hook (a criar)

### 8.2 Possíveis Dependências
- `src/hooks/useSupabaseOptimized.ts` - Hook base para queries
- `src/integrations/supabase/types.ts` - Tipos TypeScript
- Componentes de UI relacionados (Select, Button, etc.)

## 9. Considerações Técnicas

### 9.1 Padrões a Seguir
- Usar TypeScript strict
- Manter padrão de error handling
- Seguir convenções de nomenclatura
- Implementar loading e error states
- Usar cache adequadamente

### 9.2 Performance
- Cache de 5 minutos para dados de bandas e eventos
- Lazy loading quando apropriado
- Debounce em validações em tempo real
- Otimização de re-renders

### 9.3 Acessibilidade
- Manter labels adequados
- Suporte a navegação por teclado
- Feedback para screen readers
- Contraste adequado

## 10. Próximos Passos

1. **Aprovação do Plano**: Aguardar aprovação antes de iniciar implementação
2. **Setup do Ambiente**: Preparar branch de desenvolvimento
3. **Implementação Fase 1**: Criar hooks de dados
4. **Validação Incremental**: Testar cada fase antes de prosseguir
5. **Deploy Gradual**: Implementar em ambiente de teste primeiro

---

**Tempo Total Estimado**: 11 horas
**Complexidade**: Média
**Impacto**: Alto (melhoria significativa na UX e integração de dados)
**Risco**: Baixo a Médio (com mitigações adequadas)