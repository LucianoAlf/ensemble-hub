-- Remove 30-day limit from vw_eventos_proximos view
-- This allows the Dashboard to show all future events without time restriction

DROP VIEW IF EXISTS public.vw_eventos_proximos;

CREATE VIEW public.vw_eventos_proximos AS
SELECT 
  e.id,
  e.titulo,
  e.tipo,
  e.inicio,
  e.fim, 
  e.local,
  e.endereco,
  e.orcamento,
  e.status,
  e.descricao,
  e.banda_id,
  e.unidade_id,
  e.tenant_id,
  e.sala_id,
  e.created_at,
  b.nome as banda_nome
FROM public.evento e
LEFT JOIN public.banda b ON e.banda_id = b.id
WHERE e.inicio >= CURRENT_DATE
ORDER BY e.inicio ASC;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.vw_eventos_proximos IS 'View that shows all future events without time limit for Dashboard display';