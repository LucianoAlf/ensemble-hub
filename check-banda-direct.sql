-- Verificar se a banda teste existe na tabela banda
SELECT 'TABELA BANDA' as fonte, id, nome, ativa, created_at 
FROM banda 
WHERE id = '7caff123-2825-4ee4-ac21-54f1bcb4942f';

-- Verificar se a banda teste aparece na view
SELECT 'VIEW VW_BANDAS_LISTA' as fonte, id, nome, membros_count 
FROM vw_bandas_lista 
WHERE id = '7caff123-2825-4ee4-ac21-54f1bcb4942f';

-- Verificar todas as bandas na tabela
SELECT 'TODAS AS BANDAS NA TABELA' as info, id, nome, ativa 
FROM banda 
ORDER BY nome;

-- Verificar integrantes da banda teste
SELECT 'INTEGRANTES BANDA TESTE' as info, id, nome, instrumento, ativo 
FROM banda_integrante 
WHERE banda_id = '7caff123-2825-4ee4-ac21-54f1bcb4942f';

-- Verificar definição da view
SELECT 'DEFINICAO VIEW' as info, definition 
FROM pg_views 
WHERE viewname = 'vw_bandas_lista';
