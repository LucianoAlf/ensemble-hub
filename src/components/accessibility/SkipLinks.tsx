/**
 * Skip Links para navegação por teclado
 * Permite que usuários de screen readers pulem para conteúdo principal
 */

import React from 'react';

interface SkipLink {
  href: string;
  label: string;
}

const skipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Pular para conteúdo principal' },
  { href: '#main-navigation', label: 'Pular para navegação principal' },
  { href: '#sidebar', label: 'Pular para barra lateral' },
  { href: '#footer', label: 'Pular para rodapé' }
];

export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links" role="navigation" aria-label="Links de navegação rápida">
      {skipLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              // Tornar o elemento focável temporariamente
              const originalTabIndex = target.getAttribute('tabindex');
              target.setAttribute('tabindex', '-1');
              
              // Focar no elemento
              (target as HTMLElement).focus();
              
              // Restaurar tabindex original após um tempo
              setTimeout(() => {
                if (originalTabIndex !== null) {
                  target.setAttribute('tabindex', originalTabIndex);
                } else {
                  target.removeAttribute('tabindex');
                }
              }, 100);
              
              // Scroll suave para o elemento
              target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

/**
 * Hook para gerenciar skip links dinamicamente
 */
export const useSkipLinks = () => {
  const addSkipTarget = (id: string, label: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Adicionar atributos de acessibilidade
      element.setAttribute('role', 'main');
      element.setAttribute('aria-label', label);
      
      // Garantir que seja focável
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
    }
  };

  const removeSkipTarget = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.removeAttribute('role');
      element.removeAttribute('aria-label');
      element.removeAttribute('tabindex');
    }
  };

  return { addSkipTarget, removeSkipTarget };
};

export default SkipLinks;
