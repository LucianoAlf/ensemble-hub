import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSupabaseOptimized } from '@/hooks/useSupabaseOptimized';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
}

interface RealTimeSyncContextType {
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
  subscribeToChanges: (table: string, callback: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void) => () => void;
}

export const RealTimeSyncContext = createContext<RealTimeSyncContextType | undefined>(undefined);

interface RealTimeSyncProviderProps {
  children: React.ReactNode;
}

export const RealTimeSyncProvider: React.FC<RealTimeSyncProviderProps> = ({ children }) => {
  const { supabase } = useSupabaseOptimized();
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
  });

  const forceSync = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const { error } = await supabase.from('transactions').select('id').limit(1);
      if (error) throw error;
      setSyncStatus(prev => ({ ...prev, isSyncing: false, lastSync: new Date() }));
      toast({ title: 'Sincronização completa', description: 'Todos os dados estão atualizados', duration: 2000 });
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      toast({ title: 'Erro de sincronização', description: 'Não foi possível sincronizar os dados', variant: 'destructive' });
    }
  }, [supabase, toast]);

  const subscribeToChanges = useCallback((table: string, callback: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void) => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const createConnection = () => {
      if (!isMounted) return;

      const channel = supabase.channel('sync_status')
        .subscribe((status) => {
          if (!isMounted) return;

          if (status === 'SUBSCRIBED') {
            setSyncStatus(prev => ({ ...prev, isConnected: true }));
            retryCount = 0; // Reset retry count on successful connection
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setSyncStatus(prev => ({ ...prev, isConnected: false }));
            
            // Implement retry logic
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Tentando reconectar... (${retryCount}/${maxRetries})`);
              setTimeout(() => {
                if (isMounted) createConnection();
              }, 2000 * retryCount); // Exponential backoff
            } else {
              toast({
                title: 'Erro de sincronização',
                description: 'Conexão com o servidor perdida. As alterações serão sincronizadas quando possível.',
                variant: 'destructive',
              });
            }
          }
        });

      return channel;
    };

    const channel = createConnection();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, user?.id, toast]);

  const value: RealTimeSyncContextType = {
    syncStatus,
    forceSync,
    subscribeToChanges,
  };

  return (
    <RealTimeSyncContext.Provider value={value}>
      {children}
    </RealTimeSyncContext.Provider>
  );
};

export const SyncStatusIndicator: React.FC = () => {
  const context = useContext(RealTimeSyncContext);
  if (!context) {
    throw new Error('useRealTimeSync must be used within RealTimeSyncProvider');
  }
  const { syncStatus, forceSync } = context;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          syncStatus.isConnected ? 'bg-green-500' : 'bg-red-500',
          syncStatus.isSyncing && 'animate-pulse'
        )} />
        <span className="text-sm text-muted-foreground">
          {syncStatus.isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      {syncStatus.lastSync && (
        <span className="text-xs text-muted-foreground">
          Última sincronização: {syncStatus.lastSync.toLocaleTimeString()}
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={forceSync} disabled={syncStatus.isSyncing} className="text-xs">
        {syncStatus.isSyncing ? (
          <>
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
            Sincronizando...
          </>
        ) : (
          'Sincronizar'
        )}
      </Button>
    </div>
  );
};

export const SaveConfirmation: React.FC<{ show: boolean; onHide: () => void }> = ({ show, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right duration-300">
        <CheckCircle className="h-4 w-4" />
        <span>Alterações salvas com sucesso!</span>
      </div>
    </div>
  );
};

export const AutoSaveIndicator: React.FC<{ isSaving: boolean; lastSaved?: Date }> = ({ isSaving, lastSaved }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isSaving ? (
        <>
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Salvando...
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          Salvo às {lastSaved.toLocaleTimeString()}
        </>
      ) : (
        'Pronto para editar'
      )}
    </div>
  );
};
