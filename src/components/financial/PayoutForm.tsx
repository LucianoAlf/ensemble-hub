import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Schema validado com o backend
const payoutSchema = z.object({
  tenant_id: z.string().uuid('ID do tenant inválido'),
  banda_id: z.string().uuid('ID da banda inválido'),
  evento_id: z.string().uuid('ID do evento inválido').optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  payout_date: z.string().datetime('Data do pagamento inválida'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  payment_method: z.string().min(1, 'Método de pagamento é obrigatório'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

interface PayoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PayoutFormData) => Promise<{ success: boolean; error?: string }>;
  tenantId: string;
  bandaId: string;
  eventoId?: string;
  initialData?: any;
}

export const PayoutForm: React.FC<PayoutFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  tenantId,
  bandaId,
  eventoId,
  initialData,
}) => {
  const form = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      tenant_id: tenantId,
      banda_id: bandaId,
      evento_id: eventoId || initialData?.evento_id || '',
      amount: initialData?.amount || 0,
      status: initialData?.status || 'pending',
      payout_date: initialData?.payout_date || new Date().toISOString(),
      description: initialData?.description || '',
      payment_method: initialData?.payment_method || '',
      reference: initialData?.reference || '',
      notes: initialData?.notes || '',
    },
  });

  const isEditing = !!initialData;

  const handleSubmit = async (data: PayoutFormData) => {
    const result = await onSubmit(data);
    
    if (result.success) {
      form.reset({
        tenant_id: tenantId,
        banda_id: bandaId,
        evento_id: eventoId || '',
        amount: 0,
        status: 'pending',
        payout_date: new Date().toISOString(),
        description: '',
        payment_method: '',
        reference: '',
        notes: '',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Pagamento' : 'Novo Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os dados do pagamento existente.' 
              : 'Crie um novo pagamento para a banda.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Campos ocultos */}
            <input type="hidden" {...form.register('tenant_id')} />
            <input type="hidden" {...form.register('banda_id')} />
            
            {eventoId && <input type="hidden" {...form.register('evento_id')} />}

            {/* Valor */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Pagamento de cachet, Prêmio por performance..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Método de Pagamento */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data do Pagamento */}
            <FormField
              control={form.control}
              name="payout_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? date.toISOString() : new Date().toISOString());
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Referência */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Número de comprovante, protocolo..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Código de referência para rastreamento (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais sobre este pagamento..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Informações complementares sobre o pagamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de Ação */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting 
                  ? (isEditing ? 'Atualizando...' : 'Criando...') 
                  : (isEditing ? 'Atualizar' : 'Criar')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};