import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: 'text' | 'number' | 'currency';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  formatDisplay?: (value: string | number) => string;
  label?: string;
}

export const EditableField = ({
  value,
  onSave,
  type = 'text',
  placeholder,
  className,
  disabled = false,
  formatDisplay,
  label
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = async () => {
    if (editValue === value.toString()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const processedValue = type === 'number' || type === 'currency' 
        ? parseFloat(editValue) || 0
        : editValue;
      
      await onSave(processedValue);
      
      // Mostrar confirmação visual de sucesso
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      setIsEditing(false);
      
      toast({
        title: "Sucesso!",
        description: `${label || 'Campo'} atualizado com sucesso.`,
        variant: "default",
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o valor. Tente novamente.",
        variant: "destructive",
        duration: 5000
      });
      setEditValue(value.toString()); // Reverte para o valor original
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatCurrency = (val: string | number) => {
    const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getDisplayValue = () => {
    if (formatDisplay) {
      return formatDisplay(value);
    }
    
    if (type === 'currency') {
      return formatCurrency(value);
    }
    
    return value.toString();
  };

  if (disabled) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {getDisplayValue()}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type={type === 'currency' ? 'number' : type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("h-8 text-sm", className)}
          autoFocus
          step={type === 'currency' ? '0.01' : undefined}
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors",
        showSuccess && "bg-green-50 border border-green-200",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="flex-1">{getDisplayValue()}</span>
      {showSuccess ? (
        <CheckCircle className="h-3 w-3 text-green-600 animate-pulse" />
      ) : (
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
      )}
    </div>
  );
};