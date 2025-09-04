// Script para verificar estrutura completa do banco
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabaseStructure() {
  console.log('🗄️  VERIFICANDO ESTRUTURA DO BANCO DE DADOS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Tentar listar todas as tabelas acessíveis
    console.log('1. Verificando tabelas acessíveis...');
    
    const tablesToCheck = [
      'transactions',
      'user_tenants', 
      'tenants',
      'users',
      'profiles',
      'bands',
      'members',
      'events',
      'payouts',
      'financeiro'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: Acessível (${data?.length || 0} registros na amostra)`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Erro inesperado - ${err.message}`);
      }
    }
    
    // 2. Verificar estrutura da tabela transactions
    console.log('\n2. Verificando estrutura da tabela transactions...');
    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
      
      if (!transactionsError && transactionsData && transactionsData.length > 0) {
        console.log('   Colunas encontradas:', Object.keys(transactionsData[0]));
      } else {
        console.log('   Tabela vazia, tentando inserir para ver estrutura...');
        
        // Tentar inserir um registro inválido para ver quais campos são obrigatórios
        const { error: insertError } = await supabase
          .from('transactions')
          .insert([{ test: 'test' }]);
        
        if (insertError) {
          console.log('   Erro de inserção (mostra estrutura):', insertError.message);
        }
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar transactions:', err.message);
    }
    
    // 3. Verificar se existe sistema de autenticação
    console.log('\n3. Verificando sistema de autenticação...');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (user) {
        console.log('   ✅ Usuário autenticado:', user.email);
        console.log('   ID do usuário:', user.id);
        console.log('   Metadados:', user.user_metadata);
      } else {
        console.log('   ⚠️  Nenhum usuário autenticado');
      }
    } catch (err) {
      console.log('   ❌ Erro na verificação de auth:', err.message);
    }
    
    // 4. Tentar descobrir como o sistema de tenancy funciona
    console.log('\n4. Investigando sistema de tenancy...');
    
    // Verificar se tenant_id está em outras tabelas
    const tablesWithTenantId = ['transactions', 'bands', 'events', 'payouts'];
    
    for (const tableName of tablesWithTenantId) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('tenant_id')
          .limit(1);
        
        if (!error) {
          console.log(`   ✅ ${tableName} tem coluna tenant_id`);
        }
      } catch (err) {
        // Ignorar erros
      }
    }
    
    // 5. Verificar políticas RLS (se possível)
    console.log('\n5. Tentando entender as políticas RLS...');
    
    // Tentar inserir com diferentes tenant_ids para ver o comportamento
    const testTenantIds = [
      'd93bd1e5-245e-4a40-9027-4bd669ccc390', // O que estamos usando
      '00000000-0000-0000-0000-000000000000', // UUID zero
      'test-tenant-id' // String simples
    ];
    
    for (const testTenantId of testTenantIds) {
      try {
        const { error: testError } = await supabase
          .from('transactions')
          .insert([{
            tenant_id: testTenantId,
            type: 'income',
            counterparty: 'Teste',
            gross_amount: 100,
            fee_amount: 0,
            description: 'Teste RLS'
          }]);
        
        if (testError) {
          console.log(`   ❌ Tenant ${testTenantId}: ${testError.message}`);
        } else {
          console.log(`   ✅ Tenant ${testTenantId}: Inserção permitida`);
        }
      } catch (err) {
        console.log(`   ❌ Tenant ${testTenantId}: Erro inesperado`);
      }
    }
    
    console.log('\n📋 RESUMO:');
    console.log('- Verifique quais tabelas existem e estão acessíveis');
    console.log('- Identifique se falta criar tabelas de relacionamento user-tenant');
    console.log('- Entenda como as políticas RLS estão configuradas');
    console.log('- Determine se precisamos de uma service key para inserir dados');
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    console.log('Stack:', error.stack);
  }
}

checkDatabaseStructure();