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
import { Users, Upload } from "lucide-react";
import { toast } from "sonner";
import { useEvents, EventSelectOption } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";

const payoutSchema = z.object({
  evento_id: z.string().min(1, "Evento é obrigatório"),
  beneficiary_type: z.enum(["band", "member", "crew", "manager"]),
  beneficiary_name: z.string().min(1, "Nome do beneficiário é obrigatório"),
  beneficiary_id: z.string().optional(),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  due_date: z.date({ required_error: "Data de vencimento é obrigatória" }),
  status: z.enum(["pending", "settled"]).default("pending"),
  payment_method: z.string().optional(),
  settled_at: z.date().optional(),
  notes: z.string().optional(),
  receipt_url: z.string().optional()
});

type PayoutFormData = z.infer<typeof payoutSchema>;

interface UpsertPayoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payoutId?: string;
}

export const UpsertPayoutDrawer = ({ open, onOpenChange, payoutId }: UpsertPayoutDrawerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventSelectOption[]>([]);
  const { getEventsForSelect } = useEvents();
  
  const form = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      beneficiary_type: "member",
      status: "pending",
      due_date: new Date(),
      beneficiary_name: "",
      amount: undefined,
      notes: "",
      payment_method: ""
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

  // Validação inteligente de status baseado na data de vencimento
  const watchDueDate = form.watch('due_date');
  useEffect(() => {
    if (watchDueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(watchDueDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      // Se a data de vencimento é passada, sugere 'settled' (liquidado)
      // Se a data é futura, mantém 'pending'
      if (selectedDate < today && form.getValues('status') === 'pending') {
        console.log('💡 Dica: Cachê com vencimento passado geralmente já foi pago');
      }
    }
  }, [watchDueDate, form]);

  const beneficiaryTypes = [
    { value: "band", label: "Banda" },
    { value: "member", label: "Membro" },
    { value: "crew", label: "Técnico" },
    { value: "manager", label: "Produtor/Manager" }
  ];

  const paymentMethods = [
    "PIX",
    "Transferência Bancária",
    "Dinheiro",
    "Cheque"
  ];

  const { user, session } = useAuth();

  const onSubmit = async (data: PayoutFormData) => {
    if (!session) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    console.log('🔑 Session ativa:', !!session);
    console.log('👤 User ID:', user?.id);
    console.log('💰 Dados do cachê:', data);

    setIsLoading(true);
    try {
      // Obter tenant_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) {
        throw new Error('Tenant ID não encontrado para o usuário');
      }

      // Preparar dados para inserção na tabela payouts
      const payoutData = {
        tenant_id: profile.tenant_id,
        evento_id: data.evento_id,
        beneficiary_type: data.beneficiary_type,
        beneficiary_name: data.beneficiary_name,
        beneficiary_id: data.beneficiary_id || null,
        amount: data.amount,
        due_date: data.due_date.toISOString().split('T')[0], // formato date
        status: data.status,
        payment_method: data.payment_method || null,
        settled_at: data.status === 'settled' ? data.due_date.toISOString() : null,
        notes: data.notes || null
      };

      console.log('📝 Dados preparados para inserção na tabela payouts:', payoutData);

      const { data: result, error } = await supabase
        .from('payouts')
        .insert([payoutData])
        .select();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Cachê salvo com sucesso:', result);
      
      toast.success(payoutId ? "Cachê/Repasse atualizado com sucesso!" : "Cachê/Repasse registrado com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('💥 Erro ao salvar cachê:', error);
      toast.error(`Erro ao salvar cachê: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Users className="h-5 w-5 text-blue-600" />
            {payoutId ? 'Editar Cachê' : 'Novo Cachê'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {payoutId ? 'Atualize as informações do cachê.' : 'Registre um novo cachê no sistema financeiro'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="evento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              <FormField
                control={form.control}
                name="beneficiary_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Beneficiário *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beneficiaryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="beneficiary_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Beneficiário *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
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
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <DatePickerField
                      label="Data de Vencimento *"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data de vencimento"
                      required
                      allowPastDates={true}
                      calendarTheme="payout"
                    />
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
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o cachê..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-lg"
              >
                {isLoading ? "Salvando..." : (payoutId ? "Atualizar Cachê" : "Criar Cachê")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};