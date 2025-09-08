/**
 * Componente de upload de arquivos com validação rigorosa
 * Integra o sistema de validação para uploads seguros
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertTriangle, CheckCircle, FileText, Image, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useFileValidator, UPLOAD_CONFIGS, type FileValidationResult } from '@/lib/upload-validator';
import { logger } from '@/lib/logger';

interface FileUploadProps {
  configName: keyof typeof UPLOAD_CONFIGS;
  onFilesValidated?: (results: FileValidationResult[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  isDragOver: boolean;
  isUploading: boolean;
  progress: number;
  validatedFiles: FileValidationResult[];
  uploadedFiles: string[];
}

export function FileUpload({
  configName,
  onFilesValidated,
  onUploadComplete,
  onUploadError,
  multiple = false,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    progress: 0,
    validatedFiles: [],
    uploadedFiles: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateMultipleFiles, getConfig } = useFileValidator(configName);
  const config = getConfig();

  // Ícone baseado no tipo de arquivo
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Processar arquivos selecionados
  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || files.length === 0) return;

    try {
      logger.info('Iniciando validação de arquivos', {
        context: 'file_upload',
        fileCount: files.length,
        configName
      });

      const results = await validateMultipleFiles(files);
      
      setState(prev => ({
        ...prev,
        validatedFiles: results
      }));

      if (onFilesValidated) {
        onFilesValidated(results);
      }

      // Se todos os arquivos são válidos, iniciar upload automático
      const validFiles = results.filter(r => r.valid);
      if (validFiles.length > 0 && validFiles.length === results.length) {
        await uploadFiles(validFiles);
      }

    } catch (error) {
      logger.error('Erro durante validação de arquivos', {
        context: 'file_upload',
        configName
      }, error);
      
      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error('Erro na validação'));
      }
    }
  }, [disabled, configName, validateMultipleFiles, onFilesValidated]);

  // Simular upload (substituir pela implementação real)
  const uploadFiles = async (validatedFiles: FileValidationResult[]) => {
    setState(prev => ({ ...prev, isUploading: true, progress: 0 }));

    try {
      const uploadPromises = validatedFiles.map(async (result, index) => {
        // Simular progresso de upload
        for (let i = 0; i <= 100; i += 10) {
          setState(prev => ({
            ...prev,
            progress: ((index * 100 + i) / validatedFiles.length)
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Aqui você integraria com Supabase Storage ou outro serviço
        // const { data, error } = await supabase.storage
        //   .from('uploads')
        //   .upload(result.sanitizedName, result.file);
        
        return `https://example.com/uploads/${result.sanitizedName}`;
      });

      const urls = await Promise.all(uploadPromises);
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: urls
      }));

      logger.info('Upload concluído com sucesso', {
        context: 'file_upload',
        fileCount: validatedFiles.length,
        urls
      });

      if (onUploadComplete) {
        onUploadComplete(urls);
      }

    } catch (error) {
      setState(prev => ({ ...prev, isUploading: false, progress: 0 }));
      
      logger.error('Erro durante upload', {
        context: 'file_upload',
        configName
      }, error);

      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error('Erro no upload'));
      }
    }
  };

  // Handlers de drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    if (!disabled && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  // Handler de seleção de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  // Remover arquivo validado
  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      validatedFiles: prev.validatedFiles.filter((_, i) => i !== index)
    }));
  }, []);

  // Tentar upload novamente para arquivos válidos
  const retryUpload = useCallback(() => {
    const validFiles = state.validatedFiles.filter(r => r.valid);
    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  }, [state.validatedFiles]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de drop */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${state.isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {state.isDragOver ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}
          </p>
          <p className="text-sm text-muted-foreground">
            Máximo {(config.maxSize / 1024 / 1024).toFixed(0)}MB por arquivo
          </p>
          <p className="text-xs text-muted-foreground">
            Tipos permitidos: {config.allowedExtensions.join(', ')}
          </p>
        </div>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={config.allowedExtensions.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Progresso de upload */}
      {state.isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Enviando arquivos...</span>
            <span>{Math.round(state.progress)}%</span>
          </div>
          <Progress value={state.progress} />
        </div>
      )}

      {/* Lista de arquivos validados */}
      {state.validatedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Arquivos selecionados:</h4>
          {state.validatedFiles.map((result, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
              `}
            >
              <div className="flex-shrink-0">
                {result.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getFileIcon(result.file.type)}
                  <span className="font-medium truncate">
                    {result.sanitizedName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {(result.file.size / 1024).toFixed(0)}KB
                  </Badge>
                </div>
                
                {result.errors.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {result.errors.map((error, errorIndex) => (
                      <p key={errorIndex} className="text-xs text-red-600">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}
                
                {result.warnings.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {result.warnings.map((warning, warningIndex) => (
                      <p key={warningIndex} className="text-xs text-yellow-600">
                        ⚠ {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={state.isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Ações */}
      {state.validatedFiles.length > 0 && !state.isUploading && (
        <div className="flex gap-2">
          {state.validatedFiles.some(r => r.valid) && (
            <Button onClick={retryUpload}>
              Enviar Arquivos Válidos
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, validatedFiles: [] }))}
          >
            Limpar Lista
          </Button>
        </div>
      )}

      {/* Resumo de upload concluído */}
      {state.uploadedFiles.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {state.uploadedFiles.length} arquivo(s) enviado(s) com sucesso!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default FileUpload;
