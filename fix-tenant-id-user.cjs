const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirflwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjI4NzIsImV4cCI6MjA1MjUzODg3Mn0.Ek8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Tenant ID padrão encontrado nas outras tabelas
const DEFAULT_TENANT_ID = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';

async function fixUserTenantId() {
  console.log('🔧 CORREÇÃO DO TENANT_ID DO USUÁRIO');
  console.log('=' .repeat(50));
  
  try {
    // Passo 1: Verificar perfil do usuário atual
    console.log('\n1️⃣ Verificando perfil do usuário atual...');
    
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    
    if (userError || !currentUser?.user) {
      console.log('❌ Erro: Usuário não autenticado');
      console.log('   Detalhes:', userError?.message || 'Usuário não encontrado');
      return;
    }
    
    const userId = currentUser.user.id;
    console.log('✅ Usuário autenticado:', userId);
    
    // Verificar se existe perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }
    
    if (!profileData) {
      // Passo 2: Criar perfil se não existir
      console.log('\n2️⃣ Perfil não encontrado. Criando novo perfil...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          tenant_id: DEFAULT_TENANT_ID
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Erro ao criar perfil:', createError.message);
        return;
      }
      
      console.log('✅ Perfil criado com sucesso!');
      console.log('   ID:', newProfile.id);
      console.log('   Tenant ID:', newProfile.tenant_id);
      
    } else {
      console.log('✅ Perfil encontrado:');
      console.log('   ID:', profileData.id);
      console.log('   Tenant ID:', profileData.tenant_id || 'NULL');
      
      if (!profileData.tenant_id) {
        // Passo 3: Atualizar tenant_id se não existir
        console.log('\n3️⃣ Tenant ID não configurado. Atualizando...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ tenant_id: DEFAULT_TENANT_ID })
          .eq('id', userId)
          .select()
          .single();
        
        if (updateError) {
          console.log('❌ Erro ao atualizar perfil:', updateError.message);
          return;
        }
        
        console.log('✅ Perfil atualizado com sucesso!');
        console.log('   Tenant ID:', updatedProfile.tenant_id);
      } else {
        console.log('✅ Tenant ID já configurado corretamente!');
      }
    }
    
    // Verificação final
    console.log('\n4️⃣ Verificação final...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (finalError) {
      console.log('❌ Erro na verificação final:', finalError.message);
      return;
    }
    
    console.log('✅ Perfil final:');
    console.log('   ID:', finalProfile.id);
    console.log('   Tenant ID:', finalProfile.tenant_id);
    console.log('   Created At:', finalProfile.created_at);
    console.log('   Updated At:', finalProfile.updated_at);
    
    // Testar função get_dashboard_metrics
    console.log('\n5️⃣ Testando função get_dashboard_metrics...');
    const { data: metricsData, error: metricsError } = await supabase.rpc('get_dashboard_metrics');
    
    if (metricsError) {
      console.log('❌ Erro na função get_dashboard_metrics:');
      console.log('   Código:', metricsError.code || 'N/A');
      console.log('   Mensagem:', metricsError.message);
      
      if (metricsError.message.includes('column "ativo" does not exist')) {
        console.log('\n⚠️  A função get_dashboard_metrics ainda precisa ser atualizada no banco!');
        console.log('   Execute o arquivo fix-dashboard-final-corrected.sql no Supabase Dashboard.');
      }
    } else {
      console.log('✅ Função get_dashboard_metrics funcionando!');
      console.log('📊 Métricas:');
      console.log('   Bandas:', metricsData?.total_bands || 0);
      console.log('   Eventos:', metricsData?.total_events || 0);
      console.log('   Integrantes:', metricsData?.total_members || 0);
      console.log('   Receita:', metricsData?.monthly_revenue || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 CORREÇÃO DE TENANT_ID CONCLUÍDA');
}

// Executar correção
fixUserTenantId().catch(console.error);