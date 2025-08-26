import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinanceDashboard from "@/components/finance/FinanceDashboard";
import FinanceMovements from "@/components/finance/FinanceMovements";
import FinanceReports from "@/components/finance/FinanceReports";
import CompactFilters from "@/components/finance/CompactFilters";
import { useSEO } from "@/hooks/useSEO";

const Financeiro = () => {
  useSEO({
    title: "Financeiro - LA Music Hub",
    description: "Controle financeiro completo para bandas e eventos musicais"
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Controle de receitas, despesas e cachês do sistema
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <CompactFilters />
          <FinanceMovements />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <CompactFilters />
          <FinanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;