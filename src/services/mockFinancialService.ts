
// Serviço de dados mockados para desenvolvimento e testes
// Este arquivo substitui temporariamente as chamadas ao Supabase

export interface MockTransaction {
  id: string;
  tenant_id: string;
  type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed';
  category: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  transaction_date: string;
  description: string;
  evento_id?: string;
  banda_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MockPayout {
  id: string;
  tenant_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  beneficiary_type: string;
  beneficiary_id: string;
  beneficiary_name: string;
  payout_date: string;
  description: string;
  evento_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MockFinanceiro {
  id: string;
  tenant_id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  valor: number;
  data: string;
  descricao: string;
  evento_id?: string;
  created_at: string;
  updated_at: string;
}

// Dados mockados
const mockTransactions: MockTransaction[] = [
  {
    "id": "mock-trans-001",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "type": "income",
    "status": "completed",
    "category": "show",
    "gross_amount": 5000,
    "fee_amount": 250,
    "net_amount": 4750,
    "transaction_date": "2025-01-15",
    "description": "Show no Teatro Municipal",
    "evento_id": "evento-001",
    "banda_id": "banda-001",
    "created_at": "2025-09-03T16:41:28.703Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  },
  {
    "id": "mock-trans-002",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "type": "expense",
    "status": "pending",
    "category": "equipment",
    "gross_amount": 1200,
    "fee_amount": 0,
    "net_amount": 1200,
    "transaction_date": "2025-01-10",
    "description": "Aluguel de equipamento de som",
    "evento_id": "evento-001",
    "banda_id": "banda-001",
    "created_at": "2025-09-03T16:41:28.704Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  },
  {
    "id": "mock-trans-003",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "type": "income",
    "status": "completed",
    "category": "merchandise",
    "gross_amount": 800,
    "fee_amount": 40,
    "net_amount": 760,
    "transaction_date": "2025-01-12",
    "description": "Venda de camisetas e CDs",
    "evento_id": "evento-001",
    "banda_id": "banda-001",
    "created_at": "2025-09-03T16:41:28.704Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  }
];

const mockPayouts: MockPayout[] = [
  {
    "id": "mock-payout-001",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "amount": 1500,
    "status": "completed",
    "beneficiary_type": "musician",
    "beneficiary_id": "musician-001",
    "beneficiary_name": "João Silva",
    "payout_date": "2025-01-16",
    "description": "Pagamento show Teatro Municipal",
    "evento_id": "evento-001",
    "created_at": "2025-09-03T16:41:28.704Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  },
  {
    "id": "mock-payout-002",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "amount": 1200,
    "status": "pending",
    "beneficiary_type": "venue",
    "beneficiary_id": "venue-001",
    "beneficiary_name": "Teatro Municipal",
    "payout_date": "2025-01-20",
    "description": "Aluguel do espaço",
    "evento_id": "evento-001",
    "created_at": "2025-09-03T16:41:28.704Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  }
];

const mockFinanceiro: MockFinanceiro[] = [
  {
    "id": "mock-fin-001",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "tipo": "receita",
    "categoria": "shows",
    "valor": 5000,
    "data": "2025-01-15",
    "descricao": "Receita do show no Teatro Municipal",
    "evento_id": "evento-001",
    "created_at": "2025-09-03T16:41:28.704Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  },
  {
    "id": "mock-fin-002",
    "tenant_id": "d93bd1e5-245e-4a40-9027-4bd669ccc390",
    "tipo": "despesa",
    "categoria": "equipamentos",
    "valor": 1200,
    "data": "2025-01-10",
    "descricao": "Aluguel de equipamento de som",
    "evento_id": "evento-001",
    "created_at": "2025-09-03T16:41:28.704Z",
    "updated_at": "2025-09-03T16:41:28.704Z"
  }
];

// Simulação de delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Serviço mock para transações
export const mockTransactionService = {
  async getAll(tenantId: string, filters: any = {}) {
    await delay(500); // Simula latência de rede
    return {
      data: mockTransactions.filter(t => t.tenant_id === tenantId),
      count: mockTransactions.filter(t => t.tenant_id === tenantId).length,
      error: null
    };
  },

  async create(transaction: Partial<MockTransaction>) {
    await delay(300);
    const newTransaction: MockTransaction = {
      id: `mock-trans-${Date.now()}`,
      tenant_id: transaction.tenant_id!,
      type: transaction.type!,
      status: transaction.status || 'pending',
      category: transaction.category!,
      gross_amount: transaction.gross_amount!,
      fee_amount: transaction.fee_amount || 0,
      net_amount: (transaction.gross_amount || 0) - (transaction.fee_amount || 0),
      transaction_date: transaction.transaction_date!,
      description: transaction.description!,
      evento_id: transaction.evento_id,
      banda_id: transaction.banda_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockTransactions.push(newTransaction);
    return { data: newTransaction, error: null };
  },

  async update(id: string, updates: Partial<MockTransaction>) {
    await delay(300);
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) {
      return { data: null, error: 'Transaction not found' };
    }
    
    mockTransactions[index] = {
      ...mockTransactions[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return { data: mockTransactions[index], error: null };
  },

  async delete(id: string) {
    await delay(300);
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) {
      return { error: 'Transaction not found' };
    }
    
    mockTransactions.splice(index, 1);
    return { error: null };
  }
};

// Serviço mock para payouts
export const mockPayoutService = {
  async getAll(tenantId: string, filters: any = {}) {
    await delay(500);
    return {
      data: mockPayouts.filter(p => p.tenant_id === tenantId),
      count: mockPayouts.filter(p => p.tenant_id === tenantId).length,
      error: null
    };
  },

  async create(payout: Partial<MockPayout>) {
    await delay(300);
    const newPayout: MockPayout = {
      id: `mock-payout-${Date.now()}`,
      tenant_id: payout.tenant_id!,
      amount: payout.amount!,
      status: payout.status || 'pending',
      beneficiary_type: payout.beneficiary_type!,
      beneficiary_id: payout.beneficiary_id!,
      beneficiary_name: payout.beneficiary_name!,
      payout_date: payout.payout_date!,
      description: payout.description!,
      evento_id: payout.evento_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockPayouts.push(newPayout);
    return { data: newPayout, error: null };
  },

  async update(id: string, updates: Partial<MockPayout>) {
    await delay(300);
    const index = mockPayouts.findIndex(p => p.id === id);
    if (index === -1) {
      return { data: null, error: 'Payout not found' };
    }
    
    mockPayouts[index] = {
      ...mockPayouts[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return { data: mockPayouts[index], error: null };
  },

  async delete(id: string) {
    await delay(300);
    const index = mockPayouts.findIndex(p => p.id === id);
    if (index === -1) {
      return { error: 'Payout not found' };
    }
    
    mockPayouts.splice(index, 1);
    return { error: null };
  }
};

// Serviço mock para financeiro
export const mockFinanceiroService = {
  async getAll(tenantId: string, filters: any = {}) {
    await delay(500);
    return {
      data: mockFinanceiro.filter(f => f.tenant_id === tenantId),
      count: mockFinanceiro.filter(f => f.tenant_id === tenantId).length,
      error: null
    };
  },

  async create(financeiro: Partial<MockFinanceiro>) {
    await delay(300);
    const newFinanceiro: MockFinanceiro = {
      id: `mock-fin-${Date.now()}`,
      tenant_id: financeiro.tenant_id!,
      tipo: financeiro.tipo!,
      categoria: financeiro.categoria!,
      valor: financeiro.valor!,
      data: financeiro.data!,
      descricao: financeiro.descricao!,
      evento_id: financeiro.evento_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockFinanceiro.push(newFinanceiro);
    return { data: newFinanceiro, error: null };
  },

  async update(id: string, updates: Partial<MockFinanceiro>) {
    await delay(300);
    const index = mockFinanceiro.findIndex(f => f.id === id);
    if (index === -1) {
      return { data: null, error: 'Financeiro not found' };
    }
    
    mockFinanceiro[index] = {
      ...mockFinanceiro[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return { data: mockFinanceiro[index], error: null };
  },

  async delete(id: string) {
    await delay(300);
    const index = mockFinanceiro.findIndex(f => f.id === id);
    if (index === -1) {
      return { error: 'Financeiro not found' };
    }
    
    mockFinanceiro.splice(index, 1);
    return { error: null };
  }
};

// Métricas do dashboard
export const mockDashboardMetrics = {
  async getMetrics(tenantId: string) {
    await delay(400);
    
    const transactions = mockTransactions.filter(t => t.tenant_id === tenantId);
    const payouts = mockPayouts.filter(p => p.tenant_id === tenantId);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.net_amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.gross_amount, 0);
    
    const pendingPayouts = payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Calcular métricas mensais (mês atual)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.net_amount, 0);
    
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.gross_amount, 0);
    
    const netAmount = totalIncome - totalExpense;
    
    return {
      data: {
        totalIncome,
        totalExpense,
        netAmount,
        pendingPayouts,
        totalTransactions: transactions.length,
        monthlyIncome,
        monthlyExpenses,
        totalBalance: netAmount // Usar netAmount como totalBalance
      },
      error: null
    };
  }
};

// Flag para indicar que estamos usando dados mockados
export const IS_MOCK_MODE = true;

console.log('🎭 Serviço de dados mockados carregado');
console.log('📊 Transações mockadas:', mockTransactions.length);
console.log('💰 Payouts mockados:', mockPayouts.length);
console.log('📈 Registros financeiros mockados:', mockFinanceiro.length);
