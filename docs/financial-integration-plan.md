# Plano de Integração Financeira - Backend e Frontend

## 1. Análise das Tabelas Financeiras

### 1.1 Tabela `financeiro`
**Estrutura:**
```sql
CREATE TABLE public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  evento_id UUID REFERENCES public.evento(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_transacao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Status:** Vazia (0 registros)
**Propósito:** Controle básico de receitas e despesas por evento
**Relacionamentos:** 
- `evento_id` → `evento.id`
- Isolamento por `tenant_id`

### 1.2 Tabela `transactions`
**Estrutura:**
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type TEXT CHECK (type IN ('income','expense')) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  banda_id UUID REFERENCES public.banda(id),
  evento_id UUID REFERENCES public.evento(id),
  counterparty TEXT,
  gross_amount NUMERIC NOT NULL,
  fee_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC GENERATED ALWAYS AS (gross_amount - fee_amount) STORED,
  status TEXT CHECK (status IN ('pending','scheduled','settled')) DEFAULT 'pending',
  transaction_date DATE NOT NULL,
  settled_at TIMESTAMPTZ,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Status:** Vazia (0 registros)
**Propósito:** Sistema avançado de transações financeiras
**Relacionamentos:**
- `banda_id` → `banda.id`
- `evento_id` → `evento.id`
- Isolamento por `tenant_id`

### 1.3 Tabela `payouts`
**Estrutura:**
```sql
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  evento_id UUID NOT NULL REFERENCES public.evento(id),
  transaction_id UUID REFERENCES public.transactions(id),
  beneficiary_type TEXT CHECK (beneficiary_type IN ('band','member','crew','manager')) NOT NULL,
  beneficiary_name TEXT NOT NULL,
  beneficiary_id TEXT,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending','settled')) DEFAULT 'pending',
  payment_method TEXT,
  settled_at TIMESTAMPTZ,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Status:** Vazia (0 registros)
**Propósito:** Gestão de cachês e repasses
**Relacionamentos:**
- `evento_id` → `evento.id`
- `transaction_id` → `transactions.id`
- Isolamento por `tenant_id`

## 2. Design de Endpoints CRUD

### 2.1 Endpoints para `transactions`

#### GET /api/transactions
**Parâmetros de Query:**
- `tenant_id` (obrigatório)
- `banda_id` (opcional)
- `evento_id` (opcional)
- `type` (opcional): 'income' | 'expense'
- `status` (opcional): 'pending' | 'scheduled' | 'settled'
- `category` (opcional)
- `date_from` (opcional)
- `date_to` (opcional)
- `page` (opcional, padrão: 1)
- `limit` (opcional, padrão: 50)

**Resposta:**
```typescript
interface TransactionsResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
  };
}
```

#### POST /api/transactions
**Body:**
```typescript
interface CreateTransactionRequest {
  tenant_id: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  banda_id?: string;
  evento_id?: string;
  counterparty?: string;
  gross_amount: number;
  fee_amount?: number;
  transaction_date: string; // ISO date
  attachment_url?: string;
}
```

**Validações:**
- `gross_amount` > 0
- `fee_amount` >= 0 e <= `gross_amount`
- `transaction_date` não pode ser futuro distante (> 1 ano)
- `tenant_id` deve existir e usuário deve ter acesso
- `banda_id` e `evento_id` devem pertencer ao mesmo tenant

#### PUT /api/transactions/:id
**Body:** Mesmo que POST, mas todos os campos opcionais
**Validações:** Mesmas do POST + verificação de existência

#### DELETE /api/transactions/:id
**Validações:**
- Transação deve existir
- Usuário deve ter permissão no tenant
- Não pode deletar transações já liquidadas (`status = 'settled'`)

### 2.2 Endpoints para `payouts`

#### GET /api/payouts
**Parâmetros de Query:**
- `tenant_id` (obrigatório)
- `evento_id` (opcional)
- `beneficiary_type` (opcional)
- `status` (opcional)
- `due_date_from` (opcional)
- `due_date_to` (opcional)
- `page` (opcional)
- `limit` (opcional)

#### POST /api/payouts
**Body:**
```typescript
interface CreatePayoutRequest {
  tenant_id: string;
  evento_id: string;
  transaction_id?: string;
  beneficiary_type: 'band' | 'member' | 'crew' | 'manager';
  beneficiary_name: string;
  beneficiary_id?: string;
  amount: number;
  due_date: string;
  payment_method?: string;
  notes?: string;
}
```

**Validações:**
- `amount` > 0
- `evento_id` deve existir e pertencer ao tenant
- `transaction_id` (se fornecido) deve existir e pertencer ao tenant
- `due_date` não pode ser no passado

### 2.3 Endpoints para `financeiro`

#### GET /api/financeiro
**Parâmetros de Query:**
- `tenant_id` (obrigatório)
- `evento_id` (opcional)
- `tipo` (opcional): 'receita' | 'despesa'
- `data_from` (opcional)
- `data_to` (opcional)

#### POST /api/financeiro
**Body:**
```typescript
interface CreateFinanceiroRequest {
  tenant_id: string;
  evento_id?: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  descricao?: string;
  data_transacao?: string;
}
```

## 3. Sincronização em Tempo Real

### 3.1 Configuração do Supabase Realtime

**Canais de Subscrição:**
```typescript
// Canal para transactions
const transactionsChannel = supabase
  .channel('transactions-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'transactions',
    filter: `tenant_id=eq.${tenantId}`
  }, handleTransactionChange)
  .subscribe();

// Canal para payouts
const payoutsChannel = supabase
  .channel('payouts-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payouts',
    filter: `tenant_id=eq.${tenantId}`
  }, handlePayoutChange)
  .subscribe();

// Canal para financeiro
const financeiroChannel = supabase
  .channel('financeiro-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'financeiro',
    filter: `tenant_id=eq.${tenantId}`
  }, handleFinanceiroChange)
  .subscribe();
```

### 3.2 Handlers de Mudança

```typescript
interface RealtimeHandler {
  handleTransactionChange: (payload: RealtimePayload) => void;
  handlePayoutChange: (payload: RealtimePayload) => void;
  handleFinanceiroChange: (payload: RealtimePayload) => void;
}

const realtimeHandlers: RealtimeHandler = {
  handleTransactionChange: (payload) => {
    switch (payload.eventType) {
      case 'INSERT':
        // Adicionar nova transação à lista
        // Atualizar métricas do dashboard
        break;
      case 'UPDATE':
        // Atualizar transação existente
        // Recalcular totais se necessário
        break;
      case 'DELETE':
        // Remover transação da lista
        // Atualizar métricas
        break;
    }
  },
  // ... outros handlers
};
```

## 4. Validação de Dados

### 4.1 Schemas de Validação (Zod)

```typescript
import { z } from 'zod';

// Schema para Transaction
export const TransactionSchema = z.object({
  tenant_id: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  banda_id: z.string().uuid().optional(),
  evento_id: z.string().uuid().optional(),
  counterparty: z.string().max(200).optional(),
  gross_amount: z.number().positive(),
  fee_amount: z.number().min(0).optional(),
  transaction_date: z.string().datetime(),
  attachment_url: z.string().url().optional(),
}).refine((data) => {
  if (data.fee_amount && data.fee_amount > data.gross_amount) {
    return false;
  }
  return true;
}, {
  message: "Fee amount cannot be greater than gross amount"
});

// Schema para Payout
export const PayoutSchema = z.object({
  tenant_id: z.string().uuid(),
  evento_id: z.string().uuid(),
  transaction_id: z.string().uuid().optional(),
  beneficiary_type: z.enum(['band', 'member', 'crew', 'manager']),
  beneficiary_name: z.string().min(1).max(200),
  beneficiary_id: z.string().max(100).optional(),
  amount: z.number().positive(),
  due_date: z.string().datetime(),
  payment_method: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => {
  const dueDate = new Date(data.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate >= today;
}, {
  message: "Due date cannot be in the past"
});

// Schema para Financeiro
export const FinanceiroSchema = z.object({
  tenant_id: z.string().uuid(),
  evento_id: z.string().uuid().optional(),
  tipo: z.enum(['receita', 'despesa']),
  valor: z.number().positive(),
  descricao: z.string().max(500).optional(),
  data_transacao: z.string().datetime().optional(),
});
```

### 4.2 Middleware de Validação

```typescript
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};
```

## 5. Segurança e Autorização

### 5.1 Middleware de Autenticação

```typescript
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

### 5.2 Middleware de Autorização por Tenant

```typescript
export const authorizeTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.body.tenant_id || req.query.tenant_id;
    const userId = req.user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Verificar se o usuário pertence ao tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!profile) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Authorization failed' });
  }
};
```

## 6. Tratamento de Erros

### 6.1 Classes de Erro Customizadas

```typescript
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

### 6.2 Handler Global de Erros

```typescript
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.message,
      details: error.details
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: error.message
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(403).json({
      error: error.message
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Internal server error'
  });
};
```

## 7. Próximos Passos

1. **Implementar os endpoints** seguindo este design
2. **Configurar sincronização em tempo real** no frontend
3. **Migrar dados mockados** para usar os endpoints reais
4. **Implementar testes** para cada endpoint
5. **Documentar APIs** com Swagger/OpenAPI
6. **Configurar monitoramento** e logs

## 8. Considerações de Performance

- **Paginação**: Implementar em todas as listagens
- **Índices**: Verificar se os índices existentes são suficientes
- **Cache**: Considerar cache para métricas do dashboard
- **Batch Operations**: Para operações em massa
- **Rate Limiting**: Implementar para prevenir abuso

## 9. Monitoramento e Logs

- **Logs estruturados** para todas as operações
- **Métricas** de performance dos endpoints
- **Alertas** para erros críticos
- **Dashboard** de monitoramento das operações financeiras