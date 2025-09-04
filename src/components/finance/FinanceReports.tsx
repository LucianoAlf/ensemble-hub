import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3, PieChart, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useRealFinancialData } from "@/hooks/useRealFinancialData";
import { useTransactions } from "@/hooks/useFinancialData";
import { useTenant } from "@/hooks/useTenant";
import { financialCalculations } from "@/services/financialCalculationService";
import { formatCurrency } from "@/types/financial";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";

const FinanceReports = () => {
  // Estados para controle de timeout e debug
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
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
      
      // Calcular resumos por categoria com cache
      const incomeByCategory = calculateCategorySummaryMemo(standardTransactions, 'income');
      const expensesByCategory = calculateCategorySummaryMemo(standardTransactions, 'expense');
      
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
  }, [debouncedTransactions, generateTransactionsHash, convertTransactions, calculateCategorySummaryMemo, calculateMonthlyEvolutionMemo]);
  
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
            <div className="space-y-4">
              {reports.incomeByCategory.length > 0 ? (
                reports.incomeByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{category.category}</span>
                    <span className="font-semibold">
                      {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma receita encontrada no período
                </div>
              )}
              {reports.incomeByCategory.length > 0 && (
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                </div>
              )}
            </div>
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
            <div className="space-y-4">
              {reports.expensesByCategory.length > 0 ? (
                reports.expensesByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{category.category}</span>
                    <span className="font-semibold">
                      {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma despesa encontrada no período
                </div>
              )}
              {reports.expensesByCategory.length > 0 && (
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full" style={{ width: '100%' }}></div>
                </div>
              )}
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
              Comparativo de receitas vs despesas baseado nos dados reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.monthlyEvolution.length > 0 ? (
                reports.monthlyEvolution.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <span>
                        Resultado: {formatCurrency(data.net)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Receitas: {formatCurrency(data.income)}</span>
                        <span className="text-red-600">Despesas: {formatCurrency(data.expenses)}</span>
                      </div>
                      {(data.income + data.expenses) > 0 && (
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
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado histórico encontrado para exibir a evolução mensal
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReports;