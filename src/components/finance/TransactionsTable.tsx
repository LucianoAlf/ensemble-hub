import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Check, Trash2, Music, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  description: string;
  event?: string;
  band?: string;
  counterparty?: string;
  amount: number;
  status: 'pending' | 'scheduled' | 'settled';
}

export const TransactionsTable = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // TODO: Load real data from database
  const transactions: Transaction[] = [
    {
      id: "1",
      date: new Date(),
      type: "income",
      category: "Ingressos",
      description: "Venda de ingressos - Show do Rock",
      event: "Show do Rock",
      band: "Banda XYZ",
      counterparty: "Eventbrite",
      amount: 5000.00,
      status: "settled"
    },
    {
      id: "2",
      date: new Date(),
      type: "expense", 
      category: "Transporte",
      description: "Combustível para o show",
      event: "Show do Rock",
      band: "Banda XYZ",
      counterparty: "Posto Shell",
      amount: 300.00,
      status: "pending"
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "outline" as const, label: "Pendente" },
      scheduled: { variant: "secondary" as const, label: "Agendado" },
      settled: { variant: "default" as const, label: "Pago/Recebido" }
    };
    
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(transactions.map(t => t.id));
    } else {
      setSelectedRows([]);
    }
  };

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
                  checked={selectedRows.length === transactions.length}
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
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(transaction.id)}
                    onCheckedChange={(checked) => handleSelectRow(transaction.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {format(transaction.date, "dd/MM/yyyy", { locale: ptBR })}
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
                  {transaction.event && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {transaction.event}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.band && (
                    <Badge variant="outline" className="gap-1">
                      <Music className="h-3 w-3" />
                      {transaction.band}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.counterparty}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {transactions.length} de {transactions.length} resultado(s)
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
};