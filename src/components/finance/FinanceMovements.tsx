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

const FinanceMovements = () => {
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [payoutDrawerOpen, setPayoutDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const { editingState } = useFinancialEditing();

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
          <Button onClick={() => setIncomeDrawerOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
          <Button onClick={() => setExpenseDrawerOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
          <Button onClick={() => setPayoutDrawerOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cachê
          </Button>
        </div>

        {/* Tabela de Movimentações */}
        <EnhancedTransactionsTable 
          filters={filters}
          onTransactionUpdate={(transaction) => {
            console.log('Transaction updated:', transaction);
          }}
        />

        {/* Drawers */}
        <UpsertIncomeDrawer 
          open={incomeDrawerOpen} 
          onOpenChange={setIncomeDrawerOpen}
        />
        <UpsertExpenseDrawer 
          open={expenseDrawerOpen} 
          onOpenChange={setExpenseDrawerOpen}
        />
        <UpsertPayoutDrawer 
          open={payoutDrawerOpen} 
          onOpenChange={setPayoutDrawerOpen}
        />
      </div>
    </RealTimeSyncProvider>
  );
};

export default FinanceMovements;