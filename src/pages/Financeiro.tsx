import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, TrendingUp, TrendingDown, FileText, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FinanceFilters } from "@/components/finance/FinanceFilters";
import { KpiBar } from "@/components/finance/KpiBar";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { PendingPayoutsPanel } from "@/components/finance/PendingPayoutsPanel";
import { EventsSummaryPanel } from "@/components/finance/EventsSummaryPanel";
import { UpsertIncomeDrawer } from "@/components/finance/drawers/UpsertIncomeDrawer";
import { UpsertExpenseDrawer } from "@/components/finance/drawers/UpsertExpenseDrawer";
import { UpsertPayoutDrawer } from "@/components/finance/drawers/UpsertPayoutDrawer";
import { useSEO } from "@/hooks/useSEO";

const Financeiro = () => {
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [payoutDrawerOpen, setPayoutDrawerOpen] = useState(false);

  useSEO({
    title: "Financeiro - LA Music Hub",
    description: "Controle financeiro completo para bandas e eventos musicais"
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de receitas, despesas e cachês do sistema
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIncomeDrawerOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Receita
          </Button>
          <Button onClick={() => setExpenseDrawerOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Despesa
          </Button>
          <Button onClick={() => setPayoutDrawerOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Cachê/Repasse
          </Button>
          <Button variant="ghost" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="ghost" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FinanceFilters />

      {/* KPIs */}
      <KpiBar />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Transactions Table */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações</CardTitle>
              <CardDescription>
                Histórico de receitas, despesas e cachês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable />
            </CardContent>
          </Card>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          <PendingPayoutsPanel />
          <EventsSummaryPanel />
        </div>
      </div>

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

export default Financeiro;