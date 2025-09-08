/**
 * Tabela de transações com paginação virtual otimizada
 * Substitui a implementação anterior com melhor performance
 */

import { useState, useCallback, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { VirtualPagination } from "@/components/ui/virtual-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Check, Trash2, Music, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'scheduled' | 'settled';
  date: string;
  category?: string;
  event_name?: string;
  created_at?: string;
  evento_id?: string;
  banda_id?: string;
  counterparty?: string;
  gross_amount?: number;
}

interface TransactionsTableVirtualProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  loading?: boolean;
}

export const TransactionsTableVirtual = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  loading = false 
}: TransactionsTableVirtualProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Memoizar formatador de moeda
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
  }), []);

  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage, pageSize]);

  // Handlers de seleção
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedTransactions(paginatedData.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  }, [paginatedData]);

  const handleSelectTransaction = useCallback((transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  }, []);

  // Handlers de paginação
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedTransactions([]); // Limpar seleção ao mudar página
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedTransactions([]);
  }, []);

  // Estados derivados
  const allSelected = paginatedData.length > 0 && selectedTransactions.length === paginatedData.length;
  const someSelected = selectedTransactions.length > 0 && selectedTransactions.length < paginatedData.length;

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Nenhuma transação encontrada</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ações em lote */}
      {selectedTransactions.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedTransactions.length} transação(ões) selecionada(s)
          </span>
          <Button size="sm" variant="outline">
            <Check className="h-4 w-4 mr-1" />
            Marcar como Pago
          </Button>
          <Button size="sm" variant="outline">
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir Selecionadas
          </Button>
        </div>
      )}

      {/* Tabela */}
      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todas as transações"
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                />
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-12">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTransactions.includes(transaction.id)}
                    onCheckedChange={(checked) => 
                      handleSelectTransaction(transaction.id, checked as boolean)
                    }
                    aria-label={`Selecionar transação ${transaction.description}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{transaction.description}</span>
                    {transaction.event_name && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {transaction.event_name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[transaction.status].variant}>
                    {statusVariants[transaction.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {transaction.category && (
                    <div className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      <span className="text-xs">{transaction.category}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(transaction.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTable>

      {/* Paginação Virtual */}
      <VirtualPagination
        pageSize={pageSize}
        totalItems={transactions.length}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
        showPageSizeSelector={true}
        showJumpToPage={true}
        className="mt-4"
      />
    </div>
  );
};

export default TransactionsTableVirtual;
