/**
 * Formulário para criação e edição de registros financeiros (tabela financeiro)
 * Financial records creation and editing form
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, AlertCircle, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type Financeiro = Database['public']['Tables']['financeiro']['Row'];
type FinanceiroInsert = Database['public']['Tables']['financeiro']['Insert'];

// Schema de validação
const financeiroSchema = z.object({
  tenant_id: z.string().uuid('ID do tenant inválido'),
  evento_id: z.string().uuid('ID do evento inválido').optional(),
  tipo: z.enum(['receita', 'despesa'], {
    required_error: 'Tipo é obrigatório',
  }),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  data_transacao: z.string().min(1, 'Data da transação é obrigatória'),
});

type FinanceiroFormData = z.infer<typeof financeiroSchema>;

interface FinanceiroFormProps {
  financeiro?: Financeiro;
  tenantId: string;
  onSubmit: (data: FinanceiroFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export const FinanceiroForm: React.FC<FinanceiroFormProps> = ({
  financeiro,
  tenantId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FinanceiroFormData>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: {
      tenant_id: tenantId,
      evento_id: financeiro?.evento_id || undefined,
      tipo: (financeiro?.tipo as 'receita' | 'despesa') || 'receita',
      valor: financeiro?.valor || 0,
      descricao: financeiro?.descricao || '',
      data_transacao: financeiro?.data_transacao 
        ? new Date(financeiro.data_transacao).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  const { watch } = form;
  const watchedTipo = watch('tipo');
  const watchedValor = watch('valor');

  const handleSubmit = async (data: FinanceiroFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await onSubmit(data);
      
      if (!result.success) {
        setSubmitError(result.error || 'Erro ao salvar registro financeiro');
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!financeiro;
  const isLoading = loading || isSubmitting;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isEditing ? 'Editar Registro Financeiro' : 'Novo Registro Financeiro'}
          </span>
          <div className="flex gap-2">
            <Badge variant={watchedTipo === 'receita' ? 'default' : 'destructive'}>
              {watchedTipo === 'receita' ? 'Receita' : 'Despesa'}
            </Badge>
            {watchedValor > 0 && (
              <Badge variant="outline">
                R$ {watchedValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Tipo e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Classifique se é uma entrada ou saída de dinheiro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_transacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Transação *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Quando a transação ocorreu
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valor */}
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Valor da {watchedTipo} em reais
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ID do Evento */}
            <FormField
              control={form.control}
              name="evento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Evento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="UUID do evento (opcional)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Evento relacionado a esta transação financeira (se aplicável)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente esta transação financeira..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informações detalhadas sobre a origem ou destino do valor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resumo da Transação */}
            {watchedValor > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Resumo da Transação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="ml-2">
                      <Badge 
                        variant={watchedTipo === 'receita' ? 'default' : 'destructive'} 
                        className="text-xs"
                      >
                        {watchedTipo === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <span className={`ml-2 font-medium ${
                      watchedTipo === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {watchedTipo === 'despesa' ? '-' : '+'}R$ {watchedValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                {/* Impacto no Fluxo de Caixa */}
                <div className="mt-3 p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Impacto no Fluxo de Caixa:</div>
                  <div className={`text-sm font-medium ${
                    watchedTipo === 'receita' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {watchedTipo === 'receita' 
                      ? `+R$ ${watchedValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Entrada)`
                      : `-R$ ${watchedValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Saída)`
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Atualizar' : 'Criar'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default FinanceiroForm;