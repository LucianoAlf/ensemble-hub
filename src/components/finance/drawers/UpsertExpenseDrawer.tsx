import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { TrendingDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEvents, EventSelectOption } from "@/hooks/useEvents";

const expenseSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  evento_id: z.string().optional(),
  banda_id: z.string().optional(),
  transaction_date: z.date({ required_error: "Data é obrigatória" }),
  gross_amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  counterparty: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "settled"]).default("pending"),
  settled_at: z.date().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface UpsertExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId?: string;
}

export const UpsertExpenseDrawer = ({ open, onOpenChange, expenseId }: UpsertExpenseDrawerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventSelectOption[]>([]);
  const { getEventsForSelect } = useEvents();
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      status: "pending",
      transaction_date: new Date()
    }
  });

  // Carregar eventos quando o modal abre
  useEffect(() => {
    const loadEvents = async () => {
      if (open) {
        try {
          const eventsData = await getEventsForSelect();
          setEvents(eventsData);
        } catch (error) {
          console.error('Erro ao carregar eventos:', error);
        }
      }
    };
    loadEvents();
  }, [open, getEventsForSelect]);

  // Validação inteligente de status baseado na data
  const watchTransactionDate = form.watch('transaction_date');
  useEffect(() => {
    if (watchTransactionDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(watchTransactionDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      // Se a data é passada, sugere 'settled' (liquidado)
      // Se a data é futura, mantém 'pending'
      if (selectedDate < today && form.getValues('status') === 'pending') {
        // Não altera automaticamente, mas poderia mostrar um aviso
        console.log('💡 Dica: Despesa com data passada geralmente já foi liquidada');
      }
    }
  }, [watchTransactionDate, form]);

  // Carregar dados da transação quando em modo de edição
  useEffect(() => {
    const loadTransactionData = async () => {
      if (!expenseId || !open) return;

      try {
        console.log('🔄 Carregando dados da despesa:', expenseId);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', expenseId)
          .eq('tenant_id', 'd93bd1e5-245e-4a40-9027-4bd669ccc390')
          .single();

        if (error) {
          console.error('❌ Erro ao carregar despesa:', error);
          toast.error('Erro ao carregar dados da despesa');
          return;
        }

        if (data) {
          console.log('✅ Dados da despesa carregados:', data);
          
          form.reset({
            category: data.category || '',
            evento_id: data.evento_id || '',
            banda_id: data.banda_id || '',
            transaction_date: new Date(data.transaction_date),
            gross_amount: data.gross_amount || 0,
            counterparty: data.counterparty || '',
            description: data.description || '',
            status: (data.status as 'pending' | 'settled') || 'pending',
            settled_at: data.settled_at ? new Date(data.settled_at) : undefined
          });
        }
      } catch (error) {
        console.error('❌ Erro ao buscar despesa:', error);
        toast.error('Erro ao carregar dados da despesa');
      }
    };

    loadTransactionData();
  }, [expenseId, open, form]);

  // Reset form apenas para nova transação
  useEffect(() => {
    if (open && !expenseId) {
      form.reset({
        category: "",
        gross_amount: 0,
        status: "pending",
        transaction_date: new Date()
      });
    }
  }, [open, expenseId, form]);

  const categories = [
    "Transporte",
    "Alimentação",
    "Locação de equipamento",
    "Locação de espaço",
    "Marketing",
    "Equipe técnica",
    "ECAD/Taxas",
    "Outros"
  ];

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save expense
      console.log("Expense data:", data);
      
      toast.success(expenseId ? "Despesa atualizada com sucesso!" : "Despesa registrada com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao salvar despesa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <TrendingDown className="h-5 w-5 text-red-600" />
            {expenseId ? 'Editar Despesa' : 'Nova Despesa'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {expenseId ? 'Atualize as informações da despesa.' : 'Registre uma nova despesa no sistema financeiro'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
            {/* Primeira linha - Categoria, Evento */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transport">Transporte</SelectItem>
                        <SelectItem value="equipment">Equipamento</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="venue">Local</SelectItem>
                        <SelectItem value="food">Alimentação</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um evento (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum evento</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {new Date(event.date).toLocaleDateString('pt-BR')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* Segunda linha - Valor e Data */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gross_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.000,00"
                          className="pl-10"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <DatePickerField
                      label="Data *"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data"
                      required
                      allowPastDates={true}
                      calendarTheme="expense"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Terceira linha - Fornecedor e Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="counterparty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor/Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Loja, Empresa, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="settled">Liquidado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a despesa..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de ação */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3 mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-colors duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                onClick={form.handleSubmit(onSubmit)}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg"
              >
                {isLoading ? "Salvando..." : (expenseId ? "Atualizar Despesa" : "Criar Despesa")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};