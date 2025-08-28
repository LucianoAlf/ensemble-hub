-- Verificar políticas RLS existentes para a tabela evento
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'evento';

-- Desabilitar RLS temporariamente para teste (CUIDADO: apenas para debug)
-- ALTER TABLE evento DISABLE ROW LEVEL SECURITY;

-- Ou criar políticas mais permissivas para teste
-- Política para permitir SELECT para usuários anônimos
DROP POLICY IF EXISTS "Allow anonymous read access" ON evento;
CREATE POLICY "Allow anonymous read access" ON evento
    FOR SELECT
    TO anon
    USING (true);

-- Política para permitir acesso completo para usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated full access" ON evento;
CREATE POLICY "Allow authenticated full access" ON evento
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificar novamente as políticas após criação
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'evento';