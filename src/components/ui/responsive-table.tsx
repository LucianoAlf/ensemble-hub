/**
 * Componente de tabela responsiva com scroll horizontal
 * Garante que tabelas funcionem bem em dispositivos móveis
 */

import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollIndicators?: boolean;
  minWidth?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className,
  showScrollIndicators = true,
  minWidth = '600px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, []);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Scroll Indicators */}
      {showScrollIndicators && (
        <>
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-md hover:bg-background transition-colors"
              aria-label="Rolar tabela para a esquerda"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-md hover:bg-background transition-colors"
              aria-label="Rolar tabela para a direita"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}

      {/* Table Container */}
      <div
        ref={containerRef}
        className={cn(
          "table-responsive overflow-x-auto -webkit-overflow-scrolling-touch",
          className
        )}
        role="region"
        aria-label="Tabela com scroll horizontal"
        tabIndex={0}
      >
        <div style={{ minWidth }}>
          {children}
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="md:hidden text-xs text-muted-foreground mt-2 text-center">
        ← Deslize horizontalmente para ver mais colunas →
      </div>
    </div>
  );
};

/**
 * Hook para tornar tabelas existentes responsivas
 */
export const useResponsiveTable = () => {
  const makeTableResponsive = (tableElement: HTMLTableElement) => {
    // Adicionar wrapper responsivo se não existir
    if (!tableElement.closest('.table-responsive')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive overflow-x-auto';
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', 'Tabela com scroll horizontal');
      wrapper.setAttribute('tabindex', '0');
      
      tableElement.parentNode?.insertBefore(wrapper, tableElement);
      wrapper.appendChild(tableElement);
    }

    // Adicionar classes responsivas
    tableElement.classList.add('w-full');
    tableElement.style.minWidth = '600px';

    // Melhorar acessibilidade
    if (!tableElement.getAttribute('role')) {
      tableElement.setAttribute('role', 'table');
    }

    // Adicionar cabeçalhos sticky em mobile
    const headers = tableElement.querySelectorAll('th');
    headers.forEach(header => {
      header.classList.add('sticky', 'top-0', 'bg-background', 'z-10');
    });
  };

  const addMobileLayout = (tableElement: HTMLTableElement) => {
    // Criar layout de cards para mobile como fallback
    const mobileContainer = document.createElement('div');
    mobileContainer.className = 'md:hidden space-y-4';
    
    const rows = Array.from(tableElement.querySelectorAll('tbody tr'));
    const headers = Array.from(tableElement.querySelectorAll('thead th')).map(th => th.textContent || '');
    
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const card = document.createElement('div');
      card.className = 'border rounded-lg p-4 space-y-2';
      
      cells.forEach((cell, index) => {
        if (headers[index] && cell.textContent?.trim()) {
          const item = document.createElement('div');
          item.className = 'flex justify-between items-center';
          item.innerHTML = `
            <span class="font-medium text-sm text-muted-foreground">${headers[index]}:</span>
            <span class="text-sm">${cell.innerHTML}</span>
          `;
          card.appendChild(item);
        }
      });
      
      mobileContainer.appendChild(card);
    });
    
    // Inserir layout mobile após a tabela
    tableElement.parentNode?.insertBefore(mobileContainer, tableElement.nextSibling);
    
    // Esconder tabela em mobile
    tableElement.classList.add('hidden', 'md:table');
  };

  return { makeTableResponsive, addMobileLayout };
};

export default ResponsiveTable;
