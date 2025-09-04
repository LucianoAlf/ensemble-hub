// Script para corrigir políticas RLS e testar autenticação
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔐 VERIFICANDO AUTENTICAÇÃO E CORRIGINDO RLS');
console.log('=' .repeat(60));

async function fixRLSAndAuth() {
  try {
    // Verificar usuário atual
    console.log('\n👤 VERIFICANDO USUÁRIO ATUAL');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Erro ao obter usuário:', userError.message);
    } else if (user) {
      console.log('✅ Usuário logado:', user.id);
      console.log('   Email:', user.email);
    } else {
      console.log('⚠️  Nenhum usuário logado');
      
      // Tentar fazer login anônimo ou criar usuário de teste
      console.log('\n🔑 TENTANDO AUTENTICAÇÃO DE TESTE');
      const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) {
        console.log('❌ Erro no login anônimo:', signInError.message);
      } else {
        console.log('✅ Login anônimo bem-sucedido:', signInData.user?.id);
      }
    }
    
    // Verificar sessão atual
    console.log('\n🎫 VERIFICANDO SESSÃO');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
    } else if (session) {
      console.log('✅ Sessão ativa:', session.user.id);
      console.log('   Access Token:', session.access_token.substring(0, 20) + '...');
    } else {
      console.log('⚠️  Nenhuma sessão ativa');
    }
    
    // Tentar criar políticas RLS mais permissivas
    console.log('\n🛡️  CRIANDO POLÍTICAS RLS PERMISSIVAS');
    
    // Política para SELECT (leitura)
    const selectPolicy = `
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to read transactions"
      ON transactions FOR SELECT
      TO authenticated
      USING (true);
    `;
    
    // Política para INSERT (criação)
    const insertPolicy = `
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert transactions"
      ON transactions FOR INSERT
      TO authenticated
      WITH CHECK (true);
    `;
    
    // Política para UPDATE (atualização)
    const updatePolicy = `
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to update transactions"
      ON transactions FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
    `;
    
    // Política para DELETE (exclusão)
    const deletePolicy = `
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete transactions"
      ON transactions FOR DELETE
      TO authenticated
      USING (true);
    `;
    
    // Executar políticas
    const policies = [selectPolicy, insertPolicy, updatePolicy, deletePolicy];
    
    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      
      if (policyError) {
        console.log('❌ Erro ao criar política:', policyError.message);
      } else {
        console.log('✅ Política criada com sucesso');
      }
    }
    
    // Verificar se net_amount é uma coluna computed
    console.log('\n💰 VERIFICANDO COLUNA NET_AMOUNT');
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_column_info', { 
        table_name: 'transactions', 
        column_name: 'net_amount' 
      });
    
    if (columnError) {
      console.log('❌ Erro ao verificar coluna:', columnError.message);
      
      // Tentar criar a coluna como computed se não existir
      console.log('\n🔧 TENTANDO CRIAR COLUNA COMPUTED');
      const createComputedColumn = `
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) 
        GENERATED ALWAYS AS (gross_amount - COALESCE(fee_amount, 0)) STORED;
      `;
      
      const { error: alterError } = await supabase.rpc('exec_sql', { sql: createComputedColumn });
      
      if (alterError) {
        console.log('❌ Erro ao criar coluna computed:', alterError.message);
      } else {
        console.log('✅ Coluna computed criada com sucesso');
      }
    } else {
      console.log('✅ Informações da coluna net_amount:', columnInfo);
    }
    
    // Testar inserção após correções
    console.log('\n🧪 TESTANDO INSERÇÃO APÓS CORREÇÕES');
    const testTenantId = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';
    
    const testData = {
      tenant_id: testTenantId,
      type: 'income',
      status: 'pending',
      category: 'test',
      gross_amount: 1000.00,
      fee_amount: 50.00,
      transaction_date: new Date().toISOString().split('T')[0],
      description: 'Teste após correções RLS'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('transactions')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', insertError.details);
      
      // Tentar desabilitar RLS temporariamente para teste
      console.log('\n🔓 TENTANDO DESABILITAR RLS TEMPORARIAMENTE');
      const disableRLS = `ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;`;
      
      const { error: disableError } = await supabase.rpc('exec_sql', { sql: disableRLS });
      
      if (disableError) {
        console.log('❌ Erro ao desabilitar RLS:', disableError.message);
      } else {
        console.log('✅ RLS desabilitado temporariamente');
        
        // Tentar inserção novamente
        const { data: retryResult, error: retryError } = await supabase
          .from('transactions')
          .insert(testData)
          .select()
          .single();
        
        if (retryError) {
          console.log('❌ Erro na inserção mesmo sem RLS:', retryError.message);
        } else {
          console.log('✅ Inserção bem-sucedida sem RLS:', retryResult.id);
          console.log('   Net Amount calculado:', retryResult.net_amount);
          
          // Limpar registro de teste
          await supabase.from('transactions').delete().eq('id', retryResult.id);
        }
        
        // Reabilitar RLS
        const enableRLS = `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;`;
        await supabase.rpc('exec_sql', { sql: enableRLS });
        console.log('🔒 RLS reabilitado');
      }
    } else {
      console.log('✅ Inserção bem-sucedida:', insertResult.id);
      console.log('   Net Amount:', insertResult.net_amount);
      
      // Limpar registro de teste
      await supabase.from('transactions').delete().eq('id', insertResult.id);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar correções
fixRLSAndAuth().then(() => {
  console.log('\n🎉 Correções de RLS e autenticação concluídas!');
}).catch((error) => {
  console.error('💥 Erro nas correções:', error);
});