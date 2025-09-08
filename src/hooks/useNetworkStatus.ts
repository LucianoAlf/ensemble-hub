import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
}

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  description: string;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown'
  });
  
  const [operationQueue, setOperationQueue] = useState<QueuedOperation[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Detectar mudanças de conectividade
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
        connectionType: connection ? connection.effectiveType : 'unknown'
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
      toast.success('Conexão restaurada', {
        description: 'Processando operações pendentes...'
      });
      processQueue();
    };

    const handleOffline = () => {
      updateNetworkStatus();
      toast.error('Conexão perdida', {
        description: 'Operações serão executadas quando a conexão for restaurada'
      });
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  // Adicionar operação à queue
  const queueOperation = useCallback((
    operation: () => Promise<any>,
    description: string,
    maxRetries: number = 3
  ): string => {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedOp: QueuedOperation = {
      id,
      operation,
      retryCount: 0,
      maxRetries,
      timestamp: Date.now(),
      description
    };

    setOperationQueue(prev => [...prev, queuedOp]);
    
    // Se estiver online, processar imediatamente
    if (networkStatus.isOnline) {
      processQueue();
    }

    return id;
  }, [networkStatus.isOnline]);

  // Processar queue de operações
  const processQueue = useCallback(async () => {
    if (isProcessingQueue || operationQueue.length === 0 || !networkStatus.isOnline) {
      return;
    }

    setIsProcessingQueue(true);

    const currentQueue = [...operationQueue];
    const successfulOps: string[] = [];
    const failedOps: QueuedOperation[] = [];

    for (const queuedOp of currentQueue) {
      try {
        await queuedOp.operation();
        successfulOps.push(queuedOp.id);
        
        if (successfulOps.length === 1) {
          toast.success('Operação sincronizada', {
            description: queuedOp.description
          });
        }
      } catch (error) {
        console.error(`Erro ao processar operação ${queuedOp.id}:`, error);
        
        if (queuedOp.retryCount < queuedOp.maxRetries) {
          failedOps.push({
            ...queuedOp,
            retryCount: queuedOp.retryCount + 1
          });
        } else {
          toast.error('Operação falhou', {
            description: `${queuedOp.description} - Máximo de tentativas excedido`
          });
        }
      }
    }

    // Atualizar queue removendo operações bem-sucedidas e atualizando falhas
    setOperationQueue(prev => 
      prev.filter(op => !successfulOps.includes(op.id))
        .map(op => {
          const failedOp = failedOps.find(f => f.id === op.id);
          return failedOp || op;
        })
    );

    if (successfulOps.length > 1) {
      toast.success(`${successfulOps.length} operações sincronizadas`);
    }

    setIsProcessingQueue(false);
  }, [operationQueue, networkStatus.isOnline, isProcessingQueue]);

  // Limpar operações antigas (mais de 1 hora)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      setOperationQueue(prev => 
        prev.filter(op => op.timestamp > oneHourAgo)
      );
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  // Remover operação específica da queue
  const removeFromQueue = useCallback((operationId: string) => {
    setOperationQueue(prev => prev.filter(op => op.id !== operationId));
  }, []);

  // Limpar toda a queue
  const clearQueue = useCallback(() => {
    setOperationQueue([]);
  }, []);

  return {
    ...networkStatus,
    queuedOperationsCount: operationQueue.length,
    isProcessingQueue,
    queueOperation,
    processQueue,
    removeFromQueue,
    clearQueue
  };
};
