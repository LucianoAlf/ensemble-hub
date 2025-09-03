-- Teste simples das funcoes RPC
-- Verificar se as funcoes existem e podem ser chamadas

-- Teste 1: Verificar se as funcoes existem
SELECT 'TESTE: Verificacao de funcoes' as status;
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_evento_full', 'update_evento_full') 
ORDER BY routine_name;

-- Teste 2: Verificar parametros da funcao get_evento_full
SELECT 'TESTE: Parametros get_evento_full' as status;
SELECT parameter_name, data_type, parameter_mode
FROM information_schema.parameters
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'get_evento_full' 
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- Teste 3: Verificar parametros da funcao update_evento_full
SELECT 'TESTE: Parametros update_evento_full' as status;
SELECT parameter_name, data_type, parameter_mode
FROM information_schema.parameters
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'update_evento_full' 
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- Teste 4: Verificar se auth.uid() funciona
SELECT 'TESTE: Funcao auth.uid()' as status;
SELECT auth.uid() as current_user_id;

-- Teste 5: Verificar estrutura da tabela evento
SELECT 'TESTE: Estrutura tabela evento' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'evento' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TESTES CONCLUIDOS' as resultado;