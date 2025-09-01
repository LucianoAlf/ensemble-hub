import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Agora';
  if (diffInHours < 24) return `Há ${diffInHours}h`;
  if (diffInHours < 168) return `Há ${Math.floor(diffInHours / 24)}d`;
  
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}