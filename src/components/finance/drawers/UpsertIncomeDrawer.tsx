import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, TrendingUp, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useEvents, EventSelectOption } from "@/hooks/useEvents";
import { useBands, BandSelectOption } from "@/hooks/useBands";

const incomeSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  evento_id: z.string().optional(),
  banda_id: z.string().optional(),
  transaction_date: z.date({ required_error: "Data é obrigatória" }),
  gross_amount: z.number({
    required_error: "Valor bruto é obrigatório",
    invalid_type_error: "Valor deve ser um número válido"
  }).min(0.01, "Valor deve ser maior que zero").max(999999.99, "Valor muito alto"),
  fee_amount: z.number({
    invalid_type_error: "Taxa deve ser um número válido"
  }).min(0, "Taxa deve ser positiva").max(999999.99, "Taxa muito alta").default(0),
  counterparty: z.string().max(100, "Nome muito longo").optional(),
  description: z.string().max(500, "Descrição muito longa").optional(),
  status: z.enum(["pending", "scheduled", "settled"]).default("pending"),
  settled_at: z.date().optional()
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface UpsertIncomeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeId?: string;
}

export const UpsertIncomeDrawer = ({ open, onOpenChange, incomeId }: UpsertIncomeDrawerProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [events, setEvents] = useState([]);
  const [bands, setBands] = useState([]);
  const { getEventsForSelect } = useEvents();
  const { getBandsForSelect } = useBands();


  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      category: "",
      evento_id: "",
      banda_id: "",
      transaction_date: new Date(),
      gross_amount: undefined,
      fee_amount: undefined,
      counterparty: "",
      description: "",
      status: "pending",
      settled_at: undefined
    }
  });

  const watchedValues = form.watch();
  const netAmount = (watchedValues.gross_amount || 0) - (watchedValues.fee_amount || 0);

  // Função para formatar valores em Real brasileiro
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Carregar eventos e bandas quando o modal abrir
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        try {
          const [eventsData, bandsData] = await Promise.all([
            getEventsForSelect(),
            getBandsForSelect()
          ]);
          setEvents(eventsData);
          setBands(bandsData);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        }
      };
      loadData();
    }
  }, [open, getEventsForSelect, getBandsForSelect]);

  // Carregar dados da transação quando em modo de edição
  useEffect(() => {
    const loadTransactionData = async () => {
      if (!incomeId || !open) return;

      try {
        console.log('🔄 Carregando dados da transação:', incomeId);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', incomeId)
          .eq('tenant_id', 'd93bd1e5-245e-4a40-9027-4bd669ccc390')
          .single();

        if (error) {
          console.error('❌ Erro ao carregar transação:', error);
          toast.error('Erro ao carregar dados da transação');
          return;
        }

        if (data) {
          console.log('✅ Dados carregados:', data);
          
          // Preencher o formulário com os dados existentes
          form.reset({
            category: data.category || '',
            evento_id: data.evento_id || '',
            banda_id: data.banda_id || '',
            transaction_date: new Date(data.transaction_date),
            gross_amount: data.gross_amount || undefined,
            fee_amount: data.fee_amount || undefined,
            counterparty: data.counterparty || '',
            description: data.description || '',
            status: (data.status as 'pending' | 'scheduled' | 'settled') || 'pending',
            settled_at: data.settled_at ? new Date(data.settled_at) : undefined
          });
          
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar transação:', error);
        toast.error('Erro ao carregar dados da transação');
      }
    };

    loadTransactionData();
  }, [incomeId, open, form, supabase]);

  // Reset form apenas para nova transação
  useEffect(() => {
    if (open && !incomeId) {
      form.reset({
        category: "",
        evento_id: "",
        banda_id: "",
        transaction_date: new Date(),
        gross_amount: undefined,
        fee_amount: undefined,
        counterparty: "",
        description: "",
        status: "pending",
        settled_at: undefined
      });
      setHasUnsavedChanges(false);
    }
  }, [open, incomeId, form]);

  useEffect(() => {
    const subscription = form.watch(() => setHasUnsavedChanges(true));
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: IncomeFormData) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      setIsLoading(true);

      const transactionData = {
        type: 'income' as const,
        category: data.category,
        description: data.description || `Receita - ${data.category}`,
        gross_amount: data.gross_amount,
        fee_amount: data.fee_amount || 0,
        transaction_date: data.transaction_date.toISOString().split('T')[0],
        status: data.status,
        counterparty: data.counterparty || null,
        evento_id: data.evento_id === 'none' ? null : data.evento_id || null,
        banda_id: data.banda_id === 'none' ? null : data.banda_id || null,
        settled_at: data.status === 'settled' ? data.transaction_date.toISOString() : null,
        tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390'
      };

      console.log('📊 Dados preparados para inserção:', transactionData);

      let result;
      if (incomeId) {
        console.log('🔄 Atualizando transação existente:', incomeId);
        result = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', incomeId)
          .eq('tenant_id', 'd93bd1e5-245e-4a40-9027-4bd669ccc390')
          .select()
          .single();
      } else {
        console.log('➕ Criando nova transação');
        result = await supabase
          .from('transactions')
          .insert([transactionData])
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Erro do Supabase:', result.error);
        throw result.error;
      }

      console.log('✅ Receita salva com sucesso:', result.data);


      toast.success(
        incomeId ? "Receita atualizada com sucesso!" : "Receita registrada com sucesso!",
        {
          description: `Valor líquido: ${formatCurrency(netAmount)}`
        }
      );

      setHasUnsavedChanges(false);
      onOpenChange(false);
      form.reset();
      
      window.location.reload();
    } catch (error) {
      console.log('❌ Erro ao salvar receita:', error);
      toast.error(
        "Erro ao salvar receita",
        {
          description: error instanceof Error ? error.message : "Verifique os dados e tente novamente."
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    "Show/Apresentação",
    "Venda de Produtos",
    "Streaming",
    "Direitos Autorais",
    "Patrocínio",
    "Aulas/Workshops",
    "Outros"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="h-5 w-5 text-green-600" />
            {incomeId ? 'Editar Receita' : 'Nova Receita'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {incomeId ? 'Atualize as informações da receita.' : 'Registre uma nova receita no sistema financeiro'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6">
          <div className="space-y-6">
            {/* Primeira linha - Categoria, Evento, Banda */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-sm font-medium truncate">
                  Data *
                </Label>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="evento_id" className="text-sm font-medium">Evento</Label>
                <Controller
                  name="evento_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum evento</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banda_id" className="text-sm font-medium">Banda</Label>
                <Controller
                  name="banda_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione uma banda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma banda</SelectItem>
                        {bands.map((band) => (
                          <SelectItem key={band.id} value={band.id}>
                            {band.name} {band.genre && `(${band.genre})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Segunda linha - Valor Bruto, Taxas, Valor Líquido, Data */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="gross_amount" className="text-sm font-medium">
                  Valor Bruto
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Controller
                    name="gross_amount"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.000,00"
                        className="pl-10 h-10"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                </div>
                {form.formState.errors.gross_amount && (
                  <p className="text-sm text-destructive">{form.formState.errors.gross_amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_amount" className="text-sm font-medium">Taxas</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Controller
                    name="fee_amount"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.000,00"
                        className="pl-10 h-10"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-700">Valor Líquido</Label>
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-green-800 font-semibold text-sm">
                  {formatCurrency(netAmount)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-sm font-medium">
                  Data
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Controller
                  name="transaction_date"
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        type="date"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                        min={format(new Date(), "yyyy-MM-dd")}
                        className="h-10"
                      />
                    </div>
                  )}
                />
                {form.formState.errors.transaction_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.transaction_date.message}</p>
                )}
              </div>
            </div>

            {/* Terceira linha - Pagador/Origem e Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="counterparty" className="text-sm font-medium">Pagador/Origem</Label>
                <Controller
                  name="counterparty"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Ex: Cliente, Empresa, etc."
                      className="h-10"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="settled">Liquidado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Observações</Label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Informações adicionais sobre a receita..."
                    rows={3}
                    className="resize-none"
                  />
                )}
              />
            </div>


          </div>
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
              className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-lg"
            >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {isLoading 
                    ? (incomeId ? 'Atualizando...' : 'Salvando...') 
                    : (incomeId ? 'Atualizar Receita' : 'Criar Receita')
                  }
                </span>
              </div>
            </Button>
          </div>
          
          {hasUnsavedChanges && (
            <div className="text-xs text-gray-300 text-center mt-3 flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              <span>Alterações não salvas • Pressione Ctrl+S para salvar rapidamente</span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertIncomeDrawer;
