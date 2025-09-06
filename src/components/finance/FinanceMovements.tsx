import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EnhancedTransactionsTable } from "./EnhancedTransactionsTable";
import { UpsertIncomeDrawer } from "./drawers/UpsertIncomeDrawer";
import { UpsertExpenseDrawer } from "./drawers/UpsertExpenseDrawer";
import { UpsertPayoutDrawer } from "./drawers/UpsertPayoutDrawer";
import { RealTimeSyncProvider, SyncStatusIndicator } from "./RealTimeSyncProvider";
import { useFinancialEditing } from "@/hooks/useFinancialEditing";
import { AutoSaveIndicator } from "./RealTimeSyncProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Transaction = Database['public']['Tables']['transactions']['Row'];

const FinanceMovements = () => {
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [payoutDrawerOpen, setPayoutDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { editingState } = useFinancialEditing();

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    if (transaction.type === 'income') {
      setIncomeDrawerOpen(true);
    } else if (transaction.type === 'expense') {
      setExpenseDrawerOpen(true);
    } else if (transaction.type === 'payout') {
      setPayoutDrawerOpen(true);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    toast.success('Transação excluída com sucesso!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <RealTimeSyncProvider>
      <div className="space-y-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SyncStatusIndicator />
            <AutoSaveIndicator 
              isSaving={editingState.isSaving} 
              lastSaved={editingState.lastSaved} 
            />
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setIncomeDrawerOpen(true)} 
            className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
          <Button 
            onClick={() => setExpenseDrawerOpen(true)} 
            className="gap-2 bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
          <Button 
            onClick={() => setPayoutDrawerOpen(true)} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Plus className="h-4 w-4" />
            Novo Cachê
          </Button>
        </div>

        {/* Tabela de Movimentações */}
        <EnhancedTransactionsTable 
          filters={filters}
          onTransactionUpdate={handleViewDetails}
          onTransactionEdit={handleEditTransaction}
          onTransactionDelete={handleDeleteTransaction}
        />

        {/* Drawers */}
        <UpsertIncomeDrawer 
          open={incomeDrawerOpen} 
          onOpenChange={(open) => {
            setIncomeDrawerOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          incomeId={editingTransaction?.type === 'income' ? editingTransaction.id : undefined}
        />
        <UpsertExpenseDrawer 
          open={expenseDrawerOpen} 
          onOpenChange={(open) => {
            setExpenseDrawerOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          expenseId={editingTransaction?.type === 'expense' ? editingTransaction.id : undefined}
        />
        <UpsertPayoutDrawer 
          open={payoutDrawerOpen} 
          onOpenChange={(open) => {
            setPayoutDrawerOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          payoutId={editingTransaction?.type === 'payout' ? editingTransaction.id : undefined}
        />

        {/* Modal de Detalhes */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Transação</DialogTitle>
              <DialogDescription>
                Informações completas sobre a transação selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-sm">
                      {selectedTransaction.type === 'income' ? 'Receita' : 
                       selectedTransaction.type === 'expense' ? 'Despesa' : 'Cachê'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm">
                      {selectedTransaction.status === 'pending' ? 'Pendente' :
                       selectedTransaction.status === 'scheduled' ? 'Agendado' : 'Liquidado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data</label>
                    <p className="text-sm">{formatDate(selectedTransaction.transaction_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor Bruto</label>
                    <p className="text-sm font-semibold">{formatCurrency(selectedTransaction.gross_amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Taxa</label>
                    <p className="text-sm">{formatCurrency(selectedTransaction.fee_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor Líquido</label>
                    <p className="text-sm font-semibold">{formatCurrency(selectedTransaction.net_amount || selectedTransaction.gross_amount)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Categoria</label>
                  <p className="text-sm">{selectedTransaction.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição</label>
                  <p className="text-sm">{selectedTransaction.description || 'Sem descrição'}</p>
                </div>
                {selectedTransaction.counterparty && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contraparte</label>
                    <p className="text-sm">{selectedTransaction.counterparty}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div>
                    <label className="font-medium">Criado em</label>
                    <p>{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                  <div>
                    <label className="font-medium">Atualizado em</label>
                    <p>{formatDate(selectedTransaction.updated_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RealTimeSyncProvider>
  );
};

export default FinanceMovements;