import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3, PieChart, Calendar } from "lucide-react";

const FinanceReports = () => {
  return (
    <div className="space-y-6">
      {/* Ações de Exportação */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar Relatório PDF
        </Button>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Relatório Mensal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das receitas nos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Shows e Apresentações</span>
                <span className="font-semibold">R$ 84.500,00 (65%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Aulas e Workshops</span>
                <span className="font-semibold">R$ 28.300,00 (22%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Eventos Privados</span>
                <span className="font-semibold">R$ 16.900,00 (13%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das despesas nos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Equipamentos</span>
                <span className="font-semibold">R$ 15.200,00 (35%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transporte</span>
                <span className="font-semibold">R$ 12.800,00 (30%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Marketing</span>
                <span className="font-semibold">R$ 8.500,00 (20%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Outros</span>
                <span className="font-semibold">R$ 6.400,00 (15%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Comparativo de receitas vs despesas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: "Outubro 2023", income: 18500, expenses: 8200 },
                { month: "Novembro 2023", income: 22300, expenses: 9800 },
                { month: "Dezembro 2023", income: 31200, expenses: 12400 },
                { month: "Janeiro 2024", income: 19800, expenses: 7600 },
                { month: "Fevereiro 2024", income: 25100, expenses: 8900 },
                { month: "Março 2024", income: 28450, expenses: 11200 }
              ].map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{data.month}</span>
                    <span>
                      Resultado: R$ {(data.income - data.expenses).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Receitas: R$ {data.income.toLocaleString('pt-BR')}</span>
                      <span className="text-red-600">Despesas: R$ {data.expenses.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(data.income / (data.income + data.expenses)) * 100}%` }}
                      ></div>
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${(data.expenses / (data.income + data.expenses)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReports;