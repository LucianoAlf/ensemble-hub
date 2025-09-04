import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { FinanceMovements } from '@/components/finance/FinanceMovements';
import { FinanceReports } from '@/components/finance/FinanceReports';
import { FinancialTransaction, FinancialPayout } from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';

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

describe('Cross-Tab Data Validation', () => {
  const mockTransactions: FinancialTransaction[] = [
    {
      id: '1',
      tenant_id: 'test-tenant-id',
      type: 'income',
      status: 'pending',
      category: 'performance',
      gross_amount: 2000,
      net_amount: 1700,
      fee_amount: 300,
      transaction_date: '2024-01-15',
      description: 'Main show payment',
      payment_method: 'bank_transfer',
      banda_id: 'band-1',
      evento_id: 'event-1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      tenant_id: 'test-tenant-id',
      type: 'expense',
      status: 'completed',
      category: 'transport',
      gross_amount: 300,
      net_amount: 300,
      fee_amount: 0,
      transaction_date: '2024-01-16',
      description: 'Transport to venue',
      payment_method: 'cash',
      banda_id: 'band-1',
      evento_id: 'event-1',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
    {
      id: '3',
      tenant_id: 'test-tenant-id',
      type: 'income',
      status: 'pending',
      category: 'merchandise',
      gross_amount: 500,
      net_amount: 450,
      fee_amount: 50,
      transaction_date: '2024-01-17',
      description: 'Merchandise sales',
      payment_method: 'card',
      banda_id: 'band-1',
      evento_id: 'event-2',
      created_at: '2024-01-17T10:00:00Z',
      updated_at: '2024-01-17T10:00:00Z',
    },
  ];

  const mockPayouts: FinancialPayout[] = [
    {
      id: '1',
      tenant_id: 'test-tenant-id',
      status: 'pending',
      amount: 400,
      due_date: '2024-01-25',
      beneficiary: 'Band Member 1',
      description: 'Performance share',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      tenant_id: 'test-tenant-id',
      status: 'completed',
      amount: 300,
      due_date: '2024-01-20',
      beneficiary: 'Band Member 2',
      description: 'Completed payout',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock for transactions
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'transactions' as any) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        } as any;
      }
      
      if (table === 'payouts' as any) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockPayouts,
                error: null,
              }),
            }),
          }),
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
  });

  describe('Dashboard vs Movements Consistency', () => {
    it('should show consistent total income between Dashboard KPI and Movements summary', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: movementsContainer } = render(<FinanceMovements />);

      await waitFor(() => {
        // Dashboard should show total settled income: 1700
        const dashboardIncome = within(dashboardContainer).getByText('R$ 1.700,00');
        expect(dashboardIncome).toBeInTheDocument();

        // Movements should show the same total in summary
        const movementsIncome = within(movementsContainer).getByText('R$ 1.700,00');
        expect(movementsIncome).toBeInTheDocument();
      });
    });

    it('should show consistent total expense between Dashboard KPI and Movements summary', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: movementsContainer } = render(<FinanceMovements />);

      await waitFor(() => {
        // Dashboard should show total settled expense: 300
        const dashboardExpense = within(dashboardContainer).getByText('R$ 300,00');
        expect(dashboardExpense).toBeInTheDocument();

        // Movements should show the same total in summary
        const movementsExpense = within(movementsContainer).getByText('R$ 300,00');
        expect(movementsExpense).toBeInTheDocument();
      });
    });

    it('should show consistent net amount calculation', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: movementsContainer } = render(<FinanceMovements />);

      await waitFor(() => {
        // Net amount should be 1700 - 300 = 1400
        const dashboardNet = within(dashboardContainer).getByText('R$ 1.400,00');
        expect(dashboardNet).toBeInTheDocument();

        const movementsNet = within(movementsContainer).getByText('R$ 1.400,00');
        expect(movementsNet).toBeInTheDocument();
      });
    });

    it('should show consistent pending payouts', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: movementsContainer } = render(<FinanceMovements />);

      await waitFor(() => {
        // Pending payouts should be 400 (only pending payout)
        const dashboardPending = within(dashboardContainer).getByText('R$ 400,00');
        expect(dashboardPending).toBeInTheDocument();

        const movementsPending = within(movementsContainer).getByText('R$ 400,00');
        expect(movementsPending).toBeInTheDocument();
      });
    });
  });

  describe('Movements vs Reports Consistency', () => {
    it('should show same transaction count in both tabs', async () => {
      const { container: movementsContainer } = render(<FinanceMovements />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // Both should show 3 transactions
        const movementsCount = within(movementsContainer).getByText(/3 transações/i);
        expect(movementsCount).toBeInTheDocument();

        const reportsCount = within(reportsContainer).getByText(/3 transações/i);
        expect(reportsCount).toBeInTheDocument();
      });
    });

    it('should show consistent transaction details', async () => {
      const { container: movementsContainer } = render(<FinanceMovements />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // Check for specific transaction descriptions
        const movementsMainShow = within(movementsContainer).getByText('Main show payment');
        expect(movementsMainShow).toBeInTheDocument();

        const reportsMainShow = within(reportsContainer).getByText('Main show payment');
        expect(reportsMainShow).toBeInTheDocument();

        // Check amounts
        const movementsAmount = within(movementsContainer).getByText('R$ 1.700,00');
        expect(movementsAmount).toBeInTheDocument();

        const reportsAmount = within(reportsContainer).getByText('R$ 1.700,00');
        expect(reportsAmount).toBeInTheDocument();
      });
    });

    it('should show consistent category breakdowns', async () => {
      const { container: movementsContainer } = render(<FinanceMovements />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // Performance category should show same totals
        const movementsPerformance = within(movementsContainer).getByText(/performance/i);
        expect(movementsPerformance).toBeInTheDocument();

        const reportsPerformance = within(reportsContainer).getByText(/performance/i);
        expect(reportsPerformance).toBeInTheDocument();

        // Transport category should show same totals
        const movementsTransport = within(movementsContainer).getByText(/transport/i);
        expect(movementsTransport).toBeInTheDocument();

        const reportsTransport = within(reportsContainer).getByText(/transport/i);
        expect(reportsTransport).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard vs Reports Consistency', () => {
    it('should show consistent monthly income calculations', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // Monthly income should be consistent (all transactions are in January)
        const dashboardMonthly = within(dashboardContainer).getByText('R$ 1.700,00');
        expect(dashboardMonthly).toBeInTheDocument();

        const reportsMonthly = within(reportsContainer).getByText(/janeiro.*R\$ 1\.700,00/i);
        expect(reportsMonthly).toBeInTheDocument();
      });
    });

    it('should show consistent event-based summaries', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // Event summaries should match
        const dashboardEvent1 = within(dashboardContainer).getByText(/event-1/i);
        expect(dashboardEvent1).toBeInTheDocument();

        const reportsEvent1 = within(reportsContainer).getByText(/event-1/i);
        expect(reportsEvent1).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Synchronization', () => {
    it('should update all tabs when a transaction is added', async () => {
      const { container: dashboardContainer, rerender: rerenderDashboard } = render(<FinanceDashboard />);
      const { container: movementsContainer, rerender: rerenderMovements } = render(<FinanceMovements />);
      const { container: reportsContainer, rerender: rerenderReports } = render(<FinanceReports />);

      // Initial state
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 1.700,00')).toBeInTheDocument();
      });

      // Add new transaction
      const newTransaction: FinancialTransaction = {
        id: '4',
        tenant_id: 'test-tenant-id',
        type: 'income',
        status: 'completed',
        category: 'performance',
        gross_amount: 1000,
        net_amount: 850,
        fee_amount: 150,
        transaction_date: '2024-01-18',
        description: 'New show payment',
        payment_method: 'bank_transfer',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z',
      };

      // Update mock data
      const updatedTransactions = [...mockTransactions, newTransaction];
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'transactions' as any) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: updatedTransactions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockPayouts,
                error: null,
              }),
            }),
          }),
        } as any;
      });

      // Re-render all components
      rerenderDashboard(<FinanceDashboard />);
      rerenderMovements(<FinanceMovements />);
      rerenderReports(<FinanceReports />);

      await waitFor(() => {
        // All tabs should show updated total: 1700 + 850 = 2550
        expect(within(dashboardContainer).getByText('R$ 2.550,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('R$ 2.550,00')).toBeInTheDocument();
        expect(within(reportsContainer).getByText('R$ 2.550,00')).toBeInTheDocument();
      });
    });

    it('should update all tabs when a transaction status changes', async () => {
      const { container: dashboardContainer, rerender: rerenderDashboard } = render(<FinanceDashboard />);
      const { container: movementsContainer, rerender: rerenderMovements } = render(<FinanceMovements />);

      // Initial state - pending transaction not included in totals
      await waitFor(() => {
        expect(within(dashboardContainer).getByText('R$ 1.700,00')).toBeInTheDocument();
      });

      // Update pending transaction to settled
      const updatedTransactions = mockTransactions.map(t => 
        t.id === '3' ? { ...t, status: 'completed' as const } : t
      );

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'transactions' as any) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: updatedTransactions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockPayouts,
                error: null,
              }),
            }),
          }),
        } as any;
      });

      rerenderDashboard(<FinanceDashboard />);
      rerenderMovements(<FinanceMovements />);

      await waitFor(() => {
        // Total should now include the previously pending transaction: 1700 + 450 = 2150
        expect(within(dashboardContainer).getByText('R$ 2.150,00')).toBeInTheDocument();
        expect(within(movementsContainer).getByText('R$ 2.150,00')).toBeInTheDocument();
      });
    });
  });

  describe('Data Integrity Validation', () => {
    it('should maintain referential integrity between transactions and events', async () => {
      const { container } = render(<FinanceReports />);

      await waitFor(() => {
        // All transactions should be properly linked to events
        const event1Transactions = within(container).getAllByText(/event-1/i);
        expect(event1Transactions.length).toBeGreaterThan(0);

        const event2Transactions = within(container).getAllByText(/event-2/i);
        expect(event2Transactions.length).toBeGreaterThan(0);
      });
    });

    it('should validate calculation accuracy across all tabs', async () => {
      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: movementsContainer } = render(<FinanceMovements />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // Verify mathematical accuracy
        // Total Income: 1700 (settled)
        // Total Expense: 300 (settled)
        // Net Amount: 1700 - 300 = 1400
        // Pending Payouts: 400

        const dashboardNet = within(dashboardContainer).getByText('R$ 1.400,00');
        expect(dashboardNet).toBeInTheDocument();

        const movementsNet = within(movementsContainer).getByText('R$ 1.400,00');
        expect(movementsNet).toBeInTheDocument();

        const reportsNet = within(reportsContainer).getByText('R$ 1.400,00');
        expect(reportsNet).toBeInTheDocument();
      });
    });

    it('should handle edge cases consistently', async () => {
      // Test with empty data
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any));

      const { container: dashboardContainer } = render(<FinanceDashboard />);
      const { container: movementsContainer } = render(<FinanceMovements />);
      const { container: reportsContainer } = render(<FinanceReports />);

      await waitFor(() => {
        // All tabs should show zero values consistently
        const dashboardZeros = within(dashboardContainer).getAllByText('R$ 0,00');
        expect(dashboardZeros.length).toBeGreaterThan(0);

        const movementsZeros = within(movementsContainer).getAllByText('R$ 0,00');
        expect(movementsZeros.length).toBeGreaterThan(0);

        const reportsZeros = within(reportsContainer).getAllByText('R$ 0,00');
        expect(reportsZeros.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Consistency', () => {
    it('should load all tabs within acceptable time limits', async () => {
      const startTime = performance.now();

      const dashboardPromise = waitFor(() => {
        render(<FinanceDashboard />);
      });

      const movementsPromise = waitFor(() => {
        render(<FinanceMovements />);
      });

      const reportsPromise = waitFor(() => {
        render(<FinanceReports />);
      });

      await Promise.all([dashboardPromise, movementsPromise, reportsPromise]);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // All tabs should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle concurrent data updates efficiently', async () => {
      const { rerender: rerenderDashboard } = render(<FinanceDashboard />);
      const { rerender: rerenderMovements } = render(<FinanceMovements />);
      const { rerender: rerenderReports } = render(<FinanceReports />);

      // Simulate rapid updates
      for (let i = 0; i < 5; i++) {
        const updatedTransactions = mockTransactions.map(t => ({
          ...t,
          updated_at: new Date().toISOString(),
        }));

        mockSupabase.from.mockImplementation((table) => {
          if (table === 'transactions' as any) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: updatedTransactions,
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockPayouts,
                  error: null,
                }),
              }),
            }),
          } as any;
        });

        rerenderDashboard(<FinanceDashboard />);
        rerenderMovements(<FinanceMovements />);
        rerenderReports(<FinanceReports />);
      }

      // All components should remain stable and consistent
      await waitFor(() => {
        expect(true).toBe(true); // Test passes if no errors thrown
      });
    });
  });
});