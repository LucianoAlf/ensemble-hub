/**
 * Hook para gerenciar atalhos de teclado globais
 * Implementa atalhos acessíveis e configuráveis para ações principais
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'actions' | 'modals' | 'general';
  disabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// Atalhos padrão do sistema
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
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
  // Ações principais
  {
    key: 'n',
    ctrlKey: true,
    action: () => {},
    description: 'Nova entrada (contexto atual)',
    category: 'actions',
  },
  {
    key: 's',
    ctrlKey: true,
    action: () => {},
    description: 'Salvar (quando aplicável)',
    category: 'actions',
  },
  {
    key: 'k',
    ctrlKey: true,
    action: () => {},
    description: 'Busca rápida',
    category: 'actions',
  },
  // Modais e overlays
  {
    key: 'Escape',
    action: () => {},
    description: 'Fechar modal/drawer atual',
    category: 'modals',
  },
  {
    key: 'Enter',
    ctrlKey: true,
    action: () => {},
    description: 'Confirmar ação (em modais)',
    category: 'modals',
  },
  // Geral
  {
    key: '?',
    shiftKey: true,
    action: () => {},
    description: 'Mostrar atalhos disponíveis',
    category: 'general',
  },
];

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[] = [],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true, stopPropagation = true } = options;
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);
  const { toast } = useToast();

  // Atualizar referência dos shortcuts
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar se estiver em um campo de input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    // Encontrar shortcut correspondente
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      if (shortcut.disabled) return false;
      
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Erro ao executar atalho:', error);
        toast({
          title: "Erro no atalho",
          description: "Falha ao executar a ação solicitada",
          variant: "destructive",
        });
      }
    }
  }, [enabled, preventDefault, stopPropagation, toast]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcutsRef.current,
  };
};

// Hook específico para navegação
export const useNavigationShortcuts = () => {
  const navigate = useNavigate();

  const navigationShortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      altKey: true,
      action: () => navigate('/dashboard'),
      description: 'Ir para Dashboard',
      category: 'navigation',
    },
    {
      key: 'b',
      altKey: true,
      action: () => navigate('/bands'),
      description: 'Ir para Bandas',
      category: 'navigation',
    },
    {
      key: 'e',
      altKey: true,
      action: () => navigate('/events'),
      description: 'Ir para Eventos',
      category: 'navigation',
    },
    {
      key: 'f',
      altKey: true,
      action: () => navigate('/financeiro'),
      description: 'Ir para Financeiro',
      category: 'navigation',
    },
    {
      key: '1',
      altKey: true,
      action: () => navigate('/dashboard'),
      description: 'Dashboard (Alt+1)',
      category: 'navigation',
    },
    {
      key: '2',
      altKey: true,
      action: () => navigate('/bands'),
      description: 'Bandas (Alt+2)',
      category: 'navigation',
    },
    {
      key: '3',
      altKey: true,
      action: () => navigate('/events'),
      description: 'Eventos (Alt+3)',
      category: 'navigation',
    },
    {
      key: '4',
      altKey: true,
      action: () => navigate('/financeiro'),
      description: 'Financeiro (Alt+4)',
      category: 'navigation',
    },
  ];

  return useKeyboardShortcuts(navigationShortcuts);
};

// Hook para atalhos de modal
export const useModalShortcuts = (
  isOpen: boolean,
  onClose: () => void,
  onConfirm?: () => void,
  additionalShortcuts: KeyboardShortcut[] = []
) => {
  const modalShortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      action: onClose,
      description: 'Fechar modal',
      category: 'modals',
      disabled: !isOpen,
    },
    ...(onConfirm ? [{
      key: 'Enter',
      ctrlKey: true,
      action: onConfirm,
      description: 'Confirmar ação',
      category: 'modals' as const,
      disabled: !isOpen,
    }] : []),
    ...additionalShortcuts.map(shortcut => ({
      ...shortcut,
      disabled: !isOpen || shortcut.disabled,
    })),
  ];

  return useKeyboardShortcuts(modalShortcuts);
};

// Utilitário para formatar atalho como string
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
};

// Utilitário para agrupar shortcuts por categoria
export const groupShortcutsByCategory = (shortcuts: KeyboardShortcut[]) => {
  return shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);
};

// Hook para busca rápida
export const useQuickSearch = (onSearch: (query: string) => void) => {
  const searchShortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Implementar modal de busca rápida
        const query = prompt('Busca rápida:');
        if (query) {
          onSearch(query);
        }
      },
      description: 'Busca rápida',
      category: 'actions',
    },
    {
      key: '/',
      action: () => {
        // Focar no campo de busca se existir
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="busca" i], input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focar campo de busca',
      category: 'actions',
    },
  ];

  return useKeyboardShortcuts(searchShortcuts);
};
