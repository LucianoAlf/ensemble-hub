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
import { TrendingUp, Upload } from "lucide-react";
import { toast } from "sonner";

const incomeSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  evento_id: z.string().optional(),
  banda_id: z.string().optional(),
  transaction_date: z.date({ required_error: "Data é obrigatória" }),
  gross_amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  fee_amount: z.number().min(0, "Taxa deve ser positiva").default(0),
  counterparty: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "settled"]).default("pending"),
  settled_at: z.date().optional(),
  attachment_url: z.string().optional()
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface UpsertIncomeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeId?: string;
}

export const UpsertIncomeDrawer = ({ open, onOpenChange, incomeId }: UpsertIncomeDrawerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      category: "",
      gross_amount: 0,
      fee_amount: 0,
      status: "pending",
      transaction_date: new Date()
    }
  });

  const categories = [
    "Ingressos",
    "Patrocínio", 
    "Merch",
    "Outros"
  ];

  const grossAmount = form.watch("gross_amount");
  const feeAmount = form.watch("fee_amount");
  const netAmount = grossAmount - feeAmount;

  const onSubmit = async (data: IncomeFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save income
      console.log("Income data:", data);
      
      toast.success(incomeId ? "Receita atualizada com sucesso!" : "Receita registrada com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao salvar receita. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            {incomeId ? "Editar Receita" : "Nova Receita"}
          </DrawerTitle>
          <DrawerDescription>
            Registre uma nova receita no sistema financeiro
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="evento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="evento1">Show do Rock</SelectItem>
                        <SelectItem value="evento2">Festival de Verão</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="banda_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma banda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="banda1">Banda XYZ</SelectItem>
                        <SelectItem value="banda2">Rock Stars</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <DatePickerField
                      label=""
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gross_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Bruto *</FormLabel>
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
                name="fee_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxas</FormLabel>
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
            </div>

            {/* Net Amount Display */}
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-sm text-green-700 font-medium">
                Valor Líquido: R$ {netAmount.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <FormField
              control={form.control}
              name="counterparty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagador/Origem</FormLabel>
                  <FormControl>
                    <Input placeholder="Quem está pagando" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <SelectItem value="settled">Recebido</SelectItem>
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
                      <FormLabel>Data de Recebimento</FormLabel>
                      <DatePickerField
                        label=""
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Quando foi recebido"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a receita..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Anexo</FormLabel>
              <Button type="button" variant="outline" className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Anexar Comprovante
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
              {isLoading ? "Salvando..." : (incomeId ? "Atualizar" : "Salvar")}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};