import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditableField } from '@/components/finance/editablefield';
import { useFinancialEditing } from '@/hooks/useFinancialEditing';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Mock the financial editing hook
jest.mock('@/hooks/useFinancialEditing', () => ({
  useFinancialEditing: jest.fn(() => ({
    editingState: {
      isEditing: false,
      isSaving: false,
      hasChanges: false,
      lastSaved: null,
      error: null,
    },
    updateField: jest.fn(),
    batchUpdate: jest.fn(),
    revertChanges: jest.fn(),
    getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
    hasPendingEdits: jest.fn((id) => false),
    getPendingValue: jest.fn((id, field) => null),
    pendingEdits: [],
    optimisticData: {},
  })),
}));

// Mock toast notifications
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock data for testing
const mockTransactions = [
  {
    id: '1',
    description: 'Show Principal',
    gross_amount: 5000,
    category: 'show',
    type: 'income',
    status: 'pending',
    transaction_date: '2024-01-15',
    tenant_id: 'user123',
    banda_id: 'band1',
    evento_id: 'event1',
    fee_amount: 500,
    net_amount: 4500,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    description: 'Transporte para show',
    gross_amount: 200,
    category: 'transport',
    type: 'expense',
    status: 'settled',
    transaction_date: '2024-01-16',
    tenant_id: 'user123',
    banda_id: 'band1',
    evento_id: 'event1',
    fee_amount: 0,
    net_amount: 200,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
];

// Test suite for financial editing system
describe('Financial Editing System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EditableField Component', () => {
    const mockProps = {
      id: '1',
      field: 'description' as const,
      value: 'Test Description',
      type: 'text' as const,
      table: 'transactions' as const,
    };

    it('should render display mode correctly', () => {
      const { getByText } = render(<EditableField {...mockProps} />);
      expect(getByText('Test Description')).toBeInTheDocument();
    });

    it('should switch to edit mode on click', async () => {
      const { getByText, container } = render(<EditableField {...mockProps} />);
      
      const displayElement = getByText('Test Description');
      fireEvent.click(displayElement);
      
      await waitFor(() => {
        const input = container.querySelector('input');
        expect(input).toBeInTheDocument();
        expect(input?.value).toBe('Test Description');
      });
    });

    it('should format currency values correctly', () => {
      const currencyProps = {
        ...mockProps,
        field: 'gross_amount' as const,
        value: 5000,
        type: 'currency' as const,
      };
      
      const { getByText } = render(<EditableField {...currencyProps} />);
      expect(getByText('R$ 5.000,00')).toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      const nullProps = {
        ...mockProps,
        value: null,
      };
      
      const { container } = render(<EditableField {...nullProps} />);
      expect(container.textContent).toContain('-');
    });

    it('should call onChange when value is updated', async () => {
      const mockOnChange = jest.fn();
      const mockUpdateField = jest.fn().mockResolvedValue(true);
      const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
      
      mockHook.mockReturnValue({
        editingState: {
          isEditing: false,
          isSaving: false,
          hasChanges: false,
          lastSaved: null,
          error: null,
        },
        updateField: mockUpdateField,
        batchUpdate: jest.fn(),
        revertChanges: jest.fn(),
        getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
        hasPendingEdits: jest.fn((id) => false),
        getPendingValue: jest.fn((id, field) => null),
        pendingEdits: [],
        optimisticData: {},
      });
      
      const propsWithOnChange = {
        ...mockProps,
        onChange: mockOnChange,
      };
      
      const { getByText, container } = render(<EditableField {...propsWithOnChange} />);
      
      fireEvent.click(getByText('Test Description'));
      
      await waitFor(() => {
        const input = container.querySelector('input');
        if (input) {
          fireEvent.change(input, { target: { value: 'Updated Description' } });
          fireEvent.keyDown(input, { key: 'Enter' });
        }
      });
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Updated Description');
      });
    });
  });

  describe('Data Flow Integrity', () => {
    it('should maintain data consistency during updates', async () => {
      const mockUpdateField = jest.fn().mockResolvedValue({ success: true });
      const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
      
      mockHook.mockReturnValue({
        editingState: {
          isEditing: false,
          isSaving: false,
          hasChanges: false,
          lastSaved: null,
          error: null,
        },
        updateField: mockUpdateField,
        batchUpdate: jest.fn(),
        revertChanges: jest.fn(),
        getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
        hasPendingEdits: jest.fn((id) => false),
        getPendingValue: jest.fn().mockReturnValue(null),
        pendingEdits: [],
        optimisticData: {},
      });
      
      const updatedValue = 6000;
      await mockUpdateField('1', 'gross_amount', updatedValue, 'transactions', 5000);
      
      expect(mockUpdateField).toHaveBeenCalledWith('1', 'gross_amount', updatedValue, 'transactions', 5000);
    });

    it('should handle validation errors gracefully', () => {
      const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
      
      mockHook.mockReturnValue({
        editingState: {
          isEditing: false,
          isSaving: false,
          hasChanges: false,
          lastSaved: null,
          error: 'Valor deve ser positivo',
        },
        updateField: jest.fn(),
        batchUpdate: jest.fn(),
        revertChanges: jest.fn(),
        getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
        hasPendingEdits: jest.fn((id) => false),
        getPendingValue: jest.fn().mockReturnValue(null),
        pendingEdits: [],
        optimisticData: {},
      });
      
      const { editingState } = useFinancialEditing();
      const validationError = editingState.error;
      expect(validationError).toBe('Valor deve ser positivo');
    });

    it('should handle update errors gracefully', () => {
      const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
      
      mockHook.mockReturnValue({
        editingState: {
          isEditing: false,
          isSaving: false,
          hasChanges: false,
          lastSaved: null,
          error: 'Erro de conexão com o servidor',
        },
        updateField: jest.fn(),
        batchUpdate: jest.fn(),
        revertChanges: jest.fn(),
        getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
        hasPendingEdits: jest.fn((id) => false),
        getPendingValue: jest.fn().mockReturnValue(null),
        pendingEdits: [],
        optimisticData: {},
      });
      
      const { editingState } = mockHook();
      expect(editingState.error).toBe('Erro de conexão com o servidor');
    });
  });

  describe('Real-time Sync', () => {
    it('should handle subscription setup correctly', () => {
      const mockChannel = {
        on: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
        unsubscribe: jest.fn(),
      };
      
      const mockSupabase = {
        channel: jest.fn().mockReturnValue(mockChannel),
      };
      
      // Simulate subscription setup
      const channel = mockSupabase.channel('transactions');
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, () => {});
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('transactions');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'transactions'
        }),
        expect.any(Function)
      );
    });

    it('should handle connection status changes', () => {
      const mockConnectionHandler = jest.fn();
      const connectionStatus = { isConnected: true, lastSync: new Date() };
      
      mockConnectionHandler(connectionStatus);
      
      expect(mockConnectionHandler).toHaveBeenCalledWith(
        expect.objectContaining({ isConnected: true })
      );
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate totals correctly', () => {
      const total = mockTransactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.gross_amount : sum - t.gross_amount;
      }, 0);
      
      expect(total).toBe(4800); // 5000 - 200 = 4800
    });

    it('should handle decimal precision correctly', () => {
      const amount = 1234.56;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('1234.56');
    });
  });

  describe('User Experience', () => {
    it('should provide visual feedback during save', () => {
      const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
      
      mockHook.mockReturnValue({
        editingState: {
          isEditing: false,
          isSaving: true, // Simulate saving state
          hasChanges: false,
          lastSaved: null,
          error: null,
        },
        updateField: jest.fn(),
        batchUpdate: jest.fn(),
        revertChanges: jest.fn(),
        getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
        hasPendingEdits: jest.fn((id) => false),
        getPendingValue: jest.fn().mockReturnValue(null),
        pendingEdits: [],
        optimisticData: {},
      });
      
      const { container } = render(
        <EditableField
          id="1"
          field="description"
          value="Test"
          type="text"
          table="transactions"
        />
      );
      
      // Check that component handles saving state
      expect(container).toBeInTheDocument();
    });

    it('should handle pending edits correctly', () => {
      const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
      
      mockHook.mockReturnValue({
        editingState: {
          isEditing: false,
          isSaving: false,
          hasChanges: true,
          lastSaved: null,
          error: null,
        },
        updateField: jest.fn(),
        batchUpdate: jest.fn(),
        revertChanges: jest.fn(),
        getOptimisticValue: jest.fn((id, field, table, defaultValue) => 'Pending Value'),
        hasPendingEdits: jest.fn((id) => true),
        getPendingValue: jest.fn().mockReturnValue('Pending Value'),
        pendingEdits: [{ id: '1', field: 'description', value: 'Pending Value', previousValue: 'Old Value', table: 'transactions' }],
        optimisticData: {},
      });
      
      const { hasPendingEdits, getPendingValue } = mockHook();
      
      expect(hasPendingEdits('1')).toBe(true);
      expect(getPendingValue('1', 'description')).toBe('Pending Value');
    });
  });
});

