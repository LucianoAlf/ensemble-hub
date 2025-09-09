import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdaptiveModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function AdaptiveModal({
  children,
  open,
  onOpenChange,
  title,
  description,
  trigger,
  className,
  showCloseButton = true,
}: AdaptiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={className}>
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {title && <DrawerTitle>{title}</DrawerTitle>}
                {description && (
                  <DrawerDescription>{description}</DrawerDescription>
                )}
              </div>
              {showCloseButton && (
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </Button>
                </DrawerClose>
              )}
            </div>
          </DrawerHeader>
          <div className="px-4 pb-4 flex-1 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={className}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

interface AdaptiveModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function AdaptiveModalFooter({
  children,
  className,
}: AdaptiveModalFooterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <div className={`flex justify-end space-x-2 ${className || ""}`}>{children}</div>;
}

// Componente para formulários adaptativos
interface AdaptiveFormModalProps extends AdaptiveModalProps {
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onCancel?: () => void;
  submitDisabled?: boolean;
}

export function AdaptiveFormModal({
  children,
  open,
  onOpenChange,
  title,
  description,
  trigger,
  className,
  onSubmit,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  isLoading = false,
  onCancel,
  submitDisabled = false,
}: AdaptiveFormModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      trigger={trigger}
      className={className}
      showCloseButton={false}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        
        <AdaptiveModalFooter className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            disabled={submitDisabled || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </AdaptiveModalFooter>
      </form>
    </AdaptiveModal>
  );
}
