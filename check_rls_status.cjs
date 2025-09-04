// Script para verificar status das políticas RLS
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRLSStatus() {
  console.log('🔒 VERIFICANDO STATUS DAS POLÍTICAS RLS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar se conseguimos ler a tabela
    console.log('1. Testando leitura da tabela transactions...');
    const { data: readData, error: readError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (readError) {
      console.log('❌ Erro na leitura:', readError.message);
    } else {
      console.log('✅ Leitura permitida');
    }
    
    // 2. Verificar usuário atual
    console.log('\n2. Verificando usuário atual...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Erro ao obter usuário:', userError.message);
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
      console.log('   ID:', user.id);
    } else {
      console.log('⚠️  Nenhum usuário autenticado (usuário anônimo)');
    }
    
    // 3. Tentar inserção simples para ver erro específico
    console.log('\n3. Testando inserção simples...');
    const testData = {
      tenant_id: "d93bd1e5-245e-4a40-9027-4bd669ccc390",
      type: 'income',
      counterparty: 'Teste',
      gross_amount: 100.00,
      fee_amount: 10.00,
      description: 'Teste de inserção'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('transactions')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção bem-sucedida:', insertData);
      
      // Limpar o registro de teste
      await supabase
        .from('transactions')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Registro de teste removido');
    }
    
    // 4. Verificar políticas via SQL (se possível)
    console.log('\n4. Tentando verificar políticas RLS via SQL...');
    const { data: policiesData, error: policiesError } = await supabase
      .rpc('get_policies_info'); // Esta função pode não existir
    
    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas via RPC:', policiesError.message);
    } else {
      console.log('✅ Políticas encontradas:', policiesData);
    }
    
    // 5. Verificar se RLS está habilitado
    console.log('\n5. Verificando se RLS está habilitado...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'transactions');
    
    if (rlsError) {
      console.log('⚠️  Não foi possível verificar status RLS:', rlsError.message);
    } else {
      console.log('RLS Status:', rlsData);
    }
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    console.log('Stack:', error.stack);
  }
}

checkRLSStatus();