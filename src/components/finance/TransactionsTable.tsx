import { useState, useCallback, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Check, Trash2, Music, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTransactions } from "@/hooks/useFinancialData";
import { useTenant } from "@/hooks/useTenant";
// Remove unused import since FinancialTransaction type is not directly used

export const TransactionsTable = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 itens por página para melhor performance
  const { tenantId } = useTenant();
  const { transactions, loading, error } = useTransactions(tenantId || '', {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando transações...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Erro ao carregar transações: {error}</div>
      </div>
    );
  }

  // Memoizar formatador de moeda para evitar recriação
  // Move useCallback hook before any conditional returns
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  // Memoizar configuração de status badges
  const statusVariants = useMemo(() => ({
    pending: { variant: "outline" as const, label: "Pendente" },
    scheduled: { variant: "secondary" as const, label: "Agendado" },
    settled: { variant: "default" as const, label: "Pago/Recebido" },
    completed: { variant: "default" as const, label: "Concluído" }
  }), []);

  const getStatusBadge = useCallback((status: string) => {
    const config = statusVariants[status as keyof typeof statusVariants] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }, [statusVariants]);

  // Calcular dados de paginação
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = useMemo(() => {
    return transactions.slice(startIndex, endIndex);
  }, [transactions, startIndex, endIndex]);

  // Memoizar formatação de datas para evitar recálculos
  const formatDate = useCallback((date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  }, []);

  // Fix 1: Add missing goToPage function and fix goToPreviousPage definition
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  // Fix 2: Update pagination buttons to use handlePageChange instead of goToPage
  // Handlers de paginação
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Otimizar handlers de seleção com useCallback
  // Move useCallback hook before conditional returns to avoid React Hook errors
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedRows(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(rowId => rowId !== id);
      }
    });
  }, []);

  // Move useCallback hook before conditional returns to avoid React Hook errors
const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Selecionar apenas as transações da página atual
      const currentPageIds = paginatedTransactions.map(t => t.id);
      setSelectedRows(prev => [...new Set([...prev, ...currentPageIds])]);
    } else {
      // Desselecionar apenas as transações da página atual
      const currentPageIds = new Set(paginatedTransactions.map(t => t.id));
      setSelectedRows(prev => prev.filter(id => !currentPageIds.has(id)));
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} item(s) selecionado(s)
          </span>
          <Button size="sm" variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            Marcar como pago
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedTransactions.length > 0 && 
                    paginatedTransactions.every(t => selectedRows.includes(t.id))
                  }
                  data-indeterminate={
                    paginatedTransactions.some(t => selectedRows.includes(t.id)) &&
                    !paginatedTransactions.every(t => selectedRows.includes(t.id))
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Banda</TableHead>
              <TableHead>Contraparte</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(transaction.id)}
                    onCheckedChange={(checked) => handleSelectRow(transaction.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description}
                </TableCell>
                <TableCell>
                  {transaction.evento_id && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {transaction.evento_id}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.banda_id && (
                    <Badge variant="outline" className="gap-1">
                      <Music className="h-3 w-3" />
                      {transaction.banda_id}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.counterparty}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.gross_amount)}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Check className="h-4 w-4" />
                        Marcar como pago
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, transactions.length)} de {transactions.length} transações
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNumber > totalPages) return null;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};