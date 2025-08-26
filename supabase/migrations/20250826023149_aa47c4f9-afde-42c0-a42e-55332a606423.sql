-- Create improved view for events that includes a wider time range
DROP VIEW IF EXISTS public.vw_eventos_todos;

CREATE OR REPLACE VIEW public.vw_eventos_todos AS
SELECT 
  e.id,
  e.titulo,
  e.tipo,
  e.inicio,
  e.fim,
  e.local,
  e.endereco,
  e.orcamento,
  e.descricao,
  e.status,
  e.tenant_id,
  e.unidade_id,
  e.banda_id,
  e.created_at,
  b.nome as banda_nome
FROM public.evento e
LEFT JOIN public.banda b ON e.banda_id = b.id
WHERE e.inicio >= (CURRENT_DATE - INTERVAL '90 days')
ORDER BY e.inicio ASC;