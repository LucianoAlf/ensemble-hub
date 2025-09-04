import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions } from '@/hooks/useFinancialData';
import { supabase } from '@/integrations/supabase/client';
import { FinancialTransaction } from '@/types/financial';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
  },
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useTransactions Hook Integration Tests', () => {
  const mockTransactions: FinancialTransaction[] = [
    {
      id: '1',
      tenant_id: 'test-tenant-id',
      type: 'income',
      status: 'completed',
      category: 'performance',
      amount: 1000,
      gross_amount: 1000,
      net_amount: 850,

      date: '2024-01-15',
      description: 'Show payment',
      payment_method: 'bank_transfer',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      tenant_id: 'test-tenant-id',
      type: 'expense',
      status: 'pending',
      category: 'transport',
      amount: 200,
      gross_amount: 200,
      net_amount: 200,

      date: '2024-01-16',
      description: 'Transport costs',
      payment_method: 'cash',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementation
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTransactions,
            error: null,
          }),
        }),
      }),
    } as any);

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    } as any);
  });

  describe('Data Fetching', () => {
    it('should fetch transactions successfully', async () => {
      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      expect(result.current.loading).toBe(true);
      expect(result.current.transactions).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toEqual(mockTransactions);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const errorMessage = 'Database connection failed';
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: errorMessage },
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should filter transactions by tenant_id', async () => {
      renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      });

      const selectMock = mockSupabase.from('transactions').select();
      expect(selectMock.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });

  describe('Real-time Updates', () => {
    it('should setup real-time subscription', async () => {
      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabase.channel).toHaveBeenCalledWith('transactions-test-tenant-id');
    });

    it('should handle INSERT events', async () => {
      const newTransaction: FinancialTransaction = {
        id: '3',
        tenant_id: 'test-tenant-id',
        type: 'income',
        status: 'pending',
        category: 'merchandise',
        amount: 300,
        gross_amount: 300,
        net_amount: 270,

        date: '2024-01-17',
        description: 'Merchandise sales',
        payment_method: 'card',
        created_at: '2024-01-17T10:00:00Z',
        updated_at: '2024-01-17T10:00:00Z',
      };

      let insertCallback: (payload: any) => void;
      mockSupabase.channel.mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'postgres_changes') {
            insertCallback = callback;
          }
          return mockSupabase.channel('test-channel');
        }),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      } as any);

      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate INSERT event
      insertCallback!({
        eventType: 'INSERT',
        new: newTransaction,
        old: null,
      });

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(3);
        expect(result.current.transactions).toContainEqual(newTransaction);
      });
    });

    it('should handle UPDATE events', async () => {
      let updateCallback: (payload: any) => void;
      mockSupabase.channel.mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'postgres_changes') {
            updateCallback = callback;
          }
          return mockSupabase.channel('test-channel');
        }),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      } as any);

      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedTransaction = {
        ...mockTransactions[0],
        status: 'completed' as const,
        updated_at: '2024-01-18T10:00:00Z',
      };

      // Simulate UPDATE event
      updateCallback!({
        eventType: 'UPDATE',
        new: updatedTransaction,
        old: mockTransactions[0],
      });

      await waitFor(() => {
        const transaction = result.current.transactions.find(t => t.id === '1');
        expect(transaction?.status).toBe('completed');
      });
    });

    it('should handle DELETE events', async () => {
      let deleteCallback: (payload: any) => void;
      mockSupabase.channel.mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'postgres_changes') {
            deleteCallback = callback;
          }
          return mockSupabase.channel('test-channel');
        }),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      } as any);

      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate DELETE event
      deleteCallback!({
        eventType: 'DELETE',
        new: null,
        old: mockTransactions[0],
      });

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(1);
        expect(result.current.transactions.find(t => t.id === '1')).toBeUndefined();
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      const unsubscribeMock = jest.fn();
      mockSupabase.channel.mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: unsubscribeMock }),
      } as any);

      const { unmount } = renderHook(() => useTransactions('test-tenant-id'));

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity during rapid updates', async () => {
      let eventCallback: (payload: any) => void;
      mockSupabase.channel.mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'postgres_changes') {
            eventCallback = callback;
          }
          return mockSupabase.channel('test-channel');
        }),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      } as any);

      const { result } = renderHook(() => useTransactions('test-tenant-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate rapid updates
      const updates = [
        { eventType: 'UPDATE', new: { ...mockTransactions[0], status: 'processing' }, old: mockTransactions[0] },
        { eventType: 'UPDATE', new: { ...mockTransactions[0], status: 'completed' }, old: { ...mockTransactions[0], status: 'processing' } },
        { eventType: 'UPDATE', new: { ...mockTransactions[0], status: 'completed' }, old: { ...mockTransactions[0], status: 'pending' } },
      ];

      updates.forEach(update => eventCallback!(update));

      await waitFor(() => {
        const transaction = result.current.transactions.find(t => t.id === '1');
        expect(transaction?.status).toBe('settled');
      });

      // Ensure no duplicate transactions
      const transactionIds = result.current.transactions.map(t => t.id);
      const uniqueIds = [...new Set(transactionIds)];
      expect(transactionIds.length).toBe(uniqueIds.length);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Test concurrent fetch and real-time updates
      const { result, rerender } = renderHook(() => useTransactions('test-tenant-id'));

      // Initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(2);

      // Trigger re-fetch while processing real-time update
      rerender();

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(2);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      // First call fails
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Network error' },
            }),
          }),
        }),
      } as any);

      // Second call succeeds
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTransactions,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result, rerender } = renderHook(() => useTransactions('test-tenant-id'));

      // First render - should have error
      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Trigger retry
      rerender();

      // Should recover and load data
      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.transactions).toEqual(mockTransactions);
      });
    });
  });
});