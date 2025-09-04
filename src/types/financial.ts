// Tipos unificados para o sistema financeiro
// Este arquivo define interfaces consistentes para todos os componentes financeiros

export interface BaseFinancialRecord {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at?: string;
}

// Interface unificada para transações
export interface FinancialTransaction extends BaseFinancialRecord {
  description: string;
  amount: number; // Valor principal da transação (sempre positivo)
  gross_amount?: number; // Valor bruto (antes de taxas)
  net_amount?: number; // Valor líquido (após taxas) - GENERATED no banco
  type: 'income' | 'expense';
  category?: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  tags?: string[];
}

// Interface unificada para payouts
export interface FinancialPayout extends BaseFinancialRecord {
  amount: number;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_date: string;
  processed_date?: string;
  recipient?: string;
  payment_method?: string;
  reference_id?: string;
  notes?: string;
}

// Interface para registros da tabela financeiro (agregados)
export interface FinancialRecord extends BaseFinancialRecord {
  month: string; // YYYY-MM format
  total_income: number;
  total_expenses: number;
  net_amount: number; // GENERATED: total_income - total_expenses
  transaction_count: number;
}

// Interface para tabela financeiro (registros individuais)
export interface Financeiro extends BaseFinancialRecord {
  tipo: string;
  valor: number;
  descricao?: string;
  data_transacao?: string;
  evento_id?: string;
}

// Interfaces para métricas calculadas
export interface DashboardMetrics {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  pendingPayouts: number;
  totalTransactions: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalBalance: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyEvolution {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

// Tipos para filtros e consultas
export interface FinancialFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: 'income' | 'expense' | 'all';
  category?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos para respostas de API
export interface FinancialApiResponse<T> {
  data: T;
  count?: number;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends FinancialApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para operações CRUD
export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  date: string;
  payment_method?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CreatePayoutData {
  amount: number;
  description: string;
  scheduled_date: string;
  recipient?: string;
  payment_method?: string;
  notes?: string;
}

export interface UpdatePayoutData extends Partial<CreatePayoutData> {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  processed_date?: string;
  reference_id?: string;
}

// Constantes para validação
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const TRANSACTION_STATUSES = ['pending', 'completed', 'cancelled'] as const;
export const PAYOUT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;

export const DEFAULT_CATEGORIES = {
  income: [
    'Apresentações',
    'Aulas',
    'Vendas de Produtos',
    'Patrocínios',
    'Direitos Autorais',
    'Outros'
  ],
  expense: [
    'Equipamentos',
    'Transporte',
    'Alimentação',
    'Hospedagem',
    'Marketing',
    'Taxas',
    'Outros'
  ]
} as const;

export const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Boleto',
  'Outros'
] as const;

// Utilitários de tipo
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export type PayoutStatus = typeof PAYOUT_STATUSES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type IncomeCategory = typeof DEFAULT_CATEGORIES.income[number];
export type ExpenseCategory = typeof DEFAULT_CATEGORIES.expense[number];

// Funções utilitárias para validação
export const isValidTransactionType = (type: string): type is TransactionType => {
  return TRANSACTION_TYPES.includes(type as TransactionType);
};

export const isValidTransactionStatus = (status: string): status is TransactionStatus => {
  return TRANSACTION_STATUSES.includes(status as TransactionStatus);
};

export const isValidPayoutStatus = (status: string): status is PayoutStatus => {
  return PAYOUT_STATUSES.includes(status as PayoutStatus);
};

// Funções utilitárias para formatação
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('pt-BR');
};

// Funções utilitárias para cálculos
export const calculateNetAmount = (grossAmount: number, fees: number = 0): number => {
  return grossAmount - fees;
};

export const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

export const sumTransactions = (transactions: FinancialTransaction[]): number => {
  console.log('➕ [sumTransactions] Iniciando soma de transações');
  console.log('➕ [sumTransactions] Número de transações:', transactions.length);
  console.log('➕ [sumTransactions] Transações para somar:', JSON.stringify(transactions, null, 2));
  
  const result = transactions.reduce((sum, transaction) => {
    console.log(`➕ [sumTransactions] Somando transação ${transaction.id}: ${transaction.amount} (soma atual: ${sum})`);
    return sum + transaction.amount;
  }, 0);
  
  console.log('➕ [sumTransactions] Resultado final da soma:', result);
  return result;
};

export const filterTransactionsByType = (
  transactions: FinancialTransaction[],
  type: TransactionType
): FinancialTransaction[] => {
  console.log(`🔍 [filterTransactionsByType] Filtrando transações por tipo: ${type}`);
  console.log('🔍 [filterTransactionsByType] Total de transações para filtrar:', transactions.length);
  console.log('🔍 [filterTransactionsByType] Transações originais:', JSON.stringify(transactions, null, 2));
  
  const result = transactions.filter(transaction => {
    const matches = transaction.type === type;
    console.log(`🔍 [filterTransactionsByType] Transação ${transaction.id} (tipo: ${transaction.type}) corresponde ao filtro ${type}: ${matches}`);
    return matches;
  });
  
  console.log(`🔍 [filterTransactionsByType] Resultado do filtro para ${type}:`, result.length, 'transações');
  console.log('🔍 [filterTransactionsByType] Transações filtradas:', JSON.stringify(result, null, 2));
  return result;
};

export const filterTransactionsByDateRange = (
  transactions: FinancialTransaction[],
  startDate: string,
  endDate: string
): FinancialTransaction[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= start && transactionDate <= end;
  });
};