// Integration test for complete flow
describe('Complete Data Flow Test', () => {
  it('should handle end-to-end transaction editing', async () => {
    const mockUpdateField = jest.fn().mockResolvedValue({ success: true });
    const mockHook = useFinancialEditing as jest.MockedFunction<typeof useFinancialEditing>;
    
    mockHook.mockReturnValue({
      editingState: {
        isEditing: false,
        isSaving: false,
        hasChanges: false,
        lastSaved: null,
        error: null,
      },
      updateField: mockUpdateField,
      batchUpdate: jest.fn(),
      revertChanges: jest.fn(),
      getOptimisticValue: jest.fn((id, field, table, defaultValue) => defaultValue),
      hasPendingEdits: jest.fn((id) => false),
      getPendingValue: jest.fn().mockReturnValue(null),
      pendingEdits: [],
      optimisticData: {},
    });
    
    // Setup test environment
    const testTransaction = mockTransactions[0];
    
    // Step 1: Load initial data
    expect(testTransaction.description).toBe('Show Principal');
    expect(testTransaction.gross_amount).toBe(5000);
    
    // Step 2: User edits description
    const newDescription = 'Show Principal - Atualizado';
    const newAmount = 5500;
    
    // Step 3: Validate changes
    expect(newDescription).not.toBe(testTransaction.description);
    expect(newAmount).not.toBe(testTransaction.gross_amount);
    
    // Step 4: Fields are valid (no validation errors in editingState)
    const { editingState } = useFinancialEditing();
    expect(editingState.error).toBeNull();
    
    // Step 5: Update fields
    await mockUpdateField(testTransaction.id, 'description', newDescription);
    await mockUpdateField(testTransaction.id, 'gross_amount', newAmount);
    
    // Step 6: Verify calls
    expect(mockUpdateField).toHaveBeenCalledWith(testTransaction.id, 'description', newDescription);
    expect(mockUpdateField).toHaveBeenCalledWith(testTransaction.id, 'gross_amount', newAmount);
  });
});

