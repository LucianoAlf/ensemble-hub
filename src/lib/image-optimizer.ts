/**
 * Sistema de otimização de imagens para diferentes densidades
 * Implementa lazy loading, responsive images e otimização de performance
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Tipos para configuração de imagens
export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export interface ResponsiveImageSet {
  src: string;
  srcSet?: string;
  sizes?: string;
}

// Utilitários para geração de srcSet
export const generateSrcSet = (baseSrc: string, widths: number[]): string => {
  return widths
    .map(width => {
      // Para imagens locais, assumimos que temos versões otimizadas
      const optimizedSrc = baseSrc.replace(/\.(jpg|jpeg|png|webp)$/i, `_${width}w.$1`);
      return `${optimizedSrc} ${width}w`;
    })
    .join(', ');
};

// Breakpoints padrão para responsive images
export const DEFAULT_BREAKPOINTS = [320, 640, 768, 1024, 1280, 1536];

// Sizes padrão para diferentes layouts
export const COMMON_SIZES = {
  full: '100vw',
  half: '(min-width: 768px) 50vw, 100vw',
  third: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  quarter: '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  hero: '(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, 100vw',
  thumbnail: '(min-width: 768px) 200px, 150px',
  avatar: '(min-width: 768px) 64px, 48px',
};

// Hook para lazy loading de imagens
export const useImageLazyLoad = (src: string, options: { threshold?: number; rootMargin?: string } = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const { threshold = 0.1, rootMargin = '50px' } = options;

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setError(null);
    };
    
    img.onerror = () => {
      setError('Falha ao carregar imagem');
      setIsLoaded(false);
    };

    img.src = src;
  }, [src, isInView]);

  return { isLoaded, isInView, error, imgRef };
};

// Hook para detecção de densidade de tela
export const useScreenDensity = () => {
  const [density, setDensity] = useState(1);

  useEffect(() => {
    const updateDensity = () => {
      setDensity(window.devicePixelRatio || 1);
    };

    updateDensity();
    
    // Escutar mudanças na densidade (raro, mas pode acontecer)
    const mediaQuery = window.matchMedia('(resolution: 2dppx)');
    mediaQuery.addEventListener('change', updateDensity);

    return () => {
      mediaQuery.removeEventListener('change', updateDensity);
    };
  }, []);

  return density;
};

// Utilitário para otimizar qualidade baseada na densidade
export const getOptimalQuality = (density: number, baseQuality: number = 75): number => {
  // Reduzir qualidade em telas de alta densidade para compensar o aumento de pixels
  if (density >= 3) return Math.max(baseQuality - 20, 50);
  if (density >= 2) return Math.max(baseQuality - 10, 60);
  return baseQuality;
};

// Utilitário para gerar placeholder blur
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Criar um gradiente simples como placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Utilitário para detectar formato de imagem suportado
export const getSupportedImageFormat = (): 'webp' | 'avif' | 'jpg' => {
  // Verificar suporte a AVIF
  const avifCanvas = document.createElement('canvas');
  avifCanvas.width = 1;
  avifCanvas.height = 1;
  
  try {
    const avifSupported = avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    if (avifSupported) return 'avif';
  } catch (e) {
    // AVIF não suportado
  }

  // Verificar suporte a WebP
  const webpCanvas = document.createElement('canvas');
  webpCanvas.width = 1;
  webpCanvas.height = 1;
  
  try {
    const webpSupported = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    if (webpSupported) return 'webp';
  } catch (e) {
    // WebP não suportado
  }

  return 'jpg';
};

// Hook para preload de imagens críticas
export const useImagePreload = (sources: string[], priority: boolean = false) => {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!priority && !('requestIdleCallback' in window)) return;

    const preloadImage = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set([...prev, src]));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    };

    const preloadAll = async () => {
      try {
        await Promise.all(sources.map(preloadImage));
      } catch (error) {
        console.warn('Falha no preload de algumas imagens:', error);
      }
    };

    if (priority) {
      preloadAll();
    } else {
      // Usar requestIdleCallback para preload não crítico
      const idleCallback = (window as any).requestIdleCallback || setTimeout;
      idleCallback(preloadAll);
    }
  }, [sources, priority]);

  return preloadedImages;
};

// Utilitário para calcular dimensões responsivas
export const calculateResponsiveDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = Math.min(originalWidth, maxWidth);
  let height = width / aspectRatio;
  
  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};

// Cache para imagens processadas
const imageCache = new Map<string, HTMLImageElement>();

export const getCachedImage = (src: string): HTMLImageElement | null => {
  return imageCache.get(src) || null;
};

export const setCachedImage = (src: string, img: HTMLImageElement): void => {
  // Limitar cache para evitar vazamentos de memória
  if (imageCache.size > 100) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }
  imageCache.set(src, img);
};

// Limpeza do cache
export const clearImageCache = (): void => {
  imageCache.clear();
};
