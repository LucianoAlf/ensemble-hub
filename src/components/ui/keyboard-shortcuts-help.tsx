/**
 * Componente para exibir ajuda de atalhos de teclado
 * Modal acessível com lista organizada de shortcuts disponíveis
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type KeyboardShortcut,
  formatShortcut,
  groupShortcutsByCategory,
  useKeyboardShortcuts,
} from '@/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts?: KeyboardShortcut[];
  trigger?: React.ReactNode;
  className?: string;
}

const CATEGORY_LABELS = {
  navigation: 'Navegação',
  actions: 'Ações',
  modals: 'Modais',
  general: 'Geral',
};

const CATEGORY_DESCRIPTIONS = {
  navigation: 'Navegar entre páginas do sistema',
  actions: 'Executar ações principais',
  modals: 'Controlar modais e overlays',
  general: 'Atalhos gerais do sistema',
};

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts = [],
  trigger,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Atalhos padrão do sistema
  const defaultShortcuts: KeyboardShortcut[] = [
    // Navegação
    {
      key: 'h',
      altKey: true,
      action: () => {},
      description: 'Ir para Dashboard',
      category: 'navigation',
    },
    {
      key: 'b',
      altKey: true,
      action: () => {},
      description: 'Ir para Bandas',
      category: 'navigation',
    },
    {
      key: 'e',
      altKey: true,
      action: () => {},
      description: 'Ir para Eventos',
      category: 'navigation',
    },
    {
      key: 'f',
      altKey: true,
      action: () => {},
      description: 'Ir para Financeiro',
      category: 'navigation',
    },
    {
      key: '1',
      altKey: true,
      action: () => {},
      description: 'Dashboard',
      category: 'navigation',
    },
    {
      key: '2',
      altKey: true,
      action: () => {},
      description: 'Bandas',
      category: 'navigation',
    },
    {
      key: '3',
      altKey: true,
      action: () => {},
      description: 'Eventos',
      category: 'navigation',
    },
    {
      key: '4',
      altKey: true,
      action: () => {},
      description: 'Financeiro',
      category: 'navigation',
    },
    // Ações
    {
      key: 'n',
      ctrlKey: true,
      action: () => {},
      description: 'Nova entrada',
      category: 'actions',
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => {},
      description: 'Salvar',
      category: 'actions',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {},
      description: 'Busca rápida',
      category: 'actions',
    },
    {
      key: '/',
      action: () => {},
      description: 'Focar campo de busca',
      category: 'actions',
    },
    // Modais
    {
      key: 'Escape',
      action: () => {},
      description: 'Fechar modal/drawer',
      category: 'modals',
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => {},
      description: 'Confirmar ação',
      category: 'modals',
    },
    // Geral
    {
      key: '?',
      shiftKey: true,
      action: () => setIsOpen(true),
      description: 'Mostrar atalhos',
      category: 'general',
    },
  ];

  const allShortcuts = [...defaultShortcuts, ...shortcuts];
  const groupedShortcuts = groupShortcutsByCategory(allShortcuts);

  // Registrar atalho para abrir ajuda
  useKeyboardShortcuts([
    {
      key: '?',
      shiftKey: true,
      action: () => setIsOpen(true),
      description: 'Mostrar atalhos',
      category: 'general',
    },
  ]);

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-2", className)}
      aria-label="Mostrar atalhos de teclado"
    >
      <Keyboard className="h-4 w-4" />
      <span className="hidden sm:inline">Atalhos</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Use estes atalhos para navegar e interagir com o sistema de forma mais eficiente.
          </div>

          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <div>
                <h3 className="font-semibold text-base">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
                </p>
              </div>
              
              <div className="grid gap-2">
                {categoryShortcuts
                  .filter(shortcut => !shortcut.disabled)
                  .map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {shortcut.description}
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs bg-background border"
                      >
                        {formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
              </div>
              
              {category !== 'general' && <Separator />}
            </div>
          ))}

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Dicas de Acessibilidade
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Os atalhos funcionam em qualquer lugar do sistema</li>
                  <li>• Use Tab para navegar entre elementos focáveis</li>
                  <li>• Pressione Enter para ativar botões e links</li>
                  <li>• Use Escape para fechar modais e menus</li>
                  <li>• Atalhos são desabilitados em campos de texto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente compacto para mostrar apenas um atalho
export const ShortcutBadge: React.FC<{
  shortcut: KeyboardShortcut;
  className?: string;
}> = ({ shortcut, className }) => {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-xs", className)}
      title={shortcut.description}
    >
      {formatShortcut(shortcut)}
    </Badge>
  );
};

// Hook para integrar atalhos em componentes
export const useShortcutHelp = (shortcuts: KeyboardShortcut[] = []) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const helpShortcut: KeyboardShortcut = {
    key: '?',
    shiftKey: true,
    action: () => setIsHelpOpen(true),
    description: 'Mostrar atalhos disponíveis',
    category: 'general',
  };

  useKeyboardShortcuts([helpShortcut]);

  const HelpComponent = () => (
    <KeyboardShortcutsHelp
      shortcuts={shortcuts}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsHelpOpen(true)}
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Ajuda
        </Button>
      }
    />
  );

  return {
    isHelpOpen,
    setIsHelpOpen,
    HelpComponent,
  };
};
