import { useState, useCallback, useEffect } from 'react';
import { useSupabaseOptimized } from './useSupabaseOptimized';
import { useToast } from './use-toast';
import { Database } from '@/integrations/supabase/types';

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Payout = Database['public']['Tables']['payouts']['Row'];
export type EditableField = 'gross_amount' | 'fee_amount' | 'description' | 'category' | 'counterparty' | 'transaction_date' | 'status';

export interface EditOperation {
  id: string;
  field: EditableField;
  value: string | number | Date | null;
  previousValue: string | number | Date | null;
  table: 'transactions' | 'payouts';
}

export interface FinancialEditingState {
  isEditing: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export const useFinancialEditing = () => {
  const { client: supabase } = useSupabaseOptimized();
  const { toast } = useToast();
  
  const [editingState, setEditingState] = useState<FinancialEditingState>({
    isEditing: false,
    isSaving: false,
    hasChanges: false,
    lastSaved: null,
    error: null,
  });

  const [pendingEdits, setPendingEdits] = useState<EditOperation[]>([]);
  const [optimisticData, setOptimisticData] = useState<Record<string, string | number | Date | null>>({});

  const validateField = useCallback((field: EditableField, value: string | number | Date | null): string | null => {
    if (value === null || value === undefined) {
      return 'Este campo é obrigatório';
    }
    switch (field) {
      case 'gross_amount':
      case 'fee_amount':
        if (typeof value !== 'number' || value < 0) {
          return 'O valor deve ser um número positivo';
        }
        return null;
      
      case 'description':
      case 'category':
      case 'counterparty':
        if (typeof value !== 'string') {
          return 'Este campo deve ser um texto';
        }
        if (value.trim().length === 0) {
          return 'Este campo não pode estar vazio';
        }
        if (value.length > 500) {
          return 'O texto é muito longo (máximo 500 caracteres)';
        }
        return null;
      
      case 'transaction_date':
        if (!value || isNaN(new Date(value).getTime())) {
          return 'Data inválida';
        }
        return null;
      
      case 'status': {
        const validStatuses = ['pending', 'scheduled', 'settled'];
        if (!validStatuses.includes(value as string)) {
          return 'Status inválido';
        }
        return null;
      }
      
      default:
        return null;
    }
  }, []);

  const updateField = useCallback(async (
    id: string,
    field: EditableField,
    value: string | number | Date | null,
    table: 'transactions' | 'payouts',
    previousValue: string | number | Date | null
  ): Promise<boolean> => {
    const validationError = validateField(field, value);
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive",
      });
      return false;
    }

    const operation: EditOperation = {
      id,
      field,
      value,
      previousValue,
      table,
    };

    setPendingEdits(prev => [...prev, operation]);
    setOptimisticData(prev => ({
      ...prev,
      [`${table}_${id}_${field}`]: value,
    }));

    setEditingState(prev => ({
      ...prev,
      isEditing: true,
      hasChanges: true,
      error: null,
    }));

    try {
      setEditingState(prev => ({ ...prev, isSaving: true }));

      const updateData = { [field]: value };
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Erro ao atualizar ${field}: ${error.message}`);
      }

      setEditingState(prev => ({
        ...prev,
        isSaving: false,
        isEditing: false,
        hasChanges: false,
        lastSaved: new Date(),
        error: null,
      }));

      setPendingEdits(prev => prev.filter(op => !(op.id === id && op.field === field)));

      toast({
        title: "Sucesso!",
        description: "Alteração salva com sucesso",
        duration: 2000,
      });

      return true;
    } catch (error) {
      console.error('Error updating financial data:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar alteração';
      
      setEditingState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));

      // Revert optimistic update
      setOptimisticData(prev => ({
        ...prev,
        [`${table}_${id}_${field}`]: previousValue,
      }));

      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [supabase, toast, validateField]);

  const batchUpdate = useCallback(async (
    operations: EditOperation[]
  ): Promise<boolean> => {
    if (operations.length === 0) return true;

    setEditingState(prev => ({ ...prev, isSaving: true }));

    try {
      const updatesByTable = operations.reduce((acc, op) => {
        if (!acc[op.table]) acc[op.table] = [];
        acc[op.table].push(op);
        return acc;
      }, {} as Record<string, EditOperation[]>);

      const promises = Object.entries(updatesByTable).map(([table, ops]) => {
        const updates = ops.map(op => ({
          id: op.id,
          [op.field]: op.value,
        }));

        return supabase.from(table as 'transactions' | 'payouts')
          .upsert(updates.map(update => ({
            ...update,
            // Required fields for transactions
            ...(table === 'transactions' && {
              category: '',
              gross_amount: 0,
              tenant_id: '',
              transaction_date: new Date().toISOString(),
              type: 'expense'
            }),
            // Required fields for payouts
            ...(table === 'payouts' && {
              amount: 0,
              beneficiary_name: '',
              beneficiary_type: '',
              due_date: new Date().toISOString(),
              evento_id: '',
              tenant_id: ''
            })
          })), { onConflict: 'id' });
      });

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error(`Erro ao salvar ${errors.length} alterações`);
      }

      setEditingState(prev => ({
        ...prev,
        isSaving: false,
        isEditing: false,
        hasChanges: false,
        lastSaved: new Date(),
        error: null,
      }));

      setPendingEdits([]);

      toast({
        title: "Sucesso!",
        description: `${operations.length} alterações salvas com sucesso`,
        duration: 2000,
      });

      return true;
    } catch (error) {
      console.error('Error batch updating financial data:', error);
      
      setEditingState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar alterações',
      }));

      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar as alterações",
        variant: "destructive",
      });

      return false;
    }
  }, [supabase, toast]);

  const revertChanges = useCallback(() => {
    setPendingEdits([]);
    setOptimisticData({});
    setEditingState(prev => ({
      ...prev,
      isEditing: false,
      hasChanges: false,
      error: null,
    }));

    toast({
      title: "Alterações descartadas",
      description: "As alterações não salvas foram descartadas",
      duration: 2000,
    });
  }, [toast]);

  const getOptimisticValue = useCallback((
    id: string,
    field: EditableField,
    table: 'transactions' | 'payouts',
    defaultValue: string | number | Date | null
  ): string | number | Date | null => {
    const key = `${table}_${id}_${field}`;
    return optimisticData[key] ?? defaultValue;
  }, [optimisticData]);

  const hasPendingEdits = useCallback((id: string) => {
    return pendingEdits.some(op => op.id === id);
  }, [pendingEdits]);

  const getPendingValue = useCallback((
    id: string,
    field: EditableField
  ) => {
    const operation = pendingEdits.find(op => op.id === id && op.field === field);
    return operation?.value;
  }, [pendingEdits]);

  return {
    editingState,
    updateField,
    batchUpdate,
    revertChanges,
    getOptimisticValue,
    hasPendingEdits,
    getPendingValue,
    pendingEdits,
    optimisticData,
  };
};