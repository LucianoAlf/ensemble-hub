// Script para testar conexão com Supabase e verificar tabela transactions
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🔍 TESTE DE CONEXÃO SUPABASE');
  console.log('=' .repeat(50));
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_KEY.substring(0, 20)}...`);
  
  try {
    // 1. Testar conexão básica
    console.log('\n1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('transactions')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('❌ Erro na conexão:', healthError.message);
      console.log('Detalhes:', healthError);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log(`Total de registros na tabela transactions: ${healthCheck || 0}`);
    
    // 2. Verificar estrutura da tabela
    console.log('\n2. Verificando estrutura da tabela...');
    const { data: sample, error: sampleError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Erro ao acessar tabela:', sampleError.message);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('✅ Tabela acessível. Colunas encontradas:');
      console.log(Object.keys(sample[0]).join(', '));
    } else {
      console.log('⚠️  Tabela existe mas está vazia');
    }
    
    // 3. Verificar dados por tenant
    console.log('\n3. Verificando dados por tenant...');
    const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";
    
    const { data: tenantData, error: tenantError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (tenantError) {
      console.log('❌ Erro ao filtrar por tenant:', tenantError.message);
      return;
    }
    
    console.log(`✅ Dados do tenant ${tenantId}: ${tenantData.length} registros`);
    
    if (tenantData.length > 0) {
      console.log('\n📊 Primeiros registros:');
      tenantData.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}, Valor: ${record.gross_amount}, Tipo: ${record.type || 'N/A'}`);
      });
    }
    
    // 4. Tentar inserir um registro de teste
    console.log('\n4. Testando inserção...');
    const testRecord = {
      tenant_id: tenantId,
      gross_amount: 100.00,
      fee_amount: 10.00,
      net_amount: 90.00,
      type: 'income',
      counterparty: 'Teste Conexão',
      description: 'Teste de conexão - pode ser removido'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('transactions')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('Detalhes:', insertError);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('Registro criado:', insertResult[0]);
      
      // Limpar o registro de teste
      await supabase
        .from('transactions')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Registro de teste removido');
    }
    
    // 5. Verificar total final
    console.log('\n5. Contagem final...');
    const { data: finalCount, error: finalError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    if (!finalError) {
      console.log(`📊 Total final de transações para o tenant: ${finalCount || 0}`);
    }
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    console.log('Stack:', error.stack);
  }
}

testConnection();