/**
 * Componentes com indicadores de foco customizados
 * Implementa foco visível acessível e consistente em todo o sistema
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Classes CSS para indicadores de foco customizados
export const FOCUS_CLASSES = {
  // Foco padrão - anel azul
  default: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background',
  
  // Foco para elementos interativos
  interactive: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200',
  
  // Foco para botões primários
  primary: 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-background',
  
  // Foco para elementos de perigo
  destructive: 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background',
  
  // Foco para elementos de sucesso
  success: 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-background',
  
  // Foco para campos de formulário
  input: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200',
  
  // Foco para navegação
  navigation: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-background rounded-sm',
  
  // Foco para cards e containers
  card: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-4 focus:ring-offset-background',
  
  // Foco interno (sem offset)
  inner: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
  
  // Foco sutil para elementos secundários
  subtle: 'focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-background',
};

// Hook para detectar se o usuário está navegando por teclado
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

// Componente wrapper para adicionar foco customizado
interface FocusableProps extends React.HTMLAttributes<HTMLDivElement> {
  focusType?: keyof typeof FOCUS_CLASSES;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Focusable = forwardRef<HTMLDivElement, FocusableProps>(
  ({ focusType = 'default', children, className, disabled, ...props }, ref) => {
    const isKeyboardUser = useKeyboardNavigation();
    
    const focusClasses = disabled 
      ? '' 
      : isKeyboardUser 
        ? FOCUS_CLASSES[focusType] 
        : 'focus:outline-none';

    return (
      <div
        ref={ref}
        className={cn(focusClasses, className)}
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Focusable.displayName = 'Focusable';

// Componente de skip link para navegação
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50',
        'bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
};

// Componente de botão com foco customizado
interface FocusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'success' | 'subtle';
  children: React.ReactNode;
}

export const FocusButton = forwardRef<HTMLButtonElement, FocusButtonProps>(
  ({ variant = 'default', className, children, disabled, ...props }, ref) => {
    const isKeyboardUser = useKeyboardNavigation();
    
    const focusClasses = disabled 
      ? '' 
      : isKeyboardUser 
        ? FOCUS_CLASSES[variant === 'default' ? 'interactive' : variant]
        : 'focus:outline-none';

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          focusClasses,
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

FocusButton.displayName = 'FocusButton';

// Componente de input com foco customizado
interface FocusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FocusInput = forwardRef<HTMLInputElement, FocusInputProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const isKeyboardUser = useKeyboardNavigation();
    
    const focusClasses = disabled 
      ? '' 
      : isKeyboardUser 
        ? error 
          ? FOCUS_CLASSES.destructive.replace('ring-red-500', 'ring-red-500 border-red-500')
          : FOCUS_CLASSES.input
        : 'focus:outline-none';

    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          error && 'border-red-500',
          focusClasses,
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);

FocusInput.displayName = 'FocusInput';

// Componente de link com foco customizado
interface FocusLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'navigation' | 'inline' | 'button';
  children: React.ReactNode;
}

export const FocusLink = forwardRef<HTMLAnchorElement, FocusLinkProps>(
  ({ variant = 'inline', className, children, ...props }, ref) => {
    const isKeyboardUser = useKeyboardNavigation();
    
    const focusClasses = isKeyboardUser 
      ? variant === 'navigation' 
        ? FOCUS_CLASSES.navigation
        : variant === 'button'
          ? FOCUS_CLASSES.interactive
          : FOCUS_CLASSES.subtle
      : 'focus:outline-none';

    return (
      <a
        ref={ref}
        className={cn(
          'transition-colors duration-200',
          variant === 'navigation' && 'block px-2 py-1',
          variant === 'button' && 'inline-flex items-center justify-center rounded-md px-4 py-2',
          variant === 'inline' && 'underline-offset-4 hover:underline',
          focusClasses,
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

FocusLink.displayName = 'FocusLink';

// Componente de card focável
interface FocusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export const FocusCard = forwardRef<HTMLDivElement, FocusCardProps>(
  ({ interactive = false, className, children, ...props }, ref) => {
    const isKeyboardUser = useKeyboardNavigation();
    
    const focusClasses = interactive && isKeyboardUser 
      ? FOCUS_CLASSES.card
      : 'focus:outline-none';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          interactive && 'cursor-pointer transition-colors duration-200 hover:bg-accent',
          focusClasses,
          className
        )}
        tabIndex={interactive ? 0 : -1}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FocusCard.displayName = 'FocusCard';

// Utilitário para aplicar classes de foco
export const getFocusClasses = (
  type: keyof typeof FOCUS_CLASSES = 'default',
  isKeyboardUser: boolean = true,
  disabled: boolean = false
): string => {
  if (disabled) return '';
  return isKeyboardUser ? FOCUS_CLASSES[type] : 'focus:outline-none';
};

// CSS global para indicadores de foco (para ser adicionado ao index.css)
export const FOCUS_STYLES = `
/* Indicadores de foco customizados */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Remover outline padrão quando usando classes customizadas */
.focus\\:outline-none:focus {
  outline: none;
}

/* Animações suaves para transições de foco */
.focus-transition {
  transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* Foco de alto contraste para acessibilidade */
@media (prefers-contrast: high) {
  .focus\\:ring-2:focus {
    --tw-ring-color: #000000;
    --tw-ring-offset-color: #ffffff;
  }
  
  .dark .focus\\:ring-2:focus {
    --tw-ring-color: #ffffff;
    --tw-ring-offset-color: #000000;
  }
}

/* Reduzir movimento para usuários sensíveis */
@media (prefers-reduced-motion: reduce) {
  .focus-transition {
    transition: none;
  }
}
`;

// Hook para gerenciar foco programático
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  const focusFirstFocusable = (container?: HTMLElement) => {
    const root = container || document;
    const focusable = root.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusable) {
      focusable.focus();
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return {
    focusElement,
    focusFirstFocusable,
    trapFocus,
  };
};
