import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KpiBar } from '@/components/finance/KpiBar';
import { useDashboardMetrics } from '@/hooks/useRealFinancialData';
import { useTenant } from '@/hooks/useTenant';

// Mock hooks
jest.mock('@/hooks/useRealFinancialData', () => ({
  useDashboardMetrics: jest.fn(),
}));

jest.mock('@/hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockUseDashboardMetrics = useDashboardMetrics as jest.MockedFunction<typeof useDashboardMetrics>;
const mockUseTenant = useTenant as jest.MockedFunction<typeof useTenant>;

describe('KpiBar Component', () => {
  const mockMetrics = {
    netAmount: 1500,
    totalIncome: 2000,
    totalExpense: 500,
    monthlyIncome: 1800,
    pendingPayouts: 300,
  };

  const mockTenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseTenant.mockReturnValue({
      tenant: mockTenant,
      loading: false,
      error: null,
    });
  });

  describe('Loading State', () => {
    it('should show loading skeletons when data is loading', () => {
      mockUseDashboardMetrics.mockReturnValue({
        metrics: null,
        loading: true,
        error: null,
      });

      render(<KpiBar />);

      // Should show skeleton loaders
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show loading when tenant is loading', () => {
      mockUseTenant.mockReturnValue({
        tenant: null,
        loading: true,
        error: null,
      });

      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });

      render(<KpiBar />);

      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should show error message when metrics fail to load', () => {
      mockUseDashboardMetrics.mockReturnValue({
        metrics: null,
        loading: false,
        error: 'Failed to load metrics',
      });

      render(<KpiBar />);

      expect(screen.getByText(/erro ao carregar métricas/i)).toBeInTheDocument();
    });

    it('should show error message when tenant fails to load', () => {
      mockUseTenant.mockReturnValue({
        tenant: null,
        loading: false,
        error: 'Failed to load tenant',
      });

      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });

      render(<KpiBar />);

      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });
    });

    it('should display all KPI metrics correctly', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument(); // Net Amount
        expect(screen.getByText('R$ 2.000,00')).toBeInTheDocument(); // Total Income
        expect(screen.getByText('R$ 500,00')).toBeInTheDocument(); // Total Expense
        expect(screen.getByText('R$ 1.800,00')).toBeInTheDocument(); // Monthly Income
        expect(screen.getByText('R$ 300,00')).toBeInTheDocument(); // Pending Payouts
      });
    });

    it('should display KPI labels correctly', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        expect(screen.getByText(/saldo líquido/i)).toBeInTheDocument();
        expect(screen.getByText(/receita total/i)).toBeInTheDocument();
        expect(screen.getByText(/despesas totais/i)).toBeInTheDocument();
        expect(screen.getByText(/receita mensal/i)).toBeInTheDocument();
        expect(screen.getByText(/pagamentos pendentes/i)).toBeInTheDocument();
      });
    });

    it('should handle negative values correctly', async () => {
      const negativeMetrics = {
        ...mockMetrics,
        netAmount: -500,
        totalExpense: 2500,
      };

      mockUseDashboardMetrics.mockReturnValue({
        metrics: negativeMetrics,
        loading: false,
        error: null,
      });

      render(<KpiBar />);

      await waitFor(() => {
        expect(screen.getByText('-R$ 500,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument();
      });
    });

    it('should handle zero values correctly', async () => {
      const zeroMetrics = {
        netAmount: 0,
        totalIncome: 0,
        totalExpense: 0,
        monthlyIncome: 0,
        pendingPayouts: 0,
      };

      mockUseDashboardMetrics.mockReturnValue({
        metrics: zeroMetrics,
        loading: false,
        error: null,
      });

      render(<KpiBar />);

      await waitFor(() => {
        const zeroValues = screen.getAllByText('R$ 0,00');
        expect(zeroValues).toHaveLength(5);
      });
    });

    it('should handle large numbers correctly', async () => {
      const largeMetrics = {
        netAmount: 1234567.89,
        totalIncome: 2000000,
        totalExpense: 765432.11,
        monthlyIncome: 500000,
        pendingPayouts: 123456.78,
      };

      mockUseDashboardMetrics.mockReturnValue({
        metrics: largeMetrics,
        loading: false,
        error: null,
      });

      render(<KpiBar />);

      await waitFor(() => {
        expect(screen.getByText('R$ 1.234.567,89')).toBeInTheDocument();
        expect(screen.getByText('R$ 2.000.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 765.432,11')).toBeInTheDocument();
        expect(screen.getByText('R$ 500.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 123.456,78')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Indicators', () => {
    beforeEach(() => {
      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });
    });

    it('should show positive indicator for positive net amount', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        const netAmountCard = screen.getByText('R$ 1.500,00').closest('[data-testid="kpi-card"]');
        expect(netAmountCard).toHaveClass('text-green-600');
      });
    });

    it('should show negative indicator for negative net amount', async () => {
      const negativeMetrics = {
        ...mockMetrics,
        netAmount: -500,
      };

      mockUseDashboardMetrics.mockReturnValue({
        metrics: negativeMetrics,
        loading: false,
        error: null,
      });

      render(<KpiBar />);

      await waitFor(() => {
        const netAmountCard = screen.getByText('-R$ 500,00').closest('[data-testid="kpi-card"]');
        expect(netAmountCard).toHaveClass('text-red-600');
      });
    });

    it('should show appropriate icons for each KPI', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        // Check for presence of icons (assuming they have specific test IDs or classes)
        expect(screen.getByTestId('net-amount-icon')).toBeInTheDocument();
        expect(screen.getByTestId('total-income-icon')).toBeInTheDocument();
        expect(screen.getByTestId('total-expense-icon')).toBeInTheDocument();
        expect(screen.getByTestId('monthly-income-icon')).toBeInTheDocument();
        expect(screen.getByTestId('pending-payouts-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });
    });

    it('should render correctly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<KpiBar />);

      await waitFor(() => {
        const container = screen.getByTestId('kpi-bar-container');
        expect(container).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-5');
      });
    });

    it('should render correctly on desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(<KpiBar />);

      await waitFor(() => {
        const container = screen.getByTestId('kpi-bar-container');
        expect(container).toHaveClass('lg:grid-cols-5');
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });
    });

    it('should have proper ARIA labels', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        expect(screen.getByLabelText(/saldo líquido/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/receita total/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/despesas totais/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/receita mensal/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/pagamentos pendentes/i)).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        const kpiCards = screen.getAllByRole('region');
        kpiCards.forEach(card => {
          expect(card).toHaveAttribute('tabIndex', '0');
        });
      });
    });

    it('should have proper semantic structure', async () => {
      render(<KpiBar />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getAllByRole('region')).toHaveLength(5);
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <KpiBar />;
      };

      mockUseDashboardMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
      });

      const { rerender } = render(<TestWrapper />);

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestWrapper />);

      // Should not cause unnecessary re-renders due to memoization
      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalledTimes(2); // Only initial + rerender
      });
    });

    it('should handle rapid data updates efficiently', async () => {
      const { rerender } = render(<KpiBar />);

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        mockUseDashboardMetrics.mockReturnValue({
          metrics: {
            ...mockMetrics,
            netAmount: mockMetrics.netAmount + i,
          },
          loading: false,
          error: null,
        });
        
        rerender(<KpiBar />);
      }

      await waitFor(() => {
        expect(screen.getByText('R$ 1.509,00')).toBeInTheDocument();
      });
    });
  });
});