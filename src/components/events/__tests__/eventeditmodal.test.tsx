import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do useSupabaseOptimized - deve vir antes das importações
jest.mock('@/hooks/useSupabaseOptimized', () => ({
  useSupabaseOptimized: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue({ data: null, error: null }),
    mutate: jest.fn().mockResolvedValue({ data: null, error: null }),
    clearCache: jest.fn()
  })
}));

// Mock do Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }))
  }
}));

import { EventEditModal } from '../EventEditModal';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

// Mock do toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));



// Mock dos componentes de UI
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h1 data-testid="dialog-title">{children}</h1>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type }: { 
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ 
    value, 
    onChange, 
    disabled, 
    ...props 
  }: {
    value?: string | number;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    disabled?: boolean;
    [key: string]: string | number | boolean | React.ChangeEventHandler<HTMLInputElement> | undefined;
  }) => (
    <input 
      data-testid="input" 
      value={value} 
      onChange={onChange} 
      disabled={disabled} 
      {...props}
    />
  )
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
    <div data-testid="select" onClick={() => onValueChange?.('show')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ 
    value, 
    onChange, 
    disabled 
  }: {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    disabled?: boolean;
  }) => (
    <textarea 
      data-testid="textarea" 
      value={value} 
      onChange={onChange} 
      disabled={disabled}
    />
  )
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-description">{children}</div>
}));

// Mock dos componentes customizados
jest.mock('@/components/forms/DatePickerField', () => ({
  DatePickerField: ({ onChange, disabled }: { onChange?: (date: Date) => void; disabled?: boolean }) => (
    <div 
      data-testid="date-picker" 
      onClick={() => !disabled && onChange?.(new Date('2024-12-31'))}
    >
      Date Picker
    </div>
  )
}));

jest.mock('@/components/forms/TimePickerField', () => ({
  TimePickerField: ({ onChange, disabled }: { onChange?: (time: string) => void; disabled?: boolean }) => (
    <div 
      data-testid="time-picker" 
      onClick={() => !disabled && onChange?.('20:00')}
    >
      Time Picker
    </div>
  )
}));

jest.mock('@/components/forms/LocationAutocomplete', () => ({
  LocationAutocomplete: ({ onLocationSelect, disabled }: { 
    onLocationSelect?: (location: { name: string; address: string; place_id: string }) => void;
    disabled?: boolean;
  }) => (
    <div 
      data-testid="location-picker" 
      onClick={() => !disabled && onLocationSelect?.({ name: 'Test Location', address: 'Test Address', place_id: 'test-place-id' })}
    >
      Location Picker
    </div>
  )
}));

jest.mock('@/components/forms/BandMultiSelect', () => ({
  BandMultiSelect: ({ onBandsChange, disabled }: { 
    onBandsChange?: (bands: Array<{ id: string; nome: string; genero: string | null }>) => void;
    disabled?: boolean;
  }) => (
    <div 
      data-testid="band-picker" 
      onClick={() => !disabled && onBandsChange?.([{ id: '1', nome: 'Test Band', genero: null }])}
    >
      Band Picker
    </div>
  )
}));

const mockSupabase = createClient('', '');

describe('EventEditModal', () => {
  const defaultProps = {
    eventId: 'test-event-id',
    mode: 'edit' as const,
    open: true,
    onOpenChange: jest.fn(),
    onEventUpdated: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o modal quando aberto', () => {
    render(<EventEditModal {...defaultProps} />);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Editar Evento');
  });

  it('deve exibir título correto no modo de visualização', () => {
    render(<EventEditModal {...defaultProps} mode="view" />);
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Visualizar Evento');
  });

  it('deve carregar dados do evento ao abrir', async () => {
    const mockRpc = jest.fn().mockResolvedValue({
      data: {
        id: 'test-event-id',
        nome: 'Test Event',
        tipo: 'show',
        data_evento: '2024-12-31',
        hora_evento: '20:00:00',
        local: 'Test Venue',
        endereco: 'Test Address',
        orcamento: 1000,
        descricao: 'Test Description',
        bandas: []
      },
      error: null
    });
    
    (mockSupabase.rpc as jest.Mock).mockImplementation(mockRpc);
    
    render(<EventEditModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('get_evento_full', { evento_id: 'test-event-id' });
    });
  });

  it('deve validar campos obrigatórios', async () => {
    render(<EventEditModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Erro de validação',
        variant: 'destructive'
      }));
    });
  });

  it('deve desabilitar campos no modo de visualização', () => {
    render(<EventEditModal {...defaultProps} mode="view" />);
    
    const inputs = screen.getAllByTestId('input');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('deve exibir erro quando falha ao carregar evento', async () => {
    const mockRpc = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Evento não encontrado' }
    });
    
(mockSupabase.rpc as jest.Mock).mockImplementation(mockRpc);
    
    render(<EventEditModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  it('deve implementar sistema de retry', async () => {
    const mockRpc = jest.fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'Erro temporário' } })
      .mockResolvedValueOnce({
        data: {
          id: 'test-event-id',
          nome: 'Test Event',
          tipo: 'show',
          data_evento: '2024-12-31',
          hora_evento: '20:00:00',
          local: 'Test Venue',
          endereco: 'Test Address',
          orcamento: 1000,
          descricao: 'Test Description',
          bandas: []
        },
        error: null
      });
    
(mockSupabase.rpc as jest.Mock).mockImplementation(mockRpc);
    
    render(<EventEditModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
  });

  it('deve chamar onEventUpdated após salvar com sucesso', async () => {
    const mockRpc = jest.fn()
      .mockResolvedValueOnce({
        data: {
          id: 'test-event-id',
          nome: 'Test Event',
          tipo: 'show',
          data_evento: '2024-12-31',
          hora_evento: '20:00:00',
          local: 'Test Venue',
          endereco: 'Test Address',
          orcamento: 1000,
          descricao: 'Test Description',
          bandas: []
        },
        error: null
      })
      .mockResolvedValueOnce({ data: null, error: null });
    
(mockSupabase.rpc as jest.Mock).mockImplementation(mockRpc);
    
    render(<EventEditModal {...defaultProps} />);
    
    await waitFor(() => {
      const nameInput = screen.getAllByTestId('input')[0];
      fireEvent.change(nameInput, { target: { value: 'Updated Event' } });
    });
    
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onEventUpdated).toHaveBeenCalledWith('test-event-id');
    });
  });
});