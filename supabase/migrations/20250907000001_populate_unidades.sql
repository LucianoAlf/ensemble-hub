-- Migração: Popular tabela unidade com as 3 unidades
-- Data: 07/09/2025
-- Descrição: Insere as unidades Campo Grande, Recreio e Barra

-- Inserir as 3 unidades principais
INSERT INTO public.unidade (nome) VALUES 
  ('Campo Grande'),
  ('Recreio'),
  ('Barra')
ON CONFLICT (nome) DO NOTHING;

-- Comentário para documentação
COMMENT ON TABLE public.unidade IS 'Unidades da escola de música: Campo Grande, Recreio, Barra';
