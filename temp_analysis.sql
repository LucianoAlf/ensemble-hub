-- Análise do conflito entre evento.banda_id e evento_banda

-- 1. Contar eventos com banda_id preenchido
SELECT 'Eventos com banda_id preenchido:' as description, COUNT(*) as count
FROM evento 
WHERE banda_id IS NOT NULL;

-- 2. Contar registros na tabela evento_banda
SELECT 'Registros na tabela evento_banda:' as description, COUNT(*) as count
FROM evento_banda;

-- 3. Contar eventos que têm registros em evento_banda
SELECT 'Eventos com registros em evento_banda:' as description, COUNT(DISTINCT e.id) as count
FROM evento e 
JOIN evento_banda eb ON e.id = eb.evento_id;

-- 4. CONFLITO: Eventos que têm AMBOS banda_id E registros em evento_banda
SELECT 'CONFLITO - Eventos com banda_id E evento_banda:' as description, COUNT(*) as count
FROM evento e
WHERE e.banda_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM evento_banda eb WHERE eb.evento_id = e.id);

-- 5. Detalhes dos eventos em conflito
SELECT 
  e.id,
  e.titulo,
  e.banda_id as evento_banda_id,
  b1.nome as banda_direta,
  eb.banda_id as evento_banda_banda_id,
  b2.nome as banda_via_evento_banda,
  CASE 
    WHEN e.banda_id = eb.banda_id THEN 'MESMO_BANDA'
    ELSE 'BANDAS_DIFERENTES'
  END as status_conflito
FROM evento e
JOIN evento_banda eb ON e.id = eb.evento_id
LEFT JOIN banda b1 ON e.banda_id = b1.id
LEFT JOIN banda b2 ON eb.banda_id = b2.id
WHERE e.banda_id IS NOT NULL
ORDER BY e.titulo;

-- 6. Eventos que só têm banda_id (sem evento_banda)
SELECT 'Eventos só com banda_id (sem evento_banda):' as description, COUNT(*) as count
FROM evento e
WHERE e.banda_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM evento_banda eb WHERE eb.evento_id = e.id);

-- 7. Eventos que só têm evento_banda (sem banda_id)
SELECT 'Eventos só com evento_banda (sem banda_id):' as description, COUNT(*) as count
FROM evento e
WHERE e.banda_id IS NULL 
  AND EXISTS (SELECT 1 FROM evento_banda eb WHERE eb.evento_id = e.id);