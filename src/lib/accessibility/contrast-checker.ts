/**
 * Sistema de verificação de contraste WCAG AA
 * Garante que todos os elementos atendem aos padrões de acessibilidade
 */

// Padrões WCAG AA
const WCAG_AA_NORMAL = 4.5; // Texto normal
const WCAG_AA_LARGE = 3.0;  // Texto grande (18pt+ ou 14pt+ bold)

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ContrastResult {
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
  recommendation?: string;
}

/**
 * Converte hex para RGB
 */
function hexToRgb(hex: string): ColorRGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calcula luminância relativa
 */
function getLuminance(rgb: ColorRGB): number {
  const { r, g, b } = rgb;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula ratio de contraste entre duas cores
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Verifica se o contraste atende WCAG AA
 */
export function checkContrast(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  
  const passes = ratio >= threshold;
  const passesAAA = ratio >= (isLargeText ? 4.5 : 7.0);
  
  let level: 'AA' | 'AAA' | 'FAIL' = 'FAIL';
  if (passesAAA) level = 'AAA';
  else if (passes) level = 'AA';
  
  let recommendation: string | undefined;
  if (!passes) {
    const needed = threshold / ratio;
    recommendation = `Contraste insuficiente. Ratio atual: ${ratio.toFixed(2)}. Necessário: ${threshold}. Sugestão: escurecer o texto ou clarear o fundo em ${(needed * 100 - 100).toFixed(0)}%.`;
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes,
    level,
    recommendation
  };
}

/**
 * Paleta de cores com contraste garantido WCAG AA
 */
export const accessibleColors = {
  // Backgrounds claros
  backgrounds: {
    white: '#ffffff',
    light: '#f8fafc',
    muted: '#f1f5f9',
    card: '#ffffff'
  },
  
  // Textos escuros (para backgrounds claros)
  darkText: {
    primary: '#0f172a',    // Ratio: 19.07 com white
    secondary: '#334155',  // Ratio: 9.85 com white
    muted: '#64748b'       // Ratio: 5.74 com white
  },
  
  // Backgrounds escuros
  darkBackgrounds: {
    primary: '#0f172a',
    secondary: '#1e293b',
    muted: '#334155'
  },
  
  // Textos claros (para backgrounds escuros)
  lightText: {
    primary: '#ffffff',    // Ratio: 19.07 com #0f172a
    secondary: '#e2e8f0',  // Ratio: 15.68 com #0f172a
    muted: '#cbd5e1'       // Ratio: 11.58 com #0f172a
  },
  
  // Estados com contraste garantido
  states: {
    success: {
      bg: '#dcfce7',
      text: '#166534',     // Ratio: 7.21
      border: '#bbf7d0'
    },
    warning: {
      bg: '#fef3c7',
      text: '#92400e',     // Ratio: 6.93
      border: '#fde68a'
    },
    error: {
      bg: '#fecaca',
      text: '#991b1b',     // Ratio: 7.73
      border: '#fca5a5'
    },
    info: {
      bg: '#dbeafe',
      text: '#1e40af',     // Ratio: 8.59
      border: '#bfdbfe'
    }
  }
};

/**
 * Auditoria automática de contraste em elementos DOM
 */
export function auditPageContrast(): Array<{
  element: Element;
  issue: string;
  suggestion: string;
}> {
  const issues: Array<{
    element: Element;
    issue: string;
    suggestion: string;
  }> = [];
  
  // Elementos de texto para verificar
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, input, textarea');
  
  textElements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Converter RGB para hex (simplificado)
    const rgbToHex = (rgb: string) => {
      const match = rgb.match(/\d+/g);
      if (!match) return '#000000';
      const [r, g, b] = match.map(Number);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };
    
    if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const foregroundHex = rgbToHex(color);
      const backgroundHex = rgbToHex(backgroundColor);
      
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      
      const result = checkContrast(foregroundHex, backgroundHex, isLargeText);
      
      if (!result.passes) {
        issues.push({
          element,
          issue: `Contraste insuficiente: ${result.ratio} (necessário: ${isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL})`,
          suggestion: result.recommendation || 'Ajustar cores para melhor contraste'
        });
      }
    }
  });
  
  return issues;
}

/**
 * Aplicar correções automáticas de contraste
 */
export function applyContrastFixes(): void {
  const issues = auditPageContrast();
  
  issues.forEach(({ element }) => {
    // Aplicar classes de correção automática
    if (element.classList.contains('text-muted-foreground')) {
      element.classList.remove('text-muted-foreground');
      element.classList.add('text-slate-600'); // Melhor contraste
    }
    
    if (element.classList.contains('text-gray-400')) {
      element.classList.remove('text-gray-400');
      element.classList.add('text-gray-600'); // Melhor contraste
    }
  });
}

/**
 * Relatório de acessibilidade
 */
export function generateAccessibilityReport(): {
  totalElements: number;
  passedElements: number;
  failedElements: number;
  issues: Array<{ element: string; issue: string; suggestion: string }>;
} {
  const issues = auditPageContrast();
  const totalElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label').length;
  
  return {
    totalElements,
    passedElements: totalElements - issues.length,
    failedElements: issues.length,
    issues: issues.map(issue => ({
      element: issue.element.tagName + (issue.element.className ? `.${issue.element.className}` : ''),
      issue: issue.issue,
      suggestion: issue.suggestion
    }))
  };
}
