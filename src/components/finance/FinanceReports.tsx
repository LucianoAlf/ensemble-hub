import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Filter, BarChart3, Loader2, AlertCircle, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useRealFinancialData } from "@/hooks/useRealFinancialData";
import { useTransactions } from "@/hooks/useFinancialData";
import { useTenant } from "@/hooks/useTenant";
import { financialCalculations } from "@/services/financialCalculationService";
import { formatCurrency } from "@/types/financial";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImprovedFilters from "./ImprovedFilters";
import ReportConfigModal, { ReportConfig } from "./ReportConfigModal";

const FinanceReports = () => {
  // Estados para controle de timeout e debug
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{start: Date, end: Date} | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentReportType, setCurrentReportType] = useState<'csv' | 'pdf' | 'period'>('csv');
  
  // Cache para resultados de cálculos pesados
  const calculationCache = useRef(new Map<string, any>());
  const lastTransactionsHash = useRef<string>('');
  
  // Obter tenant_id do usuário autenticado
  const { tenantId, loading: tenantLoading, error: tenantError, hasTenant } = useTenant();
  
  // Usar os mesmos hooks que o Dashboard
  const { summary, loading: summaryLoading, error: summaryError } = useRealFinancialData(tenantId || '');
  const { transactions, loading: transactionsLoading } = useTransactions(tenantId || '');
  
  // Função para gerar hash das transações para cache
  const generateTransactionsHash = useCallback((transactions: any[]) => {
    if (!transactions || transactions.length === 0) return 'empty';
    return `${transactions.length}-${transactions.map(t => `${t.id}-${t.amount}-${t.date}`).join('|')}`;
  }, []);
  
  // Debug logs otimizados (apenas quando necessário)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp}: tenantLoading=${tenantLoading}, summaryLoading=${summaryLoading}, transactionsLoading=${transactionsLoading}, transactions=${transactions?.length || 0}`;
      setDebugInfo(prev => [...prev.slice(-2), logEntry]); // Reduzido para 3 logs
    }
  }, [tenantLoading, summaryLoading, transactionsLoading, transactions?.length]);
  
  // Timeout de segurança para evitar loading eterno
  useEffect(() => {
    if (summaryLoading || transactionsLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('📊 [FinanceReports] Timeout de loading atingido (10s)');
        setLoadingTimeout(true);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [summaryLoading, transactionsLoading]);
  
  // Função memoizada para converter transações
  const convertTransactions = useCallback((transactions: any[]) => {
    return financialCalculations.convertDatabaseTransactions(transactions);
  }, []);
  
  // Função memoizada para calcular resumo por categoria
  const calculateCategorySummaryMemo = useCallback((standardTransactions: any[], type: 'income' | 'expense') => {
    const cacheKey = `category-${type}-${generateTransactionsHash(standardTransactions)}`;
    
    if (calculationCache.current.has(cacheKey)) {
      return calculationCache.current.get(cacheKey);
    }
    
    const result = financialCalculations.calculateCategorySummary(standardTransactions, type);
    calculationCache.current.set(cacheKey, result);
    
    // Limpar cache antigo (manter apenas 10 entradas)
    if (calculationCache.current.size > 10) {
      const firstKey = calculationCache.current.keys().next().value;
      calculationCache.current.delete(firstKey);
    }
    
    return result;
  }, [generateTransactionsHash]);
  
  // Função memoizada para calcular evolução mensal
  const calculateMonthlyEvolutionMemo = useCallback((standardTransactions: any[], months: number = 6) => {
    const cacheKey = `monthly-${months}-${generateTransactionsHash(standardTransactions)}`;
    
    if (calculationCache.current.has(cacheKey)) {
      return calculationCache.current.get(cacheKey);
    }
    
    const result = financialCalculations.calculateMonthlyEvolution(standardTransactions, months);
    calculationCache.current.set(cacheKey, result);
    
    // Limpar cache antigo
    if (calculationCache.current.size > 10) {
      const firstKey = calculationCache.current.keys().next().value;
      calculationCache.current.delete(firstKey);
    }
    
    return result;
  }, [generateTransactionsHash]);
  
  // Hook personalizado para debounce
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedTransactions, setDebouncedTransactions] = useState(transactions);
  
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setDebouncedTransactions(transactions);
    }, 300); // 300ms de debounce
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [transactions]);
  
  // Mapeamento de categorias simplificadas
  const categoryMapping = {
    income: {
      'show': 'Venda de Shows',
      'festival': 'Venda de Shows', 
      'Show/Apresentação': 'Venda de Shows',
      'Ingressos': 'Venda de Ingressos',
      'Patrocínio': 'Patrocínios',
      'Direitos Autorais': 'Taxa de Espetáculo',
      'Streaming': 'Taxa de Espetáculo',
      'Aulas/Workshops': 'Outros',
      'Venda de Produtos': 'Outros'
    },
    expense: {
      'recording': 'Locação de Espaço',
      'equipment': 'Locação de Equipamentos', 
      'transport': 'Transporte',
      'marketing': 'Outros',
      'maintenance': 'Outros',
      'accommodation': 'Alimentação'
    }
  };

  // Paleta de cores otimizada para categorias
  const colorPalettes = {
    income: {
      'Venda de Shows': '#10B981',      // Verde principal
      'Venda de Ingressos': '#059669',  // Verde escuro
      'Patrocínios': '#34D399',         // Verde claro
      'Taxa de Espetáculo': '#6EE7B7',  // Verde muito claro
      'Outros': '#A7F3D0'               // Verde pastel
    },
    expense: {
      'Locação de Espaço': '#EF4444',        // Vermelho principal
      'Locação de Equipamentos': '#DC2626',  // Vermelho escuro
      'Transporte': '#F87171',               // Vermelho claro
      'Alimentação': '#FCA5A5',              // Vermelho muito claro
      'Pagamento de Cachês': '#B91C1C',      // Vermelho muito escuro
      'Ajuda de Custo': '#FECACA',           // Vermelho pastel
      'Fretes': '#FEE2E2',                   // Vermelho ultra claro
      'Auxilio Transporte': '#F3F4F6',       // Cinza claro
      'Outros': '#FEF2F2'                    // Vermelho ultra pastel
    }
  };

  // Função para mapear e agrupar categorias
  const mapAndGroupCategories = useCallback((transactions: any[], type: 'income' | 'expense') => {
    const grouped = transactions
      .filter(t => t.type === type)
      .reduce((acc, transaction) => {
        const originalCategory = transaction.category;
        const mappedCategory = categoryMapping[type][originalCategory] || 'Outros';
        
        if (!acc[mappedCategory]) {
          acc[mappedCategory] = 0;
        }
        acc[mappedCategory] += Number(transaction.amount) || 0;
        return acc;
      }, {} as Record<string, number>);

    const total = Object.values(grouped).reduce((sum: number, amount: number) => sum + amount, 0);
    
    return Object.entries(grouped)
      .map(([category, amount]) => {
        const numAmount = Number(amount);
        return {
          category,
          amount: numAmount,
          percentage: (total as number) > 0 ? (numAmount / (total as number)) * 100 : 0,
          color: colorPalettes[type][category] || '#6B7280'
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, []);

  // Calcular relatórios baseados nos dados reais - OTIMIZADO: cache, memoização e debounce
  const reports = useMemo(() => {
    // Evitar recálculo durante loading ou se não há dados
    if (!debouncedTransactions || debouncedTransactions.length === 0) {
      return {
        incomeByCategory: [],
        expensesByCategory: [],
        monthlyEvolution: []
      };
    }
    
    // Verificar se os dados mudaram usando hash
    const currentHash = generateTransactionsHash(debouncedTransactions);
    if (currentHash === lastTransactionsHash.current) {
      const cachedResult = calculationCache.current.get(`reports-${currentHash}`);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    try {
      // Converter transações para formato padronizado
      const standardTransactions = convertTransactions(debouncedTransactions);
      
      // Usar novo mapeamento de categorias simplificadas
      const incomeByCategory = mapAndGroupCategories(standardTransactions, 'income');
      const expensesByCategory = mapAndGroupCategories(standardTransactions, 'expense');
      
      // Calcular evolução mensal com cache
      const monthlyEvolution = calculateMonthlyEvolutionMemo(standardTransactions, 6);
      
      const result = {
        incomeByCategory,
        expensesByCategory,
        monthlyEvolution
      };
      
      // Cachear resultado completo
      calculationCache.current.set(`reports-${currentHash}`, result);
      lastTransactionsHash.current = currentHash;
      
      return result;
    } catch (error) {
      console.error('📊 [FinanceReports] Erro ao calcular relatórios:', error);
      return {
        incomeByCategory: [],
        expensesByCategory: [],
        monthlyEvolution: []
      };
    }
  }, [debouncedTransactions, generateTransactionsHash, convertTransactions, calculateMonthlyEvolutionMemo, mapAndGroupCategories]);

  // Função para abrir modal de configuração
  const openReportModal = (type: 'csv' | 'pdf' | 'period') => {
    setCurrentReportType(type);
    setModalOpen(true);
  };

  // Função para exportar CSV com configuração
  const handleExportCSV = useCallback(async (config?: ReportConfig) => {
    setIsExporting(true);
    try {
      if (!debouncedTransactions || debouncedTransactions.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há transações para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Filtrar transações baseado na configuração
      let filteredTransactions = debouncedTransactions;
      
      if (config) {
        // Filtrar por período
        if (config.dateRange?.from && config.dateRange?.to) {
          filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.transaction_date || transaction.created_at);
            return transactionDate >= config.dateRange!.from! && transactionDate <= config.dateRange!.to!;
          });
        }
        
        // Filtrar por tipos
        filteredTransactions = filteredTransactions.filter(transaction => {
          if (transaction.type === 'income' && !config.includeTypes.receitas) return false;
          if (transaction.type === 'expense' && !config.includeTypes.despesas) return false;
          if (transaction.type === 'payout' && !config.includeTypes.caches) return false;
          return true;
        });
      }

      // Converter transações para formato CSV
      const csvHeaders = [
        'Data',
        'Descrição',
        'Categoria',
        'Tipo',
        'Valor Bruto',
        'Taxa',
        'Valor Líquido',
        'Status',
        'Beneficiário',
        'Evento',
        'Banda'
      ];

      const csvData = filteredTransactions.map(transaction => [
        format(new Date(transaction.transaction_date || transaction.created_at), 'dd/MM/yyyy', { locale: ptBR }),
        transaction.description || '',
        transaction.category || '',
        transaction.type === 'income' ? 'Receita' : transaction.type === 'expense' ? 'Despesa' : 'Cachê',
        formatCurrency(transaction.gross_amount || 0).replace('R$\u00a0', ''),
        formatCurrency(transaction.fee_amount || 0).replace('R$\u00a0', ''),
        formatCurrency(transaction.net_amount || transaction.gross_amount || 0).replace('R$\u00a0', ''),
        transaction.status === 'pending' ? 'Pendente' : transaction.status === 'scheduled' ? 'Agendado' : 'Liquidado',
        transaction.counterparty || '',
        (transaction as any).event_name || '',
        (transaction as any).band_name || ''
      ]);

      // Criar conteúdo CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV exportado com sucesso!",
        description: `${filteredTransactions.length} transações exportadas.`,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o arquivo CSV.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [debouncedTransactions]);

  // Função para gerar PDF com configuração
  const handleGeneratePDF = useCallback(async (config?: ReportConfig) => {
    setIsExporting(true);
    try {
      // Simular geração de PDF (em produção, usar biblioteca como jsPDF ou react-pdf)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Filtrar dados baseado na configuração
      let filteredReports = reports;
      if (config) {
        // Aqui você pode aplicar filtros específicos aos relatórios
        // Por exemplo, filtrar categorias baseado no período selecionado
      }
      
      // Criar conteúdo HTML para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório Financeiro</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .green { color: #16a34a; }
            .red { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório Financeiro</h1>
            <p>Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          </div>
          
          <div class="summary">
            <div class="card">
              <h3 class="green">Total de Receitas</h3>
              <p>${formatCurrency(reports.incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0))}</p>
            </div>
            <div class="card">
              <h3 class="red">Total de Despesas</h3>
              <p>${formatCurrency(reports.expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0))}</p>
            </div>
          </div>
          
          <h2>Receitas por Categoria</h2>
          <table>
            <tr><th>Categoria</th><th>Valor</th><th>Percentual</th></tr>
            ${reports.incomeByCategory.map(cat => 
              `<tr><td>${cat.category}</td><td class="green">${formatCurrency(cat.amount)}</td><td>${cat.percentage.toFixed(1)}%</td></tr>`
            ).join('')}
          </table>
          
          <h2>Despesas por Categoria</h2>
          <table>
            <tr><th>Categoria</th><th>Valor</th><th>Percentual</th></tr>
            ${reports.expensesByCategory.map(cat => 
              `<tr><td>${cat.category}</td><td class="red">${formatCurrency(cat.amount)}</td><td>${cat.percentage.toFixed(1)}%</td></tr>`
            ).join('')}
          </table>
        </body>
        </html>
      `;

      // Criar e baixar arquivo HTML (que pode ser convertido para PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório PDF gerado!",
        description: "Arquivo HTML baixado. Abra no navegador e use Ctrl+P para salvar como PDF.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o relatório PDF.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [reports]);

  // Função para processar configuração do relatório
  const handleReportGeneration = useCallback(async (config: ReportConfig) => {
    setModalOpen(false);
    
    // Atualizar período selecionado para exibição
    if (config.dateRange?.from && config.dateRange?.to) {
      setSelectedPeriod({ 
        start: config.dateRange.from, 
        end: config.dateRange.to 
      });
    }
    
    // Gerar relatório baseado no tipo
    switch (config.type) {
      case 'csv':
        await handleExportCSV(config);
        break;
      case 'pdf':
        await handleGeneratePDF(config);
        break;
      case 'period':
        // Para relatório por período, pode escolher entre CSV ou PDF
        await handleExportCSV(config);
        break;
    }
  }, [handleExportCSV, handleGeneratePDF]);
  
  // Tenant loading state
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verificando acesso...</span>
      </div>
    );
  }

  // Tenant error state
  if (tenantError || !hasTenant) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {tenantError || 'Usuário não possui acesso ao sistema financeiro. Entre em contato com o administrador.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Verificação de loading melhorada com timeout de segurança
  const isLoading = (summaryLoading || transactionsLoading) && !loadingTimeout;
  
  // Mostrar timeout de loading se passou de 10 segundos
  if (loadingTimeout) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>Timeout: Os dados estão demorando muito para carregar.</p>
            <details className="text-xs">
              <summary>Debug Info</summary>
              <pre className="mt-2 whitespace-pre-wrap">{debugInfo.join('\n')}</pre>
            </details>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setLoadingTimeout(false);
                window.location.reload();
              }}
            >
              Recarregar Página
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando relatórios...</span>
      </div>
    );
  }
  
  if (summaryError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados dos relatórios: {summaryError}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Filtros Melhorados */}
      <ImprovedFilters onFiltersChange={(filters) => {
        console.log('Filtros aplicados:', filters);
        // TODO: Implementar lógica de filtragem dos dados
      }} />
      
      {/* Seção de Relatórios e Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios e Exportação
          </CardTitle>
          <CardDescription>
            Gere relatórios detalhados e exporte dados para análise externa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Exportar CSV */}
            <Card className="border-2 border-dashed border-green-200 hover:border-green-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Exportar CSV</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Dados tabulares para análise em planilhas
                </p>
                <Button 
                  onClick={() => openReportModal('csv')}
                  disabled={isExporting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Configurar CSV
                </Button>
              </CardContent>
            </Card>

            {/* Gerar PDF */}
            <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Relatório PDF</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Documento formatado com gráficos e análises
                </p>
                <Button 
                  onClick={() => openReportModal('pdf')}
                  disabled={isExporting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Configurar PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório por Período */}
            <Card className="border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Por Período</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório customizado por data
                </p>
                <Button 
                  onClick={() => openReportModal('period')}
                  disabled={isExporting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Cards KPI com Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total de Receitas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    reports.incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0)
                  )}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <span>{reports.incomeByCategory.length} categorias</span>
            </div>
          </CardContent>
        </Card>

        {/* Total de Despesas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    reports.expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0)
                  )}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <span>{reports.expensesByCategory.length} categorias</span>
            </div>
          </CardContent>
        </Card>

        {/* Resultado Líquido */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resultado Líquido</p>
                <p className={`text-2xl font-bold ${
                  (reports.incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0) - 
                   reports.expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0)) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    reports.incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0) - 
                    reports.expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0)
                  )}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <span>
                {((reports.incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0) - 
                   reports.expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0)) >= 0) 
                  ? 'Lucro' : 'Prejuízo'} no período
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Período Analisado */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Período Analisado</p>
                <p className="text-2xl font-bold">
                  {reports.monthlyEvolution.length}
                </p>
                <p className="text-sm text-muted-foreground">meses</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              {reports.monthlyEvolution.length > 0 && (
                <span>
                  {reports.monthlyEvolution[0]?.month} - {reports.monthlyEvolution[reports.monthlyEvolution.length - 1]?.month}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo por Categoria - Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das receitas baseada nos dados reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.incomeByCategory.length > 0 ? (
              <div className="space-y-4">
                {reports.incomeByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-700">
                        {formatCurrency(category.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de receita disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo por Categoria - Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das despesas baseada nos dados reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.expensesByCategory.length > 0 ? (
              <div className="space-y-4">
                {reports.expensesByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-700">
                        {formatCurrency(category.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de despesa disponível
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      
      {/* Informações do Período Selecionado */}
      {selectedPeriod && (
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Período Selecionado:</span>
                <span className="text-sm text-muted-foreground">
                  {format(selectedPeriod.start, 'dd/MM/yyyy')} até {format(selectedPeriod.end, 'dd/MM/yyyy')}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedPeriod(null)}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Modal de Configuração de Relatórios */}
      <ReportConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleReportGeneration}
        reportType={currentReportType}
        isGenerating={isExporting}
      />
    </div>
  );
};

export default FinanceReports;