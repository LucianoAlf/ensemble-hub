# Estratégia de Testes - Sistema Financeiro

## Visão Geral

Este documento define a estratégia abrangente de testes para o sistema financeiro integrado, cobrindo testes de integridade de dados, performance e segurança.

## 1. Testes de Integridade de Dados

### 1.1 Testes Unitários

#### Validação de Esquemas (Zod)
```typescript
// tests/financial/validation.test.ts
describe('Financial Data Validation', () => {
  describe('Transaction Schema', () => {
    it('should validate valid transaction data', () => {
      const validTransaction = {
        type: 'income',
        status: 'pending',
        category: 'performance',
        gross_amount: 1000,
        net_amount: 850,
        transaction_date: new Date(),
        payment_method: 'bank_transfer',
        description: 'Show payment'
      };
      expect(() => transactionSchema.parse(validTransaction)).not.toThrow();
    });

    it('should reject invalid transaction data', () => {
      const invalidTransaction = {
        type: 'invalid_type',
        gross_amount: -100, // Valor negativo inválido
        net_amount: 1000 // Net maior que gross
      };
      expect(() => transactionSchema.parse(invalidTransaction)).toThrow();
    });
  });
});
```

#### Funções de Cálculo
```typescript
// tests/financial/calculations.test.ts
describe('Financial Calculations', () => {
  it('should calculate net amount correctly', () => {
    const grossAmount = 1000;
    const feePercentage = 15;
    const expectedNet = 850;
    
    expect(calculateNetAmount(grossAmount, feePercentage)).toBe(expectedNet);
  });

  it('should handle edge cases in calculations', () => {
    expect(calculateNetAmount(0, 15)).toBe(0);
    expect(calculateNetAmount(100, 0)).toBe(100);
    expect(calculateNetAmount(100, 100)).toBe(0);
  });
});
```

### 1.2 Testes de Integração

#### CRUD Operations
```typescript
// tests/financial/crud.test.ts
describe('Financial CRUD Operations', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestDatabase();
  });

  describe('Transactions', () => {
    it('should create transaction with valid data', async () => {
      const transactionData = createValidTransactionData();
      const result = await createTransaction(transactionData);
      
      expect(result.id).toBeDefined();
      expect(result.tenant_id).toBe(transactionData.tenant_id);
      expect(result.created_at).toBeDefined();
    });

    it('should update transaction preserving audit trail', async () => {
      const transaction = await createTestTransaction();
      const updateData = { description: 'Updated description' };
      
      const updated = await updateTransaction(transaction.id, updateData);
      
      expect(updated.description).toBe(updateData.description);
      expect(updated.updated_at).not.toBe(transaction.updated_at);
    });

    it('should soft delete transaction', async () => {
      const transaction = await createTestTransaction();
      
      await deleteTransaction(transaction.id);
      
      const deleted = await getTransaction(transaction.id);
      expect(deleted).toBeNull();
    });
  });
});
```

#### Sincronização em Tempo Real
```typescript
// tests/financial/realtime.test.ts
describe('Real-time Synchronization', () => {
  it('should receive real-time updates on transaction changes', async () => {
    const mockCallback = jest.fn();
    const subscription = subscribeToTransactions(mockCallback);
    
    // Create a new transaction
    const newTransaction = await createTransaction(validTransactionData);
    
    // Wait for real-time update
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        new: expect.objectContaining({ id: newTransaction.id })
      });
    });
    
    subscription.unsubscribe();
  });
});
```

### 1.3 Testes de Consistência de Dados

#### Relacionamentos e Constraints
```typescript
// tests/financial/consistency.test.ts
describe('Data Consistency', () => {
  it('should maintain referential integrity', async () => {
    const transaction = await createTestTransaction();
    
    // Tentar deletar tenant que tem transações
    await expect(deleteTenant(transaction.tenant_id))
      .rejects.toThrow('Cannot delete tenant with existing transactions');
  });

  it('should enforce business rules', async () => {
    // Net amount não pode ser maior que gross amount
    const invalidData = {
      gross_amount: 100,
      net_amount: 150
    };
    
    await expect(createTransaction(invalidData))
      .rejects.toThrow('Net amount cannot exceed gross amount');
  });
});
```

## 2. Testes de Performance

### 2.1 Testes de Carga

#### Operações CRUD em Volume
```typescript
// tests/performance/load.test.ts
describe('Performance Load Tests', () => {
  it('should handle bulk transaction creation', async () => {
    const startTime = Date.now();
    const transactionCount = 1000;
    
    const promises = Array.from({ length: transactionCount }, () => 
      createTransaction(generateRandomTransactionData())
    );
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Deve processar 1000 transações em menos de 10 segundos
    expect(duration).toBeLessThan(10000);
  });

  it('should maintain performance with large datasets', async () => {
    // Criar 10,000 transações de teste
    await createBulkTestTransactions(10000);
    
    const startTime = Date.now();
    
    // Buscar transações com filtros
    const results = await getTransactions({
      status: 'settled',
      limit: 50,
      offset: 0
    });
    
    const endTime = Date.now();
    const queryTime = endTime - startTime;
    
    // Query deve executar em menos de 500ms
    expect(queryTime).toBeLessThan(500);
    expect(results.length).toBeLessThanOrEqual(50);
  });
});
```

### 2.2 Testes de Memória

```typescript
// tests/performance/memory.test.ts
describe('Memory Usage Tests', () => {
  it('should not leak memory during real-time subscriptions', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Criar múltiplas subscriptions
    const subscriptions = Array.from({ length: 100 }, () => 
      subscribeToTransactions(() => {})
    );
    
    // Simular atividade
    for (let i = 0; i < 100; i++) {
      await createTransaction(generateRandomTransactionData());
    }
    
    // Cleanup subscriptions
    subscriptions.forEach(sub => sub.unsubscribe());
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Aumento de memória deve ser mínimo (< 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 2.3 Testes de Concorrência

```typescript
// tests/performance/concurrency.test.ts
describe('Concurrency Tests', () => {
  it('should handle concurrent updates without data corruption', async () => {
    const transaction = await createTestTransaction();
    
    // Múltiplas atualizações simultâneas
    const updatePromises = Array.from({ length: 10 }, (_, index) => 
      updateTransaction(transaction.id, {
        description: `Update ${index}`,
        updated_at: new Date()
      })
    );
    
    const results = await Promise.allSettled(updatePromises);
    
    // Apenas uma atualização deve ter sucesso devido ao controle de concorrência
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBe(1);
  });
});
```

## 3. Testes de Segurança

### 3.1 Autenticação e Autorização

```typescript
// tests/security/auth.test.ts
describe('Authentication & Authorization', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .expect(401);
    
    expect(response.body.error).toBe('Authentication required');
  });

  it('should enforce tenant isolation', async () => {
    const tenant1User = await createTestUser({ tenant_id: 'tenant1' });
    const tenant2User = await createTestUser({ tenant_id: 'tenant2' });
    
    const tenant1Transaction = await createTransaction({
      ...validTransactionData,
      tenant_id: 'tenant1'
    });
    
    // Usuário do tenant2 não deve ver transação do tenant1
    const response = await request(app)
      .get(`/api/transactions/${tenant1Transaction.id}`)
      .set('Authorization', `Bearer ${tenant2User.token}`)
      .expect(404);
  });
});
```

### 3.2 Validação de Input

```typescript
// tests/security/input-validation.test.ts
describe('Input Validation Security', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE transactions; --";
    
    await expect(getTransactions({
      search: maliciousInput
    })).not.toThrow();
    
    // Verificar que a tabela ainda existe
    const count = await getTransactionCount();
    expect(typeof count).toBe('number');
  });

  it('should sanitize XSS attempts', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    
    const transaction = await createTransaction({
      ...validTransactionData,
      description: xssPayload
    });
    
    // Descrição deve ser sanitizada
    expect(transaction.description).not.toContain('<script>');
  });
});
```

### 3.3 Rate Limiting

```typescript
// tests/security/rate-limiting.test.ts
describe('Rate Limiting', () => {
  it('should enforce rate limits on API endpoints', async () => {
    const user = await createTestUser();
    
    // Fazer muitas requisições rapidamente
    const promises = Array.from({ length: 100 }, () => 
      request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${user.token}`)
    );
    
    const responses = await Promise.all(promises);
    
    // Algumas requisições devem ser bloqueadas (429)
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

## 4. Testes End-to-End

### 4.1 Fluxos Completos

```typescript
// tests/e2e/financial-flows.test.ts
describe('Financial Flows E2E', () => {
  it('should complete full transaction lifecycle', async () => {
    // 1. Criar transação
    const transaction = await createTransaction(validTransactionData);
    expect(transaction.status).toBe('pending');
    
    // 2. Processar transação
    const processed = await processTransaction(transaction.id);
    expect(processed.status).toBe('processing');
    
    // 3. Liquidar transação
    const settled = await settleTransaction(transaction.id);
    expect(settled.status).toBe('settled');
    
    // 4. Verificar auditoria
    const auditLog = await getTransactionAuditLog(transaction.id);
    expect(auditLog).toHaveLength(3); // pending -> processing -> settled
  });
});
```

### 4.2 Testes de Interface

```typescript
// tests/e2e/ui.test.ts
describe('Financial UI E2E', () => {
  it('should create transaction through UI', async () => {
    await page.goto('/financial');
    
    // Clicar em "Novo Registro"
    await page.click('[data-testid="create-transaction"]');
    
    // Preencher formulário
    await page.fill('[data-testid="transaction-description"]', 'Test Transaction');
    await page.fill('[data-testid="transaction-amount"]', '1000');
    await page.selectOption('[data-testid="transaction-type"]', 'income');
    
    // Submeter formulário
    await page.click('[data-testid="submit-transaction"]');
    
    // Verificar feedback de sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verificar que transação aparece na lista
    await expect(page.locator('text=Test Transaction')).toBeVisible();
  });
});
```

## 5. Configuração de Ambiente de Testes

### 5.1 Setup do Banco de Dados de Teste

```typescript
// tests/setup/database.ts
export async function setupTestDatabase() {
  // Criar banco de dados de teste isolado
  const testDb = `test_${Date.now()}`;
  
  await supabase.rpc('create_test_database', { db_name: testDb });
  
  // Executar migrações
  await runMigrations(testDb);
  
  // Inserir dados de seed mínimos
  await seedTestData(testDb);
  
  return testDb;
}

export async function cleanupTestDatabase(dbName: string) {
  await supabase.rpc('drop_test_database', { db_name: dbName });
}
```

### 5.2 Mocks e Fixtures

```typescript
// tests/fixtures/financial.ts
export const createValidTransactionData = () => ({
  tenant_id: 'test-tenant',
  type: 'income',
  status: 'pending',
  category: 'performance',
  gross_amount: 1000,
  net_amount: 850,
  transaction_date: new Date(),
  payment_method: 'bank_transfer',
  description: 'Test transaction',
  reference_id: `ref_${Date.now()}`
});

export const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
};
```

## 6. Métricas e Monitoramento

### 6.1 Cobertura de Código

```json
// jest.config.js
{
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/components/financial/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

### 6.2 Performance Benchmarks

```typescript
// tests/benchmarks/performance.ts
const PERFORMANCE_THRESHOLDS = {
  TRANSACTION_CREATION: 100, // ms
  TRANSACTION_QUERY: 50, // ms
  BULK_OPERATIONS: 5000, // ms for 1000 records
  REAL_TIME_LATENCY: 200 // ms
};

export function assertPerformance(operation: string, duration: number) {
  const threshold = PERFORMANCE_THRESHOLDS[operation];
  if (duration > threshold) {
    throw new Error(`Performance threshold exceeded for ${operation}: ${duration}ms > ${threshold}ms`);
  }
}
```

## 7. Automação e CI/CD

### 7.1 Pipeline de Testes

```yaml
# .github/workflows/financial-tests.yml
name: Financial System Tests

on:
  push:
    paths:
      - 'src/components/financial/**'
      - 'tests/financial/**'
  pull_request:
    paths:
      - 'src/components/financial/**'
      - 'tests/financial/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit:financial
      
      - name: Run integration tests
        run: npm run test:integration:financial
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run performance tests
        run: npm run test:performance:financial
      
      - name: Run security tests
        run: npm run test:security:financial
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### 7.2 Scripts de Teste

```json
// package.json
{
  "scripts": {
    "test:financial": "jest tests/financial --coverage",
    "test:unit:financial": "jest tests/financial/unit",
    "test:integration:financial": "jest tests/financial/integration",
    "test:performance:financial": "jest tests/financial/performance",
    "test:security:financial": "jest tests/financial/security",
    "test:e2e:financial": "playwright test tests/financial/e2e",
    "test:watch:financial": "jest tests/financial --watch"
  }
}
```

## 8. Relatórios e Documentação

### 8.1 Relatório de Cobertura

- Cobertura mínima de 80% para código geral
- Cobertura mínima de 90% para componentes financeiros críticos
- Relatórios HTML gerados automaticamente

### 8.2 Relatório de Performance

- Benchmarks executados a cada build
- Alertas automáticos para degradação de performance
- Histórico de métricas de performance

### 8.3 Relatório de Segurança

- Scan automático de vulnerabilidades
- Testes de penetração automatizados
- Relatório de conformidade com padrões de segurança

## 9. Cronograma de Implementação

### Fase 1 (Semana 1-2)
- [ ] Setup do ambiente de testes
- [ ] Testes unitários básicos
- [ ] Testes de validação de dados

### Fase 2 (Semana 3-4)
- [ ] Testes de integração CRUD
- [ ] Testes de sincronização em tempo real
- [ ] Testes de consistência de dados

### Fase 3 (Semana 5-6)
- [ ] Testes de performance e carga
- [ ] Testes de concorrência
- [ ] Otimização baseada em resultados

### Fase 4 (Semana 7-8)
- [ ] Testes de segurança
- [ ] Testes end-to-end
- [ ] Automação completa do pipeline

## 10. Critérios de Aceite

### Integridade de Dados
- ✅ 100% dos testes de validação passando
- ✅ Zero inconsistências de dados detectadas
- ✅ Auditoria completa de todas as operações

### Performance
- ✅ Operações CRUD < 100ms (95º percentil)
- ✅ Queries complexas < 500ms
- ✅ Suporte a 1000+ usuários simultâneos

### Segurança
- ✅ Zero vulnerabilidades críticas
- ✅ Isolamento completo entre tenants
- ✅ Criptografia de dados sensíveis

### Qualidade
- ✅ Cobertura de código > 90%
- ✅ Zero bugs críticos em produção
- ✅ Documentação completa e atualizada