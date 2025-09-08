/**
 * Sistema de validação rigorosa para uploads de arquivos
 * Previne uploads maliciosos e garante conformidade com políticas de segurança
 */

import { logger } from './logger';

export interface FileValidationConfig {
  maxSize: number; // em bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  maxFiles?: number;
  requireSignature?: boolean;
  scanForMalware?: boolean;
  customValidators?: Array<(file: File) => Promise<ValidationResult>>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface FileValidationResult {
  valid: boolean;
  file: File;
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
  sanitizedName: string;
}

/**
 * Configurações pré-definidas para diferentes tipos de upload
 */
export const UPLOAD_CONFIGS = {
  // Imagens de perfil
  profileImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    requireSignature: true
  },

  // Documentos financeiros
  financialDocument: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    requireSignature: true,
    scanForMalware: true
  },

  // Arquivos de áudio
  audioFile: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    requireSignature: true
  },

  // Arquivos gerais
  general: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt', '.csv', '.xlsx'],
    requireSignature: true
  }
} as const;

/**
 * Assinaturas de arquivo para validação de tipo real
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]],
  'audio/wav': [[0x52, 0x49, 0x46, 0x46]],
  'text/plain': [], // Texto pode ter qualquer conteúdo
  'text/csv': []
};

/**
 * Lista de extensões perigosas que devem ser sempre bloqueadas
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.dll', '.so', '.dylib',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1'
];

/**
 * Sanitiza nome do arquivo removendo caracteres perigosos
 */
function sanitizeFileName(fileName: string): string {
  // Remover caracteres especiais e manter apenas alfanuméricos, pontos, hífens e underscores
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Garantir que não seja muito longo
  const maxLength = 100;
  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, maxLength - ext.length);
    return name + ext;
  }
  
  return sanitized;
}

/**
 * Verifica assinatura do arquivo
 */
async function validateFileSignature(file: File, expectedType: string): Promise<boolean> {
  const signatures = FILE_SIGNATURES[expectedType];
  if (!signatures || signatures.length === 0) {
    return true; // Sem assinatura definida, aceitar
  }

  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    return signatures.some(signature => {
      return signature.every((byte, index) => bytes[index] === byte);
    });
  } catch (error) {
    logger.error('Erro ao validar assinatura do arquivo', {
      context: 'upload_validator',
      fileName: file.name,
      expectedType
    }, error);
    return false;
  }
}

/**
 * Detecta possível conteúdo malicioso básico
 */
async function scanForBasicMalware(file: File): Promise<ValidationResult> {
  try {
    // Para arquivos de texto, verificar conteúdo suspeito
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      const text = await file.text();
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.write/i,
        /innerHTML/i
      ];
      
      const foundPatterns = suspiciousPatterns.filter(pattern => pattern.test(text));
      if (foundPatterns.length > 0) {
        return {
          valid: false,
          error: 'Conteúdo suspeito detectado no arquivo'
        };
      }
    }

    // Para imagens, verificar metadados suspeitos
    if (file.type.startsWith('image/')) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      
      if (text.includes('<script') || text.includes('javascript:')) {
        return {
          valid: false,
          error: 'Código suspeito encontrado nos metadados da imagem'
        };
      }
    }

    return { valid: true };
  } catch (error) {
    logger.warn('Erro durante scan básico de malware', {
      context: 'upload_validator',
      fileName: file.name
    }, error);
    return { valid: true, warnings: ['Não foi possível verificar conteúdo malicioso'] };
  }
}

/**
 * Valida um único arquivo
 */
export async function validateFile(
  file: File,
  config: FileValidationConfig
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, any> = {
    originalName: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };

  // Sanitizar nome do arquivo
  const sanitizedName = sanitizeFileName(file.name);
  
  // 1. Validar tamanho
  if (file.size > config.maxSize) {
    errors.push(`Arquivo muito grande. Máximo permitido: ${(config.maxSize / 1024 / 1024).toFixed(1)}MB`);
  }

  if (file.size === 0) {
    errors.push('Arquivo está vazio');
  }

  // 2. Validar extensão
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    errors.push(`Tipo de arquivo não permitido: ${extension}`);
  }

  if (!config.allowedExtensions.includes(extension)) {
    errors.push(`Extensão não permitida. Permitidas: ${config.allowedExtensions.join(', ')}`);
  }

  // 3. Validar tipo MIME
  if (!config.allowedTypes.includes(file.type)) {
    errors.push(`Tipo de arquivo não permitido: ${file.type}`);
  }

  // 4. Validar assinatura do arquivo
  if (config.requireSignature) {
    const signatureValid = await validateFileSignature(file, file.type);
    if (!signatureValid) {
      errors.push('Assinatura do arquivo não corresponde ao tipo declarado');
    }
  }

  // 5. Scan básico de malware
  if (config.scanForMalware) {
    const malwareScan = await scanForBasicMalware(file);
    if (!malwareScan.valid) {
      errors.push(malwareScan.error || 'Conteúdo suspeito detectado');
    }
    if (malwareScan.warnings) {
      warnings.push(...malwareScan.warnings);
    }
  }

  // 6. Validadores customizados
  if (config.customValidators) {
    for (const validator of config.customValidators) {
      try {
        const result = await validator(file);
        if (!result.valid) {
          errors.push(result.error || 'Validação customizada falhou');
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
        if (result.metadata) {
          Object.assign(metadata, result.metadata);
        }
      } catch (error) {
        logger.error('Erro em validador customizado', {
          context: 'upload_validator',
          fileName: file.name
        }, error);
        warnings.push('Erro durante validação customizada');
      }
    }
  }

  const isValid = errors.length === 0;
  
  logger.info('Validação de arquivo concluída', {
    context: 'upload_validator',
    fileName: file.name,
    sanitizedName,
    valid: isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    fileSize: file.size,
    fileType: file.type
  });

  return {
    valid: isValid,
    file,
    errors,
    warnings,
    metadata,
    sanitizedName
  };
}

/**
 * Valida múltiplos arquivos
 */
export async function validateFiles(
  files: FileList | File[],
  config: FileValidationConfig
): Promise<FileValidationResult[]> {
  const fileArray = Array.from(files);
  
  // Validar número de arquivos
  if (config.maxFiles && fileArray.length > config.maxFiles) {
    throw new Error(`Muitos arquivos selecionados. Máximo permitido: ${config.maxFiles}`);
  }

  // Validar cada arquivo
  const results = await Promise.all(
    fileArray.map(file => validateFile(file, config))
  );

  // Log resumo
  const validFiles = results.filter(r => r.valid).length;
  const totalSize = results.reduce((sum, r) => sum + r.file.size, 0);
  
  logger.info('Validação de múltiplos arquivos concluída', {
    context: 'upload_validator',
    totalFiles: results.length,
    validFiles,
    invalidFiles: results.length - validFiles,
    totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
  });

  return results;
}

/**
 * Hook React para validação de uploads
 */
export function useFileValidator(configName: keyof typeof UPLOAD_CONFIGS) {
  const config = UPLOAD_CONFIGS[configName];
  
  const validateSingleFile = async (file: File) => {
    return validateFile(file, config);
  };
  
  const validateMultipleFiles = async (files: FileList | File[]) => {
    return validateFiles(files, config);
  };
  
  const getConfig = () => config;
  
  return {
    validateSingleFile,
    validateMultipleFiles,
    getConfig
  };
}

/**
 * Componente de validação para drag & drop
 */
export class UploadValidator {
  private config: FileValidationConfig;
  
  constructor(config: FileValidationConfig) {
    this.config = config;
  }
  
  async validate(files: FileList | File[]): Promise<FileValidationResult[]> {
    return validateFiles(files, this.config);
  }
  
  isValidType(file: File): boolean {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return this.config.allowedExtensions.includes(extension) &&
           this.config.allowedTypes.includes(file.type) &&
           !DANGEROUS_EXTENSIONS.includes(extension);
  }
  
  isValidSize(file: File): boolean {
    return file.size > 0 && file.size <= this.config.maxSize;
  }
  
  getMaxSizeMB(): number {
    return this.config.maxSize / 1024 / 1024;
  }
  
  getAllowedTypes(): string[] {
    return [...this.config.allowedTypes];
  }
  
  getAllowedExtensions(): string[] {
    return [...this.config.allowedExtensions];
  }
}

export default validateFile;
