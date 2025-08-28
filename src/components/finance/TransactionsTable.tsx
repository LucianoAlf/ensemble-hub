import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, CheckCircle, Trash2 } from "lucide-react";
import { EditableField } from "./EditableField";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Skeleton } from "@/components/ui/skeleton";



const TransactionsTable = () => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const { transactions, loading, error, updateTransaction, deleteTransaction } = useFinancialData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    } as const;

    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      cancelled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, id]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(rowId => rowId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Financeiras</CardTitle>
          <CardDescription>Carregando transações...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            Erro ao carregar transações: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Movimentações Financeiras</CardTitle>
            <CardDescription>
              Histórico completo de receitas e despesas
            </CardDescription>
          </div>
          {selectedTransactions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedTransactions.length} selecionado(s)
              </span>
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Pago
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedTransactions.includes(transaction.id)}
                    onCheckedChange={(checked) => handleSelectRow(transaction.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell>
                  <EditableField
                    value={transaction.description}
                    type="text"
                    onSave={(newValue) => updateTransaction(transaction.id, { description: newValue })}
                    className="font-medium"
                    label="Descrição da transação"
                  />
                </TableCell>
                <TableCell>
                  <EditableField
                    value={transaction.category}
                    type="text"
                    onSave={(newValue) => updateTransaction(transaction.id, { category: newValue })}
                    label="Categoria"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                  </Badge>
                </TableCell>
                <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  <EditableField
                    value={transaction.amount}
                    type="currency"
                    onSave={(newValue) => updateTransaction(transaction.id, { amount: newValue })}
                    className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}
                    prefix={transaction.type === 'income' ? '+' : '-'}
                    label="Valor da transação"
                  />
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTransaction(transaction.id, { status: 'paid' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar como Pago
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteTransaction(transaction.id)}
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
        {transactions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma transação encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;