/**
 * Componente de imagem otimizada com lazy loading e suporte responsivo
 * Implementa as melhores práticas de performance para imagens
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  useImageLazyLoad,
  useScreenDensity,
  getOptimalQuality,
  generateBlurDataURL,
  COMMON_SIZES,
  generateSrcSet,
  DEFAULT_BREAKPOINTS,
  type ImageConfig
} from '@/lib/image-optimizer';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'onError' | 'onLoad'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: keyof typeof COMMON_SIZES | string;
  responsive?: boolean;
  breakpoints?: number[];
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes = 'full',
  responsive = true,
  breakpoints = DEFAULT_BREAKPOINTS,
  className,
  fallbackSrc,
  onLoad,
  onError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(priority ? src : '');
  const [hasError, setHasError] = useState(false);
  
  const density = useScreenDensity();
  const optimalQuality = getOptimalQuality(density, quality);
  
  const { isLoaded, isInView, error, imgRef } = useImageLazyLoad(src, {
    threshold: 0.1,
    rootMargin: priority ? '0px' : '50px'
  });

  // Gerar srcSet para imagens responsivas
  const srcSet = responsive ? generateSrcSet(src, breakpoints) : undefined;
  
  // Determinar sizes
  const imageSizes = typeof sizes === 'string' && sizes in COMMON_SIZES 
    ? COMMON_SIZES[sizes as keyof typeof COMMON_SIZES]
    : sizes;

  // Gerar blur placeholder se não fornecido
  const placeholderDataURL = blurDataURL || (
    placeholder === 'blur' && width && height 
      ? generateBlurDataURL(Math.min(width, 40), Math.min(height, 40))
      : undefined
  );

  useEffect(() => {
    if (priority) {
      setCurrentSrc(src);
    } else if (isInView && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [src, priority, isInView, currentSrc]);

  useEffect(() => {
    if (error) {
      setHasError(true);
      onError?.(error);
      
      // Tentar fallback se disponível
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
      }
    }
  }, [error, fallbackSrc, currentSrc, onError]);

  useEffect(() => {
    if (isLoaded) {
      onLoad?.();
    }
  }, [isLoaded, onLoad]);

  const handleImageLoad = () => {
    setHasError(false);
  };

  const handleImageError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  // Renderizar placeholder enquanto carrega
  if (!currentSrc || (!isLoaded && !hasError)) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'bg-gray-200 animate-pulse flex items-center justify-center',
          className
        )}
        style={{ 
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          backgroundImage: placeholderDataURL ? `url(${placeholderDataURL})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        {...props}
      >
        {placeholder === 'empty' && (
          <div className="text-gray-400 text-sm">
            Carregando...
          </div>
        )}
      </div>
    );
  }

  // Renderizar erro se falhou
  if (hasError && !fallbackSrc) {
    return (
      <div
        className={cn(
          'bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500',
          className
        )}
        style={{ 
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
        {...props}
      >
        <div className="text-center p-4">
          <div className="text-sm">Falha ao carregar</div>
          <div className="text-xs text-gray-400 mt-1">{alt}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      srcSet={srcSet}
      sizes={imageSizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleImageLoad}
      onError={handleImageError}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      {...props}
    />
  );
};

// Componente específico para avatares
export const OptimizedAvatar: React.FC<Omit<OptimizedImageProps, 'sizes' | 'responsive'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ size = 'md', className, ...props }) => {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  const dimensions = sizeMap[size];

  return (
    <OptimizedImage
      {...props}
      {...dimensions}
      sizes="avatar"
      responsive={false}
      className={cn('rounded-full object-cover', className)}
    />
  );
};

// Componente específico para thumbnails
export const OptimizedThumbnail: React.FC<Omit<OptimizedImageProps, 'sizes'>> = ({
  className,
  ...props
}) => {
  return (
    <OptimizedImage
      {...props}
      sizes="thumbnail"
      className={cn('object-cover rounded-lg', className)}
    />
  );
};

// Componente específico para hero images
export const OptimizedHero: React.FC<Omit<OptimizedImageProps, 'sizes'>> = ({
  className,
  priority = true,
  ...props
}) => {
  return (
    <OptimizedImage
      {...props}
      sizes="hero"
      priority={priority}
      className={cn('w-full object-cover', className)}
    />
  );
};
