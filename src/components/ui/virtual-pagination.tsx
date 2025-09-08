/**
 * Componente de paginação virtual para grandes datasets
 * Otimiza performance carregando apenas dados visíveis
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';

export interface VirtualPaginationConfig {
  pageSize: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  maxVisiblePages?: number;
  pageSizeOptions?: number[];
}

interface VirtualPaginationProps extends VirtualPaginationConfig {
  className?: string;
  compact?: boolean;
}

export function VirtualPagination({
  pageSize,
  totalItems,
  currentPage,
  onPageChange,
  onPageSizeChange,
  loading = false,
  showPageSizeSelector = true,
  showJumpToPage = true,
  maxVisiblePages = 7,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
  compact = false
}: VirtualPaginationProps) {
  const [jumpToPageValue, setJumpToPageValue] = useState('');

  // Calcular métricas de paginação
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Gerar array de páginas visíveis
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Ajustar se estamos no final
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    
    // Primeira página
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis');
      }
    }

    // Páginas do meio
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Última página
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      logger.debug('Mudança de página', {
        context: 'virtual_pagination',
        from: currentPage,
        to: page,
        totalPages,
        pageSize
      });
      onPageChange(page);
    }
  }, [currentPage, totalPages, pageSize, loading, onPageChange]);

  const handlePageSizeChange = useCallback((newPageSize: string) => {
    const size = parseInt(newPageSize, 10);
    if (onPageSizeChange && size !== pageSize) {
      logger.debug('Mudança de tamanho de página', {
        context: 'virtual_pagination',
        from: pageSize,
        to: size,
        currentPage
      });
      onPageSizeChange(size);
    }
  }, [pageSize, currentPage, onPageSizeChange]);

  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpToPageValue, 10);
    if (!isNaN(page)) {
      handlePageChange(page);
      setJumpToPageValue('');
    }
  }, [jumpToPageValue, handlePageChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  }, [handleJumpToPage]);

  // Não renderizar se não há dados
  if (totalItems === 0) {
    return null;
  }

  // Versão compacta para mobile
  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-2 ${className}`}>
        <div className="text-sm text-muted-foreground">
          {startItem}-{endItem} de {totalItems}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage || loading}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage || loading}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {/* Informações e seletor de tamanho */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando {startItem} a {endItem} de {totalItems} itens
        </span>
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Itens por página:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Controles de navegação */}
      <div className="flex items-center gap-2">
        {/* Jump to page */}
        {showJumpToPage && totalPages > 10 && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">Ir para:</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpToPageValue}
              onChange={(e) => setJumpToPageValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-16 h-8"
              placeholder="Pág"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleJumpToPage}
              disabled={loading}
            >
              Ir
            </Button>
          </div>
        )}

        {/* Navegação por páginas */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage || loading}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>

          {/* Páginas numeradas */}
          <div className="flex items-center gap-1">
            {visiblePages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <div key={`ellipsis-${index}`} className="px-2">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                  aria-label={`Página ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {loading && currentPage === page ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    page
                  )}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage || loading}
            aria-label="Próxima página"
          >
            <span className="hidden sm:inline mr-1">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para gerenciar estado de paginação virtual
 */
export function useVirtualPagination(initialPageSize = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    // Ajustar página atual se necessário
    setCurrentPage(1);
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setLoading(false);
  }, []);

  const getOffset = useCallback(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const getLimit = useCallback(() => {
    return pageSize;
  }, [pageSize]);

  return {
    currentPage,
    pageSize,
    loading,
    setLoading,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
    getOffset,
    getLimit
  };
}

/**
 * Hook para paginação com dados do Supabase
 */
export function useSupabasePagination<T>(
  queryFn: (offset: number, limit: number) => Promise<{ data: T[] | null; count: number | null; error: any }>,
  initialPageSize = 25
) {
  const pagination = useVirtualPagination(initialPageSize);
  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    pagination.setLoading(true);
    setError(null);

    try {
      const offset = pagination.getOffset();
      const limit = pagination.getLimit();
      
      logger.debug('Carregando dados paginados', {
        context: 'supabase_pagination',
        offset,
        limit,
        currentPage: pagination.currentPage
      });

      const result = await queryFn(offset, limit);
      
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao carregar dados');
      }

      setData(result.data || []);
      setTotalItems(result.count || 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      logger.error('Erro ao carregar dados paginados', {
        context: 'supabase_pagination'
      }, error);
    } finally {
      pagination.setLoading(false);
    }
  }, [queryFn, pagination]);

  // Carregar dados quando página ou tamanho mudar
  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    ...pagination,
    data,
    totalItems,
    error,
    refresh
  };
}

export default VirtualPagination;
