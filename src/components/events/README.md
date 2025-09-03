# EventEditModal Component

Modal para edição e visualização de eventos no sistema Ensemble Hub.

## Funcionalidades

### ✅ Principais Recursos
- **Edição e Visualização**: Suporte para modos de edição e visualização
- **Carregamento Robusto**: Sistema de retry automático para carregamento de dados
- **Validação em Tempo Real**: Validação de formulário com feedback imediato
- **Estados de Loading**: Indicadores granulares para carregamento e salvamento
- **Tratamento de Erros**: Mensagens de erro específicas e ações de recuperação
- **Performance Otimizada**: Uso de `useMemo` e `useCallback` para evitar re-renders

### 🔧 Melhorias Implementadas

#### 1. Sistema de Retry Robusto
- Máximo de 3 tentativas de carregamento
- Delay progressivo entre tentativas
- Fallback para consulta direta em caso de erro de RPC
- Indicadores visuais de progresso

#### 2. Validação de Formulário
- Validação de campos obrigatórios (nome, data, tipo, local)
- Validação de formato de data (não pode ser no passado)
- Validação de formato de hora (HH:MM)
- Validação de orçamento (deve ser numérico)
- Feedback visual imediato

#### 3. Estados de Loading Granulares
- `isLoadingData`: Carregamento inicial dos dados
- `isSaving`: Processo de salvamento
- `isRetrying`: Tentativas de retry
- Desabilitação apropriada de campos e botões

#### 4. Tratamento de Erros Melhorado
- Diferenciação entre erros de carregamento e salvamento
- Mensagens específicas para cada tipo de erro
- Ações de recuperação (retry, fechar erro)
- Telemetria para debugging

#### 5. Otimizações de Performance
- Memoização de funções com `useCallback`
- Memoização de valores computados com `useMemo`
- Prevenção de re-renders desnecessários
- Debounce para operações custosas

## Interface

```typescript
interface EventEditModalProps {
  /** ID do evento a ser editado */
  eventId: string;
  /** Modo de operação do modal */
  mode?: 'edit' | 'view';
  /** Controla se o modal está aberto */
  open: boolean;
  /** Callback chamado quando o estado de abertura muda */
  onOpenChange: (open: boolean) => void;
  /** Callback opcional chamado após atualização bem-sucedida */
  onEventUpdated?: (eventId: string) => void;
}
```

## Uso

```tsx
import { EventEditModal } from '@/components/events/eventeditmodal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [eventId, setEventId] = useState<string>('');

  const handleEventUpdated = (id: string) => {
    console.log('Evento atualizado:', id);
    // Atualizar lista de eventos, etc.
  };

  return (
    <EventEditModal
      eventId={eventId}
      mode="edit"
      open={isOpen}
      onOpenChange={setIsOpen}
      onEventUpdated={handleEventUpdated}
    />
  );
}
```

## Dependências

### Componentes de UI
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` - Modal base
- `Button` - Botões de ação
- `Input`, `Textarea` - Campos de entrada
- `Select` - Seleção de tipo de evento
- `Alert`, `AlertDescription` - Exibição de erros
- `Skeleton` - Estados de carregamento

### Componentes Customizados
- `DatePicker` - Seleção de data
- `TimePicker` - Seleção de hora
- `LocationPicker` - Seleção de local
- `BandPicker` - Seleção de bandas

### Hooks e Utilitários
- `useToast` - Notificações
- `useQueryClient` - Cache de dados
- `createClient` - Cliente Supabase
- `format` - Formatação de datas

## Estrutura de Dados

### Evento
```typescript
interface Event {
  id: string;
  nome: string;
  tipo: 'show' | 'ensaio' | 'gravacao' | 'outro';
  data_evento: string; // YYYY-MM-DD
  hora_evento: string; // HH:MM:SS
  local: string;
  endereco?: string;
  orcamento?: number;
  descricao?: string;
  bandas: Band[];
}
```

### Banda
```typescript
interface Band {
  id: string;
  nome: string;
  // outros campos...
}
```

## Fluxo de Dados

1. **Abertura do Modal**: Carrega dados do evento via RPC `get_evento_full`
2. **Retry em Caso de Erro**: Tenta novamente até 3 vezes com delay
3. **Fallback**: Se RPC falhar, usa consulta direta à tabela
4. **Validação**: Valida campos em tempo real
5. **Salvamento**: Usa RPC `update_evento_full` para persistir alterações
6. **Feedback**: Exibe toast de sucesso/erro e chama callback

## Testes

O componente possui testes unitários abrangentes em `__tests__/eventeditmodal.test.tsx`:

- ✅ Renderização do modal
- ✅ Carregamento de dados
- ✅ Validação de formulário
- ✅ Sistema de retry
- ✅ Tratamento de erros
- ✅ Estados de loading
- ✅ Modos de edição/visualização

### Executar Testes

```bash
npm test eventeditmodal
```

## Telemetria

O componente registra eventos para análise:

- `event_modal.open` - Abertura do modal
- `event_modal.load.ok` - Carregamento bem-sucedido
- `event_modal.load.error` - Erro de carregamento
- `event_modal.save.ok` - Salvamento bem-sucedido
- `event_modal.save.error` - Erro de salvamento
- `event_modal.retry` - Tentativa de retry

## Considerações de Performance

- **Memoização**: Funções e valores são memoizados para evitar re-renders
- **Debounce**: Operações custosas são debounced
- **Lazy Loading**: Componentes são carregados sob demanda
- **Cache**: Dados são cacheados via React Query

## Acessibilidade

- **Foco**: Gerenciamento adequado de foco no modal
- **ARIA**: Labels e descrições apropriadas
- **Teclado**: Navegação completa via teclado
- **Screen Readers**: Compatibilidade com leitores de tela

## Próximos Passos

- [ ] Implementar histórico de alterações
- [ ] Adicionar suporte a anexos
- [ ] Melhorar validação de conflitos de agenda
- [ ] Implementar modo offline
- [ ] Adicionar mais opções de telemetria