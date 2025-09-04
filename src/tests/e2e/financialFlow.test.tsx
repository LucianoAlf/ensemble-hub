import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { FinanceMovements } from '@/components/finance/FinanceMovements';
import { FinanceReports } from '@/components/finance/FinanceReports';
import { FinancialTransaction, FinancialPayout } from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
  },
}));

// Mock hooks
jest.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id' },
    loading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Financial Flow End-to-End Tests', () => {
  let mockTransactions: FinancialTransaction[] = [];
  let mockPayouts: FinancialPayout[] = [];
  let transactionIdCounter = 1;
  let payoutIdCounter = 1;

  const createMockTransaction = (overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
    id: `transaction-${transactionIdCounter++}`,
    tenant_id: 'test-tenant-id',
    type: 'income',
    status: 'settled',
    category: 'performance',
    gross_amount: 1000,
    net_amount: 850,
    fee_amount: 150,
    transaction_date: new Date().toISOString().split('T')[0],
    description: 'Test transaction',
    payment_method: 'bank_transfer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const createMockPayout = (overrides: Partial<FinancialPayout> = {}): FinancialPayout => ({
    id: `payout-${payoutIdCounter++}`,
    tenant_id: 'test-tenant-id',
    status: 'pending',
    amount: 500,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    beneficiary: 'Test Beneficiary',
    description: 'Test payout',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const setupMockSupabase = () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'transactions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockImplementation((data) => ({
            select: jest.fn().mockResolvedValue({
              data: [{ ...data, id: `transaction-${transactionIdCounter++}` }],
              error: null,
            }),
          })),
          update: jest.fn().mockImplementation((data) => ({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [data],
                error: null,
              }),
            }),
          })),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        } as any;
      }
      
      if (table === 'payouts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockPayouts,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockImplementation((data) => ({
            select: jest.fn().mockResolvedValue({
              data: [{ ...data, id: `payout-${payoutIdCounter++}` }],
              error: null,
            }),
          })),
          update: jest.fn().mockImplementation((data) => ({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [data],
                error: null,
              }),
            }),
          })),
        } as any;
      }
      
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any;
    });

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    } as any);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactions = [];
    mockPayouts = [];
    transactionIdCounter = 1;
    payoutIdCounter = 1;
    setupMockSupabase();
  });

  describe('Complete Transaction Lifecycle', () => {
    it('should create a new income transaction and reflect changes across all tabs', async () => {
      const user = userEvent.setup();
      
      // Start with empty state
      const { container: dashboardContainer, rerender: rerenderDashboard } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer, rerender: rerenderMovements } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );
      const { container: reportsContainer, rerender: rerenderReports } = render(
        <TestWrapper><FinanceReports /></TestWrapper>
      );

      // Verify initial empty state
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 0,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText(/0 transações/i)).toBeInTheDocument();
      });

      // Simulate creating a new transaction
      const newTransaction = createMockTransaction({
        type: 'income',
        gross_amount: 2000,
        net_amount: 1700,
        fee_amount: 300,
        description: 'Concert payment',
        category: 'performance',
      });

      // Add transaction to mock data
      mockTransactions.push(newTransaction);
      setupMockSupabase();

      // Re-render all components to simulate real-time updates
      rerenderDashboard(<TestWrapper><FinanceDashboard /></TestWrapper>);
      rerenderMovements(<TestWrapper><FinanceMovements /></TestWrapper>);
      rerenderReports(<TestWrapper><FinanceReports /></TestWrapper>);

      // Verify changes are reflected across all tabs
      await waitFor(() => {
        // Dashboard should show updated KPIs
        expect(within(dashboardContainer).getByText('R$ 1.700,00')).toBeInTheDocument();
        
        // Movements should show the transaction
        expect(within(movementsContainer).getByText('Concert payment')).toBeInTheDocument();
        expect(within(movementsContainer).getByText(/1 transação/i)).toBeInTheDocument();
        
        // Reports should include the transaction in summaries
        expect(within(reportsContainer).getByText('Concert payment')).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/performance/i)).toBeInTheDocument();
      });
    });

    it('should create an expense transaction and update net calculations', async () => {
      // Start with an existing income transaction
      const incomeTransaction = createMockTransaction({
        type: 'income',
        gross_amount: 2000,
        net_amount: 1700,
        fee_amount: 300,
        description: 'Concert payment',
      });
      mockTransactions.push(incomeTransaction);
      setupMockSupabase();

      const { container: dashboardContainer, rerender: rerenderDashboard } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer, rerender: rerenderMovements } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );

      // Verify initial state with income
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 1.700,00')).toBeInTheDocument();
      });

      // Add expense transaction
      const expenseTransaction = createMockTransaction({
        type: 'expense',
        gross_amount: 500,
        net_amount: 500,
        fee_amount: 0,
        description: 'Equipment rental',
        category: 'equipment',
      });
      mockTransactions.push(expenseTransaction);
      setupMockSupabase();

      // Re-render components
      rerenderDashboard(<TestWrapper><FinanceDashboard /></TestWrapper>);
      rerenderMovements(<TestWrapper><FinanceMovements /></TestWrapper>);

      // Verify net amount calculation: 1700 - 500 = 1200
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 1.200,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Equipment rental')).toBeInTheDocument();
        expect(within(movementsContainer).getByText(/2 transações/i)).toBeInTheDocument();
      });
    });

    it('should handle transaction status changes and update calculations', async () => {
      // Create a pending transaction
      const pendingTransaction = createMockTransaction({
        status: 'pending',
        gross_amount: 1000,
        net_amount: 850,
        description: 'Pending payment',
      });
      mockTransactions.push(pendingTransaction);
      setupMockSupabase();

      const { container: dashboardContainer, rerender: rerenderDashboard } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer, rerender: rerenderMovements } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );

      // Verify pending transaction doesn't affect totals
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 0,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Pending payment')).toBeInTheDocument();
      });

      // Update transaction status to settled
      mockTransactions[0] = { ...pendingTransaction, status: 'settled' };
      setupMockSupabase();

      rerenderDashboard(<TestWrapper><FinanceDashboard /></TestWrapper>);
      rerenderMovements(<TestWrapper><FinanceMovements /></TestWrapper>);

      // Verify settled transaction now affects totals
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 850,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Pending payment')).toBeInTheDocument();
      });
    });
  });

  describe('Payout Management Flow', () => {
    it('should create payouts and reflect in dashboard metrics', async () => {
      // Start with some income
      const incomeTransaction = createMockTransaction({
        type: 'income',
        gross_amount: 3000,
        net_amount: 2550,
        fee_amount: 450,
        description: 'Large concert',
      });
      mockTransactions.push(incomeTransaction);

      // Create pending payout
      const pendingPayout = createMockPayout({
        amount: 1000,
        beneficiary: 'Band Member 1',
        description: 'Performance share',
      });
      mockPayouts.push(pendingPayout);
      setupMockSupabase();

      const { container: dashboardContainer } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );

      await waitFor(() => {
        // Should show income
        expect(within(dashboardContainer).getByText('R$ 2.550,00')).toBeInTheDocument();
        // Should show pending payout
        expect(within(dashboardContainer).getByText('R$ 1.000,00')).toBeInTheDocument();
      });
    });

    it('should handle payout completion and update metrics', async () => {
      const incomeTransaction = createMockTransaction({
        type: 'income',
        gross_amount: 2000,
        net_amount: 1700,
        description: 'Concert payment',
      });
      mockTransactions.push(incomeTransaction);

      const pendingPayout = createMockPayout({
        status: 'pending',
        amount: 800,
        beneficiary: 'Band Member 1',
      });
      mockPayouts.push(pendingPayout);
      setupMockSupabase();

      const { container: dashboardContainer, rerender: rerenderDashboard } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );

      // Verify initial pending payout
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 800,00')).toBeInTheDocument();
      });

      // Complete the payout
      mockPayouts[0] = { ...pendingPayout, status: 'completed' };
      setupMockSupabase();

      rerenderDashboard(<TestWrapper><FinanceDashboard /></TestWrapper>);

      // Verify pending payouts now shows 0
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 0,00')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-Transaction Scenarios', () => {
    it('should handle complex financial scenarios with multiple transactions and payouts', async () => {
      // Create multiple transactions
      const transactions = [
        createMockTransaction({
          type: 'income',
          gross_amount: 5000,
          net_amount: 4250,
          fee_amount: 750,
          description: 'Main concert',
          category: 'performance',
          transaction_date: '2024-01-15',
        }),
        createMockTransaction({
          type: 'income',
          gross_amount: 1500,
          net_amount: 1350,
          fee_amount: 150,
          description: 'Merchandise sales',
          category: 'merchandise',
          transaction_date: '2024-01-15',
        }),
        createMockTransaction({
          type: 'expense',
          gross_amount: 800,
          net_amount: 800,
          fee_amount: 0,
          description: 'Sound equipment',
          category: 'equipment',
          transaction_date: '2024-01-16',
        }),
        createMockTransaction({
          type: 'expense',
          gross_amount: 300,
          net_amount: 300,
          fee_amount: 0,
          description: 'Transportation',
          category: 'transport',
          transaction_date: '2024-01-16',
        }),
      ];
      mockTransactions.push(...transactions);

      // Create payouts
      const payouts = [
        createMockPayout({
          amount: 1500,
          beneficiary: 'Lead Singer',
          status: 'pending',
        }),
        createMockPayout({
          amount: 1200,
          beneficiary: 'Guitarist',
          status: 'pending',
        }),
        createMockPayout({
          amount: 800,
          beneficiary: 'Drummer',
          status: 'completed',
        }),
      ];
      mockPayouts.push(...payouts);
      setupMockSupabase();

      const { container: dashboardContainer } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );
      const { container: reportsContainer } = render(
        <TestWrapper><FinanceReports /></TestWrapper>
      );

      await waitFor(() => {
        // Total income: 4250 + 1350 = 5600
        // Total expense: 800 + 300 = 1100
        // Net amount: 5600 - 1100 = 4500
        // Pending payouts: 1500 + 1200 = 2700

        // Dashboard KPIs
        expect(within(dashboardContainer).getByText('R$ 5.600,00')).toBeInTheDocument(); // Total income
        expect(within(dashboardContainer).getByText('R$ 1.100,00')).toBeInTheDocument(); // Total expense
        expect(within(dashboardContainer).getByText('R$ 4.500,00')).toBeInTheDocument(); // Net amount
        expect(within(dashboardContainer).getByText('R$ 2.700,00')).toBeInTheDocument(); // Pending payouts

        // Movements should show all transactions
        expect(within(movementsContainer).getByText(/4 transações/i)).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Main concert')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Merchandise sales')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Sound equipment')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Transportation')).toBeInTheDocument();

        // Reports should categorize correctly
        expect(within(reportsContainer).getByText(/performance/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/merchandise/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/equipment/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/transport/i)).toBeInTheDocument();
      });
    });

    it('should maintain data consistency during rapid updates', async () => {
      const { container: dashboardContainer, rerender: rerenderDashboard } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer, rerender: rerenderMovements } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );

      // Simulate rapid transaction additions
      for (let i = 0; i < 10; i++) {
        const newTransaction = createMockTransaction({
          gross_amount: 1000,
          net_amount: 850,
          description: `Transaction ${i + 1}`,
        });
        mockTransactions.push(newTransaction);
        setupMockSupabase();

        rerenderDashboard(<TestWrapper><FinanceDashboard /></TestWrapper>);
        rerenderMovements(<TestWrapper><FinanceMovements /></TestWrapper>);

        await waitFor(() => {
          // Total should be (i + 1) * 850
          const expectedTotal = (i + 1) * 850;
          const formattedTotal = `R$ ${expectedTotal.toLocaleString('pt-BR')},00`;
          expect(within(dashboardContainer).getByText(formattedTotal)).toBeInTheDocument();
          
          const expectedCount = `${i + 1} transaç${i === 0 ? 'ão' : 'ões'}`;
          expect(within(movementsContainer).getByText(new RegExp(expectedCount, 'i'))).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors gracefully across all tabs', async () => {
      // Mock API error
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      } as any));

      const { container: dashboardContainer } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );
      const { container: reportsContainer } = render(
        <TestWrapper><FinanceReports /></TestWrapper>
      );

      await waitFor(() => {
        // All tabs should show error states
        expect(within(dashboardContainer).getByText(/erro/i)).toBeInTheDocument();
        expect(within(movementsContainer).getByText(/erro/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/erro/i)).toBeInTheDocument();
      });
    });

    it('should handle empty states consistently', async () => {
      // Ensure empty data
      mockTransactions = [];
      mockPayouts = [];
      setupMockSupabase();

      const { container: dashboardContainer } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );
      const { container: reportsContainer } = render(
        <TestWrapper><FinanceReports /></TestWrapper>
      );

      await waitFor(() => {
        // All tabs should show appropriate empty states
        expect(within(dashboardContainer).getByText('R$ 0,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText(/0 transações/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/nenhum dado/i)).toBeInTheDocument();
      });
    });

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => 
        createMockTransaction({
          description: `Transaction ${i + 1}`,
          gross_amount: Math.floor(Math.random() * 5000) + 100,
          net_amount: Math.floor(Math.random() * 4000) + 100,
        })
      );
      mockTransactions.push(...largeTransactionSet);
      setupMockSupabase();

      const startTime = performance.now();

      const { container: dashboardContainer } = render(
        <TestWrapper><FinanceDashboard /></TestWrapper>
      );
      const { container: movementsContainer } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );

      await waitFor(() => {
        expect(within(dashboardContainer).getByText(/R\$/)).toBeInTheDocument();
        expect(within(movementsContainer).getByText(/1000 transações/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large datasets within reasonable time (5 seconds)
      expect(renderTime).toBeLessThan(5000);
    });
  });

  describe('User Interaction Flows', () => {
    it('should handle transaction filtering and maintain consistency', async () => {
      // Create transactions with different categories
      const transactions = [
        createMockTransaction({ category: 'performance', description: 'Concert 1' }),
        createMockTransaction({ category: 'merchandise', description: 'Merch 1' }),
        createMockTransaction({ category: 'performance', description: 'Concert 2' }),
        createMockTransaction({ category: 'equipment', type: 'expense', description: 'Equipment 1' }),
      ];
      mockTransactions.push(...transactions);
      setupMockSupabase();

      const { container: movementsContainer } = render(
        <TestWrapper><FinanceMovements /></TestWrapper>
      );
      const { container: reportsContainer } = render(
        <TestWrapper><FinanceReports /></TestWrapper>
      );

      await waitFor(() => {
        // All transactions should be visible initially
        expect(within(movementsContainer).getByText('Concert 1')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Merch 1')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Concert 2')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('Equipment 1')).toBeInTheDocument();

        // Reports should categorize correctly
        expect(within(reportsContainer).getByText(/performance/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/merchandise/i)).toBeInTheDocument();
        expect(within(reportsContainer).getByText(/equipment/i)).toBeInTheDocument();
      });
    });

    it('should handle date range filtering consistently', async () => {
      // Create transactions across different dates
      const transactions = [
        createMockTransaction({ 
          transaction_date: '2024-01-01', 
          description: 'January transaction' 
        }),
        createMockTransaction({ 
          transaction_date: '2024-02-01', 
          description: 'February transaction' 
        }),
        createMockTransaction({ 
          transaction_date: '2024-03-01', 
          description: 'March transaction' 
        }),
      ];
      mockTransactions.push(...transactions);
      setupMockSupabase();

      const { container: reportsContainer } = render(
        <TestWrapper><FinanceReports /></TestWrapper>
      );

      await waitFor(() => {
        // All transactions should be visible in reports
        expect(within(reportsContainer).getByText('January transaction')).toBeInTheDocument();
        expect(within(reportsContainer).getByText('February transaction')).toBeInTheDocument();
        expect(within(reportsContainer).getByText('March transaction')).toBeInTheDocument();
      });
    });
  });
});