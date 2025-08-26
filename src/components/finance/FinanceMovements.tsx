import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionsTable } from "./TransactionsTable";
import { UpsertIncomeDrawer } from "./drawers/UpsertIncomeDrawer";
import { UpsertExpenseDrawer } from "./drawers/UpsertExpenseDrawer";
import { UpsertPayoutDrawer } from "./drawers/UpsertPayoutDrawer";

const FinanceMovements = () => {
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [payoutDrawerOpen, setPayoutDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
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
      <Card>
        <CardHeader>
          <CardTitle>Todas as Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable />
        </CardContent>
      </Card>

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
  );
};

export default FinanceMovements;