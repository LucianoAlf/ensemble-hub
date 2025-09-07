-- Migração: Adicionar campo categoria na tabela banda
-- Data: 07/09/2025
-- Descrição: Adiciona campo categoria para classificar bandas em Kids, Teen, Adulto

-- Adicionar coluna categoria
ALTER TABLE public.banda ADD COLUMN categoria TEXT;

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.banda ADD CONSTRAINT banda_categoria_check 
  CHECK (categoria IN ('kids', 'teen', 'adulto'));

-- Comentário para documentação
COMMENT ON COLUMN public.banda.categoria IS 'Categoria da banda: kids, teen ou adulto';