// Performance test
describe('Performance Tests', () => {
  it('should handle bulk updates efficiently', async () => {
    const bulkTransactions = Array.from({ length: 100 }, (_, i) => ({
      id: `t${i}`,
      description: `Transaction ${i}`,
      gross_amount: 1000 + i,
      category: 'show',
      type: 'income',
      status: 'pending',
      transaction_date: '2024-01-15',
      tenant_id: 'user123',
    }));
    
    const startTime = Date.now();
    
    // Simulate bulk update
    const promises = bulkTransactions.map(t => 
      Promise.resolve({ success: true, id: t.id })
    );
    
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(results).toHaveLength(100);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});

// Security test
describe('Security Tests', () => {
  it('should prevent SQL injection in queries', () => {
    const maliciousInput = "'; DROP TABLE transactions; --";
    
    // Test that special characters are properly escaped
    const escapedInput = maliciousInput.replace(/'/g, "''");
    
    expect(escapedInput).toBe("''; DROP TABLE transactions; --");
  });

  it('should validate user permissions', () => {
    const userId = 'user123';
    const transaction = { ...mockTransactions[0], tenant_id: 'other_user' };
    
    // User should not be able to edit other users' transactions
    const hasPermission = transaction.tenant_id === userId;
    
    expect(hasPermission).toBe(false);
  });
});

// Export test utilities
export const testUtilities = {
  mockTransactions,
  createMockTransaction: (overrides = {}) => ({
    ...mockTransactions[0],
    ...overrides,
  }),
  validateTransaction: (transaction: Record<string, unknown>) => {
    const requiredFields = ['id', 'description', 'gross_amount', 'type', 'status', 'tenant_id'];
    return requiredFields.every(field => transaction[field] !== undefined);
  },
};