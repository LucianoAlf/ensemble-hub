import { useState, useCallback, useRef } from 'react';

type Source = 'dashboard' | 'events';

interface UseEventModalReturn {
  open: (eventId: string, source: Source, mode?: 'view' | 'edit') => void;
  close: () => void;
  isOpen: boolean;
  eventId: string | null;
  source: Source | null;
  mode: 'view' | 'edit' | null;
  setFocusRef: (element: HTMLElement | null) => void;
}

interface EventModalState {
  isOpen: boolean;
  eventId: string | null;
  source: Source | null;
  mode: 'view' | 'edit' | null;
}

const initialState: EventModalState = {
  isOpen: false,
  eventId: null,
  source: null,
  mode: null,
};

/**
 * Hook para controle global do modal de evento
 * 
 * Fornece funções para abrir/fechar o modal e rastrear o estado atual
 * incluindo o ID do evento e a origem da abertura (dashboard ou events)
 */
export function useEventModal(): UseEventModalReturn {
  const [state, setState] = useState<EventModalState>(initialState);
  const focusReturnRef = useRef<HTMLElement | null>(null);

  const open = useCallback((eventId: string, source: Source, mode: 'view' | 'edit' = 'edit') => {
    setState({
      isOpen: true,
      eventId,
      source,
      mode,
    });
  }, []);

  const close = useCallback(() => {
    setState(initialState);
    // Restaurar foco para o elemento que abriu o modal
    if (focusReturnRef.current) {
      // Usar setTimeout para garantir que o modal seja fechado antes de restaurar o foco
      setTimeout(() => {
        if (focusReturnRef.current) {
          focusReturnRef.current.focus();
          focusReturnRef.current = null;
        }
      }, 100);
    }
  }, []);

  const setFocusRef = useCallback((element: HTMLElement | null) => {
    focusReturnRef.current = element;
  }, []);

  return {
    open,
    close,
    isOpen: state.isOpen,
    eventId: state.eventId,
    source: state.source,
    mode: state.mode,
    setFocusRef,
  };
}