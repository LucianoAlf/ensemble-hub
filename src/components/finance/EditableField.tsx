import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinancialEditing } from '@/hooks/useFinancialEditing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface EditableFieldProps {
  id: string;
  field: string;
  value: string | number | Date;
  type: 'currency' | 'text' | 'date' | 'select' | 'number';
  table: 'transactions' | 'payouts';
  className?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  onChange?: (value: string | number | Date) => void;
  disabled?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  id,
  field,
  value,
  type,
  table,
  className,
  placeholder,
  options,
  onChange,
  disabled = false,
}) => {
  const { updateField, getOptimisticValue, editingState } = useFinancialEditing();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const optimisticValue = getOptimisticValue(id, field as EditableField, table, value);
  const displayValue = isEditing ? tempValue : optimisticValue;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const formatDisplayValue = (val: string | number | Date | null | undefined) => {
    if (val === null || val === undefined) return placeholder || '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(val);
      case 'date':
        return formatDate(val);
      case 'select':
        return options?.find(opt => opt.value === val)?.label || val;
      default:
        return val.toString();
    }
  };

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(value);
    setError(null);
  };

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false);
      return;
    }

    const success = await updateField(id, field as EditableField, tempValue, table, value);
    if (success) {
      setIsEditing(false);
      onChange?.(tempValue);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'currency':
      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            step={type === 'currency' ? '0.01' : '1'}
            value={tempValue}
            onChange={(e) => setTempValue(type === 'currency' ? parseFloat(e.target.value) : parseInt(e.target.value))}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
            placeholder={placeholder}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-8 justify-start text-left font-normal text-sm",
                  !tempValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tempValue ? format(new Date(tempValue), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={tempValue ? new Date(tempValue) : undefined}
                onSelect={(date) => {
                  setTempValue(date);
                  handleSave();
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'select':
        return (
          <Select
            value={tempValue?.toString()}
            onValueChange={(val) => {
              setTempValue(val);
              handleSave();
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            ref={inputRef}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
            placeholder={placeholder}
          />
        );
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {renderInput()}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0"
          disabled={editingState.isSaving}
        >
          {editingState.isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
          disabled={editingState.isSaving}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50 cursor-pointer transition-colors",
        className,
        disabled && "cursor-not-allowed opacity-60"
      )}
      onClick={handleEdit}
    >
      <span className="text-sm">
        {formatDisplayValue(displayValue)}
      </span>
      {editingState.isSaving && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
    </div>
  );
};

export default EditableField;