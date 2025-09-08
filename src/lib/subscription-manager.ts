import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from './logger';

interface SubscriptionEntry {
  id: string;
  channel: RealtimeChannel;
  table: string;
  tenantId?: string;
  createdAt: number;
  lastActivity: number;
  componentName?: string;
}

class SubscriptionManager {
  private subscriptions = new Map<string, SubscriptionEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly maxInactiveTime = 5 * 60 * 1000; // 5 minutos
  private readonly cleanupIntervalTime = 2 * 60 * 1000; // 2 minutos

  constructor() {
    this.startCleanupInterval();
    this.setupPageUnloadCleanup();
  }

  // Iniciar intervalo de limpeza automática
  private startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
    }, this.cleanupIntervalTime);
  }

  // Configurar limpeza ao sair da página
  private setupPageUnloadCleanup() {
    if (typeof window !== 'undefined') {
      const cleanup = () => {
        this.cleanupAllSubscriptions();
      };

      window.addEventListener('beforeunload', cleanup);
      window.addEventListener('pagehide', cleanup);
      
      // Cleanup quando a aba perde foco por muito tempo
      let tabHiddenTime = 0;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          tabHiddenTime = Date.now();
        } else {
          // Se a aba ficou oculta por mais de 10 minutos, limpar subscriptions inativas
          if (tabHiddenTime && Date.now() - tabHiddenTime > 10 * 60 * 1000) {
            this.cleanupInactiveSubscriptions();
          }
        }
      });
    }
  }

  // Gerar ID único para subscription
  private generateSubscriptionId(table: string, tenantId?: string, componentName?: string): string {
    const parts = [table];
    if (tenantId) parts.push(tenantId);
    if (componentName) parts.push(componentName);
    return parts.join(':') + ':' + Date.now();
  }

  // Registrar nova subscription
  registerSubscription(
    channel: RealtimeChannel,
    table: string,
    tenantId?: string,
    componentName?: string
  ): string {
    const id = this.generateSubscriptionId(table, tenantId, componentName);
    const now = Date.now();

    const entry: SubscriptionEntry = {
      id,
      channel,
      table,
      tenantId,
      createdAt: now,
      lastActivity: now,
      componentName
    };

    this.subscriptions.set(id, entry);

    logger.debug('Subscription registrada', {
      id,
      table,
      tenantId,
      componentName,
      totalSubscriptions: this.subscriptions.size
    });

    return id;
  }

  // Atualizar atividade da subscription
  updateActivity(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastActivity = Date.now();
    }
  }

  // Remover subscription específica
  unregisterSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    try {
      // Unsubscribe do canal
      subscription.channel.unsubscribe();
      
      // Remover do mapa
      this.subscriptions.delete(subscriptionId);

      logger.debug('Subscription removida', {
        id: subscriptionId,
        table: subscription.table,
        componentName: subscription.componentName,
        totalSubscriptions: this.subscriptions.size
      });

      return true;
    } catch (error) {
      logger.error('Erro ao remover subscription', {
        id: subscriptionId,
        table: subscription.table
      }, error as Error);
      return false;
    }
  }

  // Limpar subscriptions inativas
  private cleanupInactiveSubscriptions() {
    const now = Date.now();
    const inactiveSubscriptions: string[] = [];

    for (const [id, subscription] of this.subscriptions.entries()) {
      if (now - subscription.lastActivity > this.maxInactiveTime) {
        inactiveSubscriptions.push(id);
      }
    }

    if (inactiveSubscriptions.length > 0) {
      logger.info('Limpando subscriptions inativas', {
        count: inactiveSubscriptions.length,
        totalBefore: this.subscriptions.size
      });

      inactiveSubscriptions.forEach(id => {
        this.unregisterSubscription(id);
      });
    }
  }

  // Limpar todas as subscriptions
  cleanupAllSubscriptions() {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    
    logger.info('Limpando todas as subscriptions', {
      count: subscriptionIds.length
    });

    subscriptionIds.forEach(id => {
      this.unregisterSubscription(id);
    });
  }

  // Limpar subscriptions por tabela
  cleanupSubscriptionsByTable(table: string, tenantId?: string) {
    const subscriptionsToRemove: string[] = [];

    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.table === table && 
          (!tenantId || subscription.tenantId === tenantId)) {
        subscriptionsToRemove.push(id);
      }
    }

    subscriptionsToRemove.forEach(id => {
      this.unregisterSubscription(id);
    });

    logger.debug('Subscriptions removidas por tabela', {
      table,
      tenantId,
      count: subscriptionsToRemove.length
    });
  }

  // Limpar subscriptions por componente
  cleanupSubscriptionsByComponent(componentName: string) {
    const subscriptionsToRemove: string[] = [];

    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.componentName === componentName) {
        subscriptionsToRemove.push(id);
      }
    }

    subscriptionsToRemove.forEach(id => {
      this.unregisterSubscription(id);
    });

    logger.debug('Subscriptions removidas por componente', {
      componentName,
      count: subscriptionsToRemove.length
    });
  }

  // Obter estatísticas das subscriptions
  getStats() {
    const now = Date.now();
    const stats = {
      total: this.subscriptions.size,
      active: 0,
      inactive: 0,
      byTable: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      oldestSubscription: 0,
      newestSubscription: 0
    };

    let oldest = now;
    let newest = 0;

    for (const subscription of this.subscriptions.values()) {
      // Atividade
      if (now - subscription.lastActivity <= this.maxInactiveTime) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Por tabela
      stats.byTable[subscription.table] = (stats.byTable[subscription.table] || 0) + 1;

      // Por componente
      if (subscription.componentName) {
        stats.byComponent[subscription.componentName] = 
          (stats.byComponent[subscription.componentName] || 0) + 1;
      }

      // Idade
      if (subscription.createdAt < oldest) oldest = subscription.createdAt;
      if (subscription.createdAt > newest) newest = subscription.createdAt;
    }

    stats.oldestSubscription = oldest === now ? 0 : now - oldest;
    stats.newestSubscription = newest === 0 ? 0 : now - newest;

    return stats;
  }

  // Destruir o gerenciador
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.cleanupAllSubscriptions();
  }
}

// Instância global do gerenciador
export const subscriptionManager = new SubscriptionManager();

// Hook para usar o gerenciador em componentes React
export const useSubscriptionManager = () => {
  return {
    register: subscriptionManager.registerSubscription.bind(subscriptionManager),
    unregister: subscriptionManager.unregisterSubscription.bind(subscriptionManager),
    updateActivity: subscriptionManager.updateActivity.bind(subscriptionManager),
    cleanupByTable: subscriptionManager.cleanupSubscriptionsByTable.bind(subscriptionManager),
    cleanupByComponent: subscriptionManager.cleanupSubscriptionsByComponent.bind(subscriptionManager),
    getStats: subscriptionManager.getStats.bind(subscriptionManager)
  };
};
