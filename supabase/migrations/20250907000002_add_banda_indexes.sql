-- Migração: Adicionar índices de performance para banda
-- Data: 07/09/2025
-- Descrição: Cria índices para otimizar consultas por unidade e categoria

-- Índice composto para consultas por unidade e categoria
CREATE INDEX IF NOT EXISTS idx_banda_unidade_categoria ON public.banda(unidade_id, categoria);

-- Índice para consultas por categoria
CREATE INDEX IF NOT EXISTS idx_banda_categoria ON public.banda(categoria);

-- Índice para consultas por unidade
CREATE INDEX IF NOT EXISTS idx_banda_unidade ON public.banda(unidade_id);

-- Comentários para documentação
COMMENT ON INDEX idx_banda_unidade_categoria IS 'Índice composto para consultas por unidade e categoria';
COMMENT ON INDEX idx_banda_categoria IS 'Índice para filtros por categoria';
COMMENT ON INDEX idx_banda_unidade IS 'Índice para filtros por unidade';
