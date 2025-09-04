/**
 * Financial API Endpoints Implementation
 * Implementação dos endpoints CRUD para as tabelas financeiras
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

// Types
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Payout = Database['public']['Tables']['payouts']['Row'];
type Financeiro = Database['public']['Tables']['financeiro']['Row'];

// Validation Schemas
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
  transaction_date: z.string(),
  attachment_url: z.string().url().optional(),
}).refine((data) => {
  if (data.fee_amount && data.fee_amount > data.gross_amount) {
    return false;
  }
  return true;
}, {
  message: "Fee amount cannot be greater than gross amount"
});

export const PayoutSchema = z.object({
  tenant_id: z.string().uuid(),
  evento_id: z.string().uuid(),
  transaction_id: z.string().uuid().optional(),
  beneficiary_type: z.enum(['band', 'member', 'crew', 'manager']),
  beneficiary_name: z.string().min(1).max(200),
  beneficiary_id: z.string().max(100).optional(),
  amount: z.number().positive(),
  due_date: z.string(),
  payment_method: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const FinanceiroSchema = z.object({
  tenant_id: z.string().uuid(),
  evento_id: z.string().uuid().optional(),
  tipo: z.enum(['receita', 'despesa']),
  valor: z.number().positive(),
  descricao: z.string().max(500).optional(),
  data_transacao: z.string().optional(),
});

// Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionsResponse extends PaginatedResponse<Transaction> {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Financial API Class
export class FinancialAPI {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // TRANSACTIONS ENDPOINTS

  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(params: {
    tenant_id: string;
    banda_id?: string;
    evento_id?: string;
    type?: 'income' | 'expense';
    status?: 'pending' | 'scheduled' | 'settled';
    category?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<TransactionsResponse>> {
    try {
      const {
        tenant_id,
        banda_id,
        evento_id,
        type,
        status,
        category,
        date_from,
        date_to,
        page = 1,
        limit = 50
      } = params;

      let query = this.supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant_id)
        .order('transaction_date', { ascending: false });

      // Apply filters
      if (banda_id) query = query.eq('banda_id', banda_id);
      if (evento_id) query = query.eq('evento_id', evento_id);
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (category) query = query.eq('category', category);
      if (date_from) query = query.gte('transaction_date', date_from);
      if (date_to) query = query.lte('transaction_date', date_to);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: transactions, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Calculate summary
      const summaryQuery = this.supabase
        .from('transactions')
        .select('type, net_amount')
        .eq('tenant_id', tenant_id);

      // Apply same filters for summary
      if (banda_id) summaryQuery.eq('banda_id', banda_id);
      if (evento_id) summaryQuery.eq('evento_id', evento_id);
      if (date_from) summaryQuery.gte('transaction_date', date_from);
      if (date_to) summaryQuery.lte('transaction_date', date_to);

      const { data: summaryData } = await summaryQuery;

      const summary = summaryData?.reduce(
        (acc, transaction) => {
          const amount = transaction.net_amount || 0;
          if (transaction.type === 'income') {
            acc.totalIncome += amount;
          } else {
            acc.totalExpense += amount;
          }
          return acc;
        },
        { totalIncome: 0, totalExpense: 0, netAmount: 0 }
      ) || { totalIncome: 0, totalExpense: 0, netAmount: 0 };

      summary.netAmount = summary.totalIncome - summary.totalExpense;

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          data: transactions || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages
          },
          summary
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    data: z.infer<typeof TransactionSchema>
  ): Promise<ApiResponse<Transaction>> {
    try {
      // Validate input
      const validatedData = TransactionSchema.parse(data);

      const { data: transaction, error } = await this.supabase
        .from('transactions')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transaction };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    id: string,
    data: Partial<z.infer<typeof TransactionSchema>>
  ): Promise<ApiResponse<Transaction>> {
    try {
      // Validate input if provided
      if (Object.keys(data).length > 0) {
        const partialSchema = TransactionSchema.partial();
        partialSchema.parse(data);
      }

      const { data: transaction, error } = await this.supabase
        .from('transactions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transaction };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string, tenant_id: string): Promise<ApiResponse<void>> {
    try {
      // Check if transaction exists and is not settled
      const { data: existing } = await this.supabase
        .from('transactions')
        .select('status')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!existing) {
        return { success: false, error: 'Transaction not found' };
      }

      if (existing.status === 'settled') {
        return { success: false, error: 'Cannot delete settled transactions' };
      }

      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // PAYOUTS ENDPOINTS

  /**
   * Get payouts with filtering and pagination
   */
  async getPayouts(params: {
    tenant_id: string;
    evento_id?: string;
    beneficiary_type?: 'band' | 'member' | 'crew' | 'manager';
    status?: 'pending' | 'settled';
    due_date_from?: string;
    due_date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Payout>>> {
    try {
      const {
        tenant_id,
        evento_id,
        beneficiary_type,
        status,
        due_date_from,
        due_date_to,
        page = 1,
        limit = 50
      } = params;

      let query = this.supabase
        .from('payouts')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant_id)
        .order('due_date', { ascending: true });

      // Apply filters
      if (evento_id) query = query.eq('evento_id', evento_id);
      if (beneficiary_type) query = query.eq('beneficiary_type', beneficiary_type);
      if (status) query = query.eq('status', status);
      if (due_date_from) query = query.gte('due_date', due_date_from);
      if (due_date_to) query = query.lte('due_date', due_date_to);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: payouts, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          data: payouts || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new payout
   */
  async createPayout(
    data: z.infer<typeof PayoutSchema>
  ): Promise<ApiResponse<Payout>> {
    try {
      // Validate input
      const validatedData = PayoutSchema.parse(data);

      // Check if due_date is not in the past
      const dueDate = new Date(validatedData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        return { success: false, error: 'Due date cannot be in the past' };
      }

      const { data: payout, error } = await this.supabase
        .from('payouts')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: payout };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // FINANCEIRO ENDPOINTS

  /**
   * Get financeiro records with filtering
   */
  async getFinanceiro(params: {
    tenant_id: string;
    evento_id?: string;
    tipo?: 'receita' | 'despesa';
    data_from?: string;
    data_to?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Financeiro>>> {
    try {
      const {
        tenant_id,
        evento_id,
        tipo,
        data_from,
        data_to,
        page = 1,
        limit = 50
      } = params;

      let query = this.supabase
        .from('financeiro')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant_id)
        .order('data_transacao', { ascending: false });

      // Apply filters
      if (evento_id) query = query.eq('evento_id', evento_id);
      if (tipo) query = query.eq('tipo', tipo);
      if (data_from) query = query.gte('data_transacao', data_from);
      if (data_to) query = query.lte('data_transacao', data_to);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: financeiro, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          data: financeiro || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new financeiro record
   */
  async createFinanceiro(
    data: z.infer<typeof FinanceiroSchema>
  ): Promise<ApiResponse<Financeiro>> {
    try {
      // Validate input
      const validatedData = FinanceiroSchema.parse(data);

      const { data: financeiro, error } = await this.supabase
        .from('financeiro')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: financeiro };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // REALTIME SUBSCRIPTIONS

  /**
   * Subscribe to real-time changes for transactions
   */
  subscribeToTransactions(
    tenantId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel('transactions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `tenant_id=eq.${tenantId}`
      }, callback)
      .subscribe();
  }

  /**
   * Subscribe to real-time changes for payouts
   */
  subscribeToPayouts(
    tenantId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel('payouts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payouts',
        filter: `tenant_id=eq.${tenantId}`
      }, callback)
      .subscribe();
  }

  /**
   * Subscribe to real-time changes for financeiro
   */
  subscribeToFinanceiro(
    tenantId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel('financeiro-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'financeiro',
        filter: `tenant_id=eq.${tenantId}`
      }, callback)
      .subscribe();
  }
}

// Export singleton instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const financialAPI = new FinancialAPI(supabaseUrl, supabaseKey);