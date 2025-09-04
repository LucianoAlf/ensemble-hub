import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, usePayouts, useFinanceiro, useDashboardMetrics } from '@/hooks/useFinancialData';
import { ConfirmationModal } from './ConfirmationModal';
import { FinancialFeedback } from './FinancialFeedback';
import { TransactionForm } from './TransactionForm';
import { PayoutForm } from './PayoutForm';
import { FinanceiroForm } from './FinanceiroForm';
import { Plus, Search, Filter, RefreshCw, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Payout = Database['public']['Tables']['payouts']['Row'];
type Financeiro = Database['public']['Tables']['financeiro']['Row'];

interface FinancialManagerProps {
  tenantId: string;
  eventoId?: string;
  bandaId?: string;
}

export const FinancialManager: React.FC<FinancialManagerProps> = ({ 
  tenantId, 
  eventoId, 
  bandaId 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'payouts' | 'financeiro'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | Payout | Financeiro | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'transaction' | 'payout' | 'financeiro';
    item: Transaction | Payout | Financeiro;
  } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const { toast } = useToast();

  // Hooks de dados com validação de tenantId
  const transactionsData = useTransactions(tenantId, {
    evento_id: eventoId,
    banda_id: bandaId
  });

  const payoutsData = usePayouts(tenantId, {
    evento_id: eventoId
  });

  const financeiroData = useFinanceiro(tenantId, {
    evento_id: eventoId
  });

  const dashboardMetrics = useDashboardMetrics(tenantId);

  // Validação inicial
  useEffect(() => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant ID é obrigatório para usar o FinancialManager',
        variant: 'destructive'
      });
    }
  }, [tenantId, toast]);

  // Funções de feedback
  const showFeedback = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setTimeout(() => setFeedbackMessage(null), 5000);
  }, []);

  // Funções de refresh
  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        transactionsData.refreshTransactions(),
        payoutsData.refreshPayouts(),
        financeiroData.refreshFinanceiro(),
        dashboardMetrics.refetch()
      ]);
      showFeedback('Dados atualizados com sucesso', 'success');
    } catch (error) {
      showFeedback('Erro ao atualizar dados', 'error');
    }
  }, [transactionsData, payoutsData, financeiroData, dashboardMetrics, showFeedback]);

  // Funções de CRUD
  const handleCreate = useCallback(async (type: string, data: any) => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant ID é obrigatório',
        variant: 'destructive'
      });
      return false;
    }

    try {
      let result;
      switch (type) {
        case 'transaction':
          result = await transactionsData.createTransaction({
            ...data,
            tenant_id: tenantId,
            evento_id: eventoId,
            banda_id: bandaId
          });
          break;
        case 'payout':
          result = await payoutsData.createPayout({
            ...data,
            tenant_id: tenantId,
            evento_id: eventoId
          });
          break;
        case 'financeiro':
          result = await financeiroData.createFinanceiro({
            ...data,
            tenant_id: tenantId,
            evento_id: eventoId
          });
          break;
        default:
          throw new Error('Tipo desconhecido');
      }

      if (result.success) {
        showFeedback(`${type} criado com sucesso`, 'success');
        setShowForm(false);
        return true;
      } else {
        showFeedback(result.error || `Erro ao criar ${type}`, 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showFeedback(errorMessage, 'error');
      return false;
    }
  }, [tenantId, eventoId, bandaId, transactionsData, payoutsData, financeiroData, showFeedback]);

  const handleUpdate = useCallback(async (type: string, id: string, data: any) => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant ID é obrigatório',
        variant: 'destructive'
      });
      return false;
    }

    try {
      let result;
      switch (type) {
        case 'transaction':
          result = await transactionsData.updateTransaction(id, {
            ...data,
            tenant_id: tenantId
          });
          break;
        case 'payout':
          result = await payoutsData.updatePayout(id, {
            ...data,
            tenant_id: tenantId
          });
          break;
        case 'financeiro':
          result = await financeiroData.updateFinanceiro(id, {
            ...data,
            tenant_id: tenantId
          });
          break;
        default:
          throw new Error('Tipo desconhecido');
      }

      if (result.success) {
        showFeedback(`${type} atualizado com sucesso`, 'success');
        setEditingItem(null);
        return true;
      } else {
        showFeedback(result.error || `Erro ao atualizar ${type}`, 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showFeedback(errorMessage, 'error');
      return false;
    }
  }, [tenantId, transactionsData, payoutsData, financeiroData, showFeedback]);

  const handleDelete = useCallback(async (type: string, id: string) => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant ID é obrigatório',
        variant: 'destructive'
      });
      return false;
    }

    try {
      let result;
      switch (type) {
        case 'transaction':
          result = await transactionsData.deleteTransaction(id);
          break;
        case 'payout':
          result = await payoutsData.deletePayout(id);
          break;
        case 'financeiro':
          result = await financeiroData.deleteFinanceiro(id);
          break;
        default:
          throw new Error('Tipo desconhecido');
      }

      if (result.success) {
        showFeedback(`${type} removido com sucesso`, 'success');
        setItemToDelete(null);
        return true;
      } else {
        showFeedback(result.error || `Erro ao remover ${type}`, 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showFeedback(errorMessage, 'error');
      return false;
    }
  }, [tenantId, transactionsData, payoutsData, financeiroData, showFeedback]);

  // Funções de filtro
  const filteredTransactions = transactionsData.transactions.filter(t =>
    searchTerm === '' || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayouts = payoutsData.payouts.filter(p =>
    searchTerm === '' || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.beneficiary_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFinanceiro = financeiroData.financeiro.filter(f =>
    searchTerm === '' || 
    f.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro de Configuração</h3>
            <p>Tenant ID é obrigatório para usar o FinancialManager</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {dashboardMetrics.metrics.totalIncome.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {dashboardMetrics.metrics.totalExpense.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardMetrics.metrics.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {dashboardMetrics.metrics.netAmount.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payouts Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardMetrics.metrics.pendingPayouts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback */}
      {feedbackMessage && (
        <FinancialFeedback
          type={feedbackType}
          message={feedbackMessage}
          onClose={() => setFeedbackMessage(null)}
        />
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento Financeiro</CardTitle>
              <CardDescription>
                Gerencie transações, payouts e registros financeiros
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllData}
                disabled={dashboardMetrics.loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Movimentações</TabsTrigger>
          <TabsTrigger value="payouts">Pagamentos</TabsTrigger>
          <TabsTrigger value="financeiro">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas Totais</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {dashboardMetrics.metrics.totalIncome.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {dashboardMetrics.metrics.totalExpense.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  dashboardMetrics.metrics.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {dashboardMetrics.metrics.netAmount.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardMetrics.metrics.pendingPayouts}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>Visão geral das movimentações financeiras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total de Transações:</span>
                  <span className="font-medium">{dashboardMetrics.metrics.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Receitas:</span>
                  <span className="font-medium text-green-600">
                    R$ {dashboardMetrics.metrics.totalIncome.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Despesas:</span>
                  <span className="font-medium text-red-600">
                    R$ {dashboardMetrics.metrics.totalExpense.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Saldo Final:</span>
                    <span className={`font-bold text-lg ${
                      dashboardMetrics.metrics.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {dashboardMetrics.metrics.netAmount.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionForm
            open={showForm && activeTab === 'transactions'}
            onOpenChange={(open) => {
              setShowForm(open);
              if (!open) setEditingItem(null);
            }}
            tenantId={tenantId}
            eventoId={eventoId}
            bandaId={bandaId}
            initialData={editingItem as Transaction}
            onSubmit={(data) => handleCreate('transaction', data)}
          />
          
          <div className="mt-4">
            {transactionsData.loading && <div>Carregando transações...</div>}
            {transactionsData.error && (
              <div className="text-red-500">Erro: {transactionsData.error}</div>
            )}
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{transaction.description}</h4>
                      <p className="text-sm text-gray-600">{transaction.category}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        R$ {transaction.amount.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-500">{transaction.status}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(transaction)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setItemToDelete({ type: 'transaction', item: transaction })}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutForm
            open={showForm && activeTab === 'payouts'}
            onOpenChange={(open) => {
              setShowForm(open);
              if (!open) setEditingItem(null);
            }}
            tenantId={tenantId}
            eventoId={eventoId}
            initialData={editingItem as Payout}
            onSubmit={(data) => handleCreate('payout', data)}
          />
          
          <div className="mt-4">
            {payoutsData.loading && <div>Carregando payouts...</div>}
            {payoutsData.error && (
              <div className="text-red-500">Erro: {payoutsData.error}</div>
            )}
            <div className="space-y-2">
              {filteredPayouts.map((payout) => (
                <div key={payout.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{payout.description}</h4>
                      <p className="text-sm text-gray-600">{payout.beneficiary_name}</p>
                      <p className="text-sm text-gray-500">
                        Vencimento: {new Date(payout.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {payout.amount.toLocaleString('pt-BR')}</p>
                      <p className="text-sm text-gray-500">{payout.status}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(payout)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setItemToDelete({ type: 'payout', item: payout })}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financeiro">
          <FinanceiroForm
            financeiro={editingItem as Financeiro}
            tenantId={tenantId}
            onSubmit={(data) => handleCreate('financeiro', data)}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            loading={false}
          />
          
          <div className="mt-4">
            {financeiroData.loading && <div>Carregando registros financeiros...</div>}
            {financeiroData.error && (
              <div className="text-red-500">Erro: {financeiroData.error}</div>
            )}
            <div className="space-y-2">
              {filteredFinanceiro.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.descricao}</h4>
                      <p className="text-sm text-gray-600">{item.categoria}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.data_transacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        R$ {item.valor.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-500">{item.tipo}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setItemToDelete({ type: 'financeiro', item })}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            handleDelete(itemToDelete.type, itemToDelete.item.id);
          }
        }}
        title={`Confirmar exclusão`}
        description={`Tem certeza que deseja excluir este ${itemToDelete?.type}? Esta ação não pode ser desfeita.`}
        item={itemToDelete?.item}
      />
    </div>
  );
};

export default FinancialManager;