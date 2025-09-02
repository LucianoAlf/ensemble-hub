// Script para criar a tabela banda_integrante se ela não existir
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAndCreateBandaIntegrante() {
  console.log('🔍 Verificando se a tabela banda_integrante existe...');
  
  try {
    // Primeiro, vamos tentar fazer uma query simples na tabela
    const { data, error } = await supabase
      .from('banda_integrante')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.banda_integrante" does not exist')) {
        console.log('❌ Tabela banda_integrante não existe. Criando...');
        await createBandaIntegranteTable();
      } else {
        console.error('❌ Erro ao verificar tabela:', error.message);
        return false;
      }
    } else {
      console.log('✅ Tabela banda_integrante já existe!');
      console.log('📊 Dados encontrados:', data?.length || 0, 'registros');
      return true;
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return false;
  }
}

async function createBandaIntegranteTable() {
  console.log('🔨 Criando tabela banda_integrante...');
  
  const createTableSQL = `
    -- Create banda_integrante table
    CREATE TABLE IF NOT EXISTS public.banda_integrante (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      banda_id UUID NOT NULL,
      nome TEXT NOT NULL,
      instrumento TEXT,
      funcao TEXT,
      telefone TEXT,
      email TEXT,
      instagram TEXT,
      facebook TEXT,
      youtube TEXT,
      spotify TEXT,
      data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
      data_saida DATE,
      ativo BOOLEAN DEFAULT true,
      observacoes TEXT,
      tenant_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Enable RLS on banda_integrante
    ALTER TABLE public.banda_integrante ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for banda_integrante
    CREATE POLICY "Users can view banda_integrante from their tenant" 
    ON public.banda_integrante 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
    ));
    
    CREATE POLICY "Users can create banda_integrante in their tenant" 
    ON public.banda_integrante 
    FOR INSERT 
    WITH CHECK (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
    ));
    
    CREATE POLICY "Users can update banda_integrante in their tenant" 
    ON public.banda_integrante 
    FOR UPDATE 
    USING (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
    ));
    
    CREATE POLICY "Users can delete banda_integrante from their tenant" 
    ON public.banda_integrante 
    FOR DELETE 
    USING (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
    ));
    
    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE TRIGGER update_banda_integrante_updated_at
        BEFORE UPDATE ON public.banda_integrante
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    
    -- Add foreign key constraint
    ALTER TABLE public.banda_integrante
        ADD CONSTRAINT fk_banda_integrante_banda
        FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_banda_integrante_banda_id ON public.banda_integrante(banda_id);
    CREATE INDEX IF NOT EXISTS idx_banda_integrante_tenant_id ON public.banda_integrante(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_banda_integrante_ativo ON public.banda_integrante(ativo);
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Erro ao criar tabela via RPC:', error.message);
      console.log('🔄 Tentando abordagem alternativa...');
      
      // Abordagem alternativa: tentar criar via query direta
      // Nota: Isso pode não funcionar devido a limitações de permissão
      console.log('⚠️  A tabela precisa ser criada manualmente no Supabase Dashboard.');
      console.log('📋 SQL para executar:');
      console.log(createTableSQL);
      return false;
    } else {
      console.log('✅ Tabela banda_integrante criada com sucesso!');
      return true;
    }
  } catch (err) {
    console.error('❌ Erro ao executar SQL:', err);
    return false;
  }
}

async function testBandaIntegranteAccess() {
  console.log('🧪 Testando acesso à tabela banda_integrante...');
  
  try {
    const { data, error } = await supabase
      .from('banda_integrante')
      .select('*')
      .eq('ativo', true)
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao acessar banda_integrante:', error.message);
      return false;
    } else {
      console.log('✅ Acesso à tabela banda_integrante funcionando!');
      console.log('📊 Registros ativos encontrados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Exemplo de registro:', data[0]);
      }
      return true;
    }
  } catch (err) {
    console.error('❌ Erro inesperado ao testar acesso:', err);
    return false;
  }
}

// Executar verificação e teste
async function main() {
  console.log('🚀 Iniciando verificação da tabela banda_integrante...');
  console.log('🔗 URL do Supabase:', SUPABASE_URL);
  console.log('🔑 Chave configurada:', SUPABASE_KEY ? 'Sim' : 'Não');
  console.log('---');
  
  const exists = await checkAndCreateBandaIntegrante();
  
  if (exists !== false) {
    await testBandaIntegranteAccess();
  }
  
  console.log('---');
  console.log('🏁 Verificação concluída!');
}

main().catch(console.error);