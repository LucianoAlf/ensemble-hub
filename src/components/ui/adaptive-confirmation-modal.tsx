/**
 * Modal de confirmação adaptativo para ações destrutivas
 * Usa Dialog no desktop e Drawer no mobile
 */

import React from 'react';
import { AdaptiveModal, AdaptiveModalFooter } from '@/components/ui/adaptive-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, AlertTriangle, DollarSign } from 'lucide-react';

interface AdaptiveConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'default';
  item?: {
    type: 'transaction' | 'payout' | 'financeiro';
    id: string;
    description?: string;
    amount?: number;
    status?: string;
  };
}

export const AdaptiveConfirmationModal: React.FC<AdaptiveConfirmationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  item
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <DollarSign className="h-6 w-6 text-blue-500" />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'Transação';
      case 'payout':
        return 'Payout';
      case 'financeiro':
        return 'Registro Financeiro';
      default:
        return 'Item';
    }
  };

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-md"
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Ícone e título no conteúdo */}
        <div className="flex items-center gap-3 pb-2 border-b">
          {getIcon()}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        {/* Detalhes do Item */}
        {item && (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {getItemTypeLabel(item.type)}
                </span>
                <Badge variant="outline" className="text-xs">
                  ID: {item.id.slice(0, 8)}...
                </Badge>
              </div>
              
              {item.description && (
                <div>
                  <span className="text-xs text-muted-foreground">Descrição:</span>
                  <p className="text-sm mt-1 line-clamp-2">{item.description}</p>
                </div>
              )}
              
              {item.amount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Valor:</span>
                  <span className="text-sm font-medium">
                    R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              
              {item.status && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Badge 
                    variant={item.status === 'settled' || item.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aviso para ações destrutivas */}
        {variant === 'destructive' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Atenção!</p>
                <p className="text-destructive/80 mt-1">
                  Esta ação não pode ser desfeita. Os dados serão permanentemente removidos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdaptiveModalFooter className="pt-4 border-t mt-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          className="min-w-[100px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            confirmText
          )}
        </Button>
      </AdaptiveModalFooter>
    </AdaptiveModal>
  );
};

// Hook para facilitar o uso do modal de confirmação adaptativo
export const useAdaptiveConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'warning' | 'default';
    item?: AdaptiveConfirmationModalProps['item'];
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const confirm = React.useCallback((options: NonNullable<typeof config>) => {
    setConfig(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      const originalOnConfirm = options.onConfirm;
      setConfig(prev => prev ? {
        ...prev,
        onConfirm: async () => {
          setLoading(true);
          try {
            await originalOnConfirm();
            resolve(true);
            setIsOpen(false);
          } catch (error) {
            console.error('Confirmation action failed:', error);
            resolve(false);
          } finally {
            setLoading(false);
          }
        }
      } : null);
    });
  }, []);

  const ConfirmationDialog = React.useCallback(() => {
    if (!config) return null;

    return (
      <AdaptiveConfirmationModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !loading) {
            setIsOpen(false);
            setConfig(null);
          }
        }}
        loading={loading}
        {...config}
      />
    );
  }, [config, isOpen, loading]);

  return {
    confirm,
    ConfirmationDialog,
    isOpen,
    loading
  };
};

export default AdaptiveConfirmationModal;
