// Script para associar usuário de teste ao tenant
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";

async function associateTestUser() {
  console.log('🔗 ASSOCIANDO USUÁRIO DE TESTE AO TENANT');
  console.log('=' .repeat(50));
  
  try {
    // 1. Fazer login com o usuário de teste
    console.log('1. Fazendo login com usuário de teste...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@ensemble-hub.com',
      password: 'TestPassword123!'
    });
    
    if (signInError) {
      console.log('❌ Erro no login:', signInError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('   Usuário:', signInData.user?.email);
    console.log('   ID:', signInData.user?.id);
    
    const userId = signInData.user?.id;
    
    // Aguardar um pouco para a sessão ser estabelecida
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Verificar se as tabelas foram criadas
    console.log('\n2. Verificando se as tabelas foram criadas...');
    
    try {
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);
      
      if (tenantsError) {
        console.log('❌ Tabela tenants não encontrada:', tenantsError.message);
        console.log('⚠️  Execute primeiro o script create_missing_tables.sql no SQL Editor do Supabase');
        return;
      } else {
        console.log('✅ Tabela tenants encontrada');
      }
    } catch (err) {
      console.log('❌ Erro ao verificar tabelas:', err.message);
      return;
    }
    
    // 3. Verificar se o tenant de teste existe
    console.log('\n3. Verificando tenant de teste...');
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId);
    
    if (tenantError) {
      console.log('❌ Erro ao verificar tenant:', tenantError.message);
      return;
    }
    
    if (!tenantData || tenantData.length === 0) {
      console.log('⚠️  Tenant de teste não encontrado, criando...');
      
      const { data: createTenantData, error: createTenantError } = await supabase
        .from('tenants')
        .insert([{
          id: tenantId,
          name: 'Ensemble Hub Test',
          slug: 'ensemble-hub-test'
        }])
        .select();
      
      if (createTenantError) {
        console.log('❌ Erro ao criar tenant:', createTenantError.message);
        return;
      } else {
        console.log('✅ Tenant criado:', createTenantData[0]);
      }
    } else {
      console.log('✅ Tenant encontrado:', tenantData[0]);
    }
    
    // 4. Verificar se já existe associação user-tenant
    console.log('\n4. Verificando associação user-tenant...');
    const { data: userTenantData, error: userTenantError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);
    
    if (userTenantError) {
      console.log('❌ Erro ao verificar user_tenants:', userTenantError.message);
      return;
    }
    
    if (!userTenantData || userTenantData.length === 0) {
      console.log('⚠️  Associação não encontrada, criando...');
      
      const { data: createAssociationData, error: createAssociationError } = await supabase
        .from('user_tenants')
        .insert([{
          user_id: userId,
          tenant_id: tenantId,
          role: 'admin'
        }])
        .select();
      
      if (createAssociationError) {
        console.log('❌ Erro ao criar associação:', createAssociationError.message);
        return;
      } else {
        console.log('✅ Associação criada:', createAssociationData[0]);
      }
    } else {
      console.log('✅ Associação já existe:', userTenantData[0]);
    }
    
    // 5. Testar inserção de transação
    console.log('\n5. Testando inserção de transação...');
    const testTransaction = {
      tenant_id: tenantId,
      type: 'income',
      category: 'test',
      counterparty: 'Teste Final',
      gross_amount: 100.00,
      fee_amount: 10.00,
      transaction_date: new Date().toISOString(),
      description: 'Teste após configuração completa'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('transactions')
      .insert([testTransaction])
      .select();
    
    if (insertError) {
      console.log('❌ Ainda com erro na inserção:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção bem-sucedida!', insertData[0]);
      
      // Limpar o registro de teste
      await supabase
        .from('transactions')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Registro de teste removido');
      
      console.log('\n🎉 CONFIGURAÇÃO COMPLETA!');
      console.log('Agora você pode inserir dados de teste reais.');
    }
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    console.log('Stack:', error.stack);
  }
}

associateTestUser();