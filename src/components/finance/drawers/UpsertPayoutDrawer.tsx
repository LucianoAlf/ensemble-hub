import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { Users, Upload } from "lucide-react";
import { toast } from "sonner";

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
  
  const form = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      beneficiary_type: "member",
      amount: 0,
      status: "pending",
      due_date: new Date()
    }
  });

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

  const onSubmit = async (data: PayoutFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save payout and create corresponding expense transaction
      console.log("Payout data:", data);
      
      toast.success(payoutId ? "Cachê/Repasse atualizado com sucesso!" : "Cachê/Repasse registrado com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao salvar cachê/repasse. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {payoutId ? "Editar Cachê/Repasse" : "Novo Cachê/Repasse"}
          </DrawerTitle>
          <DrawerDescription>
            Registre um novo cachê ou repasse para banda, membro ou técnico
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
            <FormField
              control={form.control}
              name="evento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="evento1">Show do Rock</SelectItem>
                      <SelectItem value="evento2">Festival de Verão</SelectItem>
                      <SelectItem value="evento3">Show Acústico</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="beneficiary_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Beneficiário *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beneficiaryTypes.map(type => (
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

              <FormField
                control={form.control}
                name="beneficiary_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Beneficiário *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo ou da banda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <DatePickerField
                      label=""
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Quando deve ser pago"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="settled">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("status") === "settled" && (
                <FormField
                  control={form.control}
                  name="settled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Pagamento</FormLabel>
                      <DatePickerField
                        label=""
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Quando foi pago"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {form.watch("status") === "settled" && (
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Como foi pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o pagamento..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Anexo/Recibo</FormLabel>
              <Button type="button" variant="outline" className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Anexar Recibo de Pagamento
              </Button>
            </div>
          </form>
        </Form>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Salvando..." : (payoutId ? "Atualizar" : "Salvar")}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};