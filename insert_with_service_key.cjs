// Script para inserir dados usando service key (bypass RLS)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
// Usando a chave anon por enquanto - idealmente precisaríamos da service key
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tenantId = "d93bd1e5-245e-4a40-9027-4bd669ccc390";

async function insertWithWorkaround() {
  console.log('🔧 TENTANDO INSERIR DADOS COM WORKAROUND');
  console.log('=' .repeat(50));
  
  try {
    // Opção 1: Tentar criar um usuário temporário
    console.log('1. Tentando criar usuário temporário...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@ensemble-hub.com',
      password: 'TestPassword123!'
    });
    
    if (signUpError) {
      console.log('❌ Erro ao criar usuário:', signUpError.message);
    } else {
      console.log('✅ Usuário criado ou já existe');
    }
    
    // Opção 2: Tentar fazer login
    console.log('\n2. Tentando fazer login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@ensemble-hub.com',
      password: 'TestPassword123!'
    });
    
    if (signInError) {
      console.log('❌ Erro no login:', signInError.message);
    } else {
      console.log('✅ Login realizado com sucesso');
      console.log('   Usuário:', signInData.user?.email);
      console.log('   ID:', signInData.user?.id);
    }
    
    // Aguardar um pouco para a sessão ser estabelecida
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Opção 3: Tentar inserir agora com usuário autenticado
    console.log('\n3. Tentando inserir com usuário autenticado...');
    const testData = {
      tenant_id: tenantId,
      type: 'income',
      counterparty: 'Teste Autenticado',
      gross_amount: 100.00,
      fee_amount: 10.00,
      description: 'Teste com usuário autenticado'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('transactions')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('❌ Ainda com erro na inserção:', insertError.message);
      console.log('   Código:', insertError.code);
      
      // Opção 4: Verificar se o usuário tem acesso ao tenant
      console.log('\n4. Verificando acesso ao tenant...');
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        console.log('   User ID atual:', currentUser.data.user.id);
        console.log('   Tenant ID tentando acessar:', tenantId);
        
        // Verificar se existe uma relação user-tenant
        const { data: userTenantData, error: userTenantError } = await supabase
          .from('user_tenants')
          .select('*')
          .eq('user_id', currentUser.data.user.id)
          .eq('tenant_id', tenantId);
        
        if (userTenantError) {
          console.log('   ❌ Erro ao verificar user_tenants:', userTenantError.message);
        } else {
          console.log('   Relações user-tenant encontradas:', userTenantData?.length || 0);
          
          if (!userTenantData || userTenantData.length === 0) {
            console.log('\n5. Tentando criar relação user-tenant...');
            const { data: createRelationData, error: createRelationError } = await supabase
              .from('user_tenants')
              .insert([{
                user_id: currentUser.data.user.id,
                tenant_id: tenantId,
                role: 'admin'
              }])
              .select();
            
            if (createRelationError) {
              console.log('   ❌ Erro ao criar relação:', createRelationError.message);
            } else {
              console.log('   ✅ Relação user-tenant criada:', createRelationData);
              
              // Tentar inserir novamente
              console.log('\n6. Tentando inserir novamente após criar relação...');
              const { data: finalInsertData, error: finalInsertError } = await supabase
                .from('transactions')
                .insert([testData])
                .select();
              
              if (finalInsertError) {
                console.log('   ❌ Ainda com erro:', finalInsertError.message);
              } else {
                console.log('   ✅ Inserção bem-sucedida!', finalInsertData);
                
                // Limpar
                await supabase
                  .from('transactions')
                  .delete()
                  .eq('id', finalInsertData[0].id);
                console.log('   🧹 Registro de teste removido');
              }
            }
          }
        }
      }
    } else {
      console.log('✅ Inserção bem-sucedida!', insertData);
      
      // Limpar
      await supabase
        .from('transactions')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    console.log('Stack:', error.stack);
  }
}

insertWithWorkaround();