// Script para criar um serviço de dados mockados para testes
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🎭 CRIANDO SERVIÇO DE DADOS MOCKADOS');
console.log('=' .repeat(50));

// Dados mockados para transações
const mockTransactions = [
  {
    id: 'mock-trans-001',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    type: 'income',
    status: 'completed',
    category: 'show',
    gross_amount: 5000.00,
    fee_amount: 250.00,
    net_amount: 4750.00,
    transaction_date: '2025-01-15',
    description: 'Show no Teatro Municipal',
    evento_id: 'evento-001',
    banda_id: 'banda-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-trans-002',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    type: 'expense',
    status: 'pending',
    category: 'equipment',
    gross_amount: 1200.00,
    fee_amount: 0.00,
    net_amount: 1200.00,
    transaction_date: '2025-01-10',
    description: 'Aluguel de equipamento de som',
    evento_id: 'evento-001',
    banda_id: 'banda-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-trans-003',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    type: 'income',
    status: 'completed',
    category: 'merchandise',
    gross_amount: 800.00,
    fee_amount: 40.00,
    net_amount: 760.00,
    transaction_date: '2025-01-12',
    description: 'Venda de camisetas e CDs',
    evento_id: 'evento-001',
    banda_id: 'banda-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Dados mockados para payouts
const mockPayouts = [
  {
    id: 'mock-payout-001',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    amount: 1500.00,
    status: 'completed',
    beneficiary_type: 'musician',
    beneficiary_id: 'musician-001',
    beneficiary_name: 'João Silva',
    payout_date: '2025-01-16',
    description: 'Pagamento show Teatro Municipal',
    evento_id: 'evento-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-payout-002',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    amount: 1200.00,
    status: 'pending',
    beneficiary_type: 'venue',
    beneficiary_id: 'venue-001',
    beneficiary_name: 'Teatro Municipal',
    payout_date: '2025-01-20',
    description: 'Aluguel do espaço',
    evento_id: 'evento-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Dados mockados para financeiro
const mockFinanceiro = [
  {
    id: 'mock-fin-001',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    tipo: 'receita',
    categoria: 'shows',
    valor: 5000.00,
    data: '2025-01-15',
    descricao: 'Receita do show no Teatro Municipal',
    evento_id: 'evento-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-fin-002',
    tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
    tipo: 'despesa',
    categoria: 'equipamentos',
    valor: 1200.00,
    data: '2025-01-10',
    descricao: 'Aluguel de equipamento de som',
    evento_id: 'evento-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function createMockDataService() {
  try {
    console.log('\n📝 CRIANDO ARQUIVO DE SERVIÇO MOCK');
    
    const mockServiceContent = `
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
const mockTransactions: MockTransaction[] = ${JSON.stringify(mockTransactions, null, 2)};

const mockPayouts: MockPayout[] = ${JSON.stringify(mockPayouts, null, 2)};

const mockFinanceiro: MockFinanceiro[] = ${JSON.stringify(mockFinanceiro, null, 2)};

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
      id: \`mock-trans-\${Date.now()}\`,
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
      id: \`mock-payout-\${Date.now()}\`,
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
      id: \`mock-fin-\${Date.now()}\`,
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
    
    return {
      data: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        pendingPayouts,
        totalTransactions: transactions.length
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
`;
    
    // Salvar o arquivo
    const fs = await import('fs');
    const path = await import('path');
    
    const mockServicePath = path.join(process.cwd(), 'src', 'services', 'mockFinancialService.ts');
    
    // Criar diretório se não existir
    const servicesDir = path.dirname(mockServicePath);
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }
    
    fs.writeFileSync(mockServicePath, mockServiceContent);
    
    console.log('✅ Arquivo de serviço mock criado:', mockServicePath);
    
    // Verificar se as tabelas estão realmente vazias
    console.log('\n🔍 VERIFICANDO ESTADO ATUAL DAS TABELAS');
    
    const { data: transactionsData, error: transError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .limit(0);
    
    const { data: payoutsData, error: payoutsError } = await supabase
      .from('payouts')
      .select('*', { count: 'exact' })
      .limit(0);
    
    const { data: financeiroData, error: financeiroError } = await supabase
      .from('financeiro')
      .select('*', { count: 'exact' })
      .limit(0);
    
    console.log('📊 Estado das tabelas:');
    console.log(`   Transactions: ${transError ? 'ERRO' : 'OK'} (${transError?.message || 'Acessível'})`);
    console.log(`   Payouts: ${payoutsError ? 'ERRO' : 'OK'} (${payoutsError?.message || 'Acessível'})`);
    console.log(`   Financeiro: ${financeiroError ? 'ERRO' : 'OK'} (${financeiroError?.message || 'Acessível'})`);
    
  } catch (error) {
    console.error('❌ Erro ao criar serviço mock:', error);
  }
}

// Executar criação do serviço mock
createMockDataService().then(() => {
  console.log('\n🎉 Serviço de dados mockados criado com sucesso!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Modificar useFinancialData.ts para usar o serviço mock');
  console.log('2. Testar a interface com dados mockados');
  console.log('3. Configurar autenticação adequada no Supabase');
  console.log('4. Criar políticas RLS apropriadas');
  console.log('5. Migrar de volta para dados reais');
}).catch((error) => {
  console.error('💥 Erro na criação do serviço mock:', error);
});