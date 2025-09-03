const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTenantId() {
  try {
    console.log('=== PASSO A.1: Meu perfil ===');
    
    // Primeiro, vamos verificar se há um usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Nenhum usuário autenticado encontrado.');
      console.log('Para testar, você precisa estar logado na aplicação.');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }
    
    console.log('user_id:', profile.id);
    console.log('tenant_user:', profile.tenant_id || 'NULL');
    
    console.log('\n=== PASSO A.2: Tenant dos eventos (amostra) ===');
    
    // Buscar distribuição de tenant_id nos eventos
    const { data: eventos, error: eventosError } = await supabase
      .from('evento')
      .select('tenant_id');
    
    if (eventosError) {
      console.error('❌ Erro ao buscar eventos:', eventosError.message);
      return;
    }
    
    // Contar tenant_ids
    const tenantCounts = eventos.reduce((acc, evt) => {
      const tid = evt.tenant_id || 'NULL';
      acc[tid] = (acc[tid] || 0) + 1;
      return acc;
    }, {});
    
    const sortedTenants = Object.entries(tenantCounts)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('Distribuição de tenant_id nos eventos:');
    sortedTenants.forEach(([tid, count]) => {
      console.log(`  ${tid}: ${count} eventos`);
    });
    
    console.log('\n=== PASSO A.3: Sugestão de UPDATE ===');
    
    if (!profile.tenant_id && sortedTenants.length > 0) {
      const mostFrequentTenant = sortedTenants[0][0];
      
      if (mostFrequentTenant !== 'NULL') {
        console.log('\n🔧 UPDATE sugerido:');
        console.log(`UPDATE public.profiles SET tenant_id = '${mostFrequentTenant}' WHERE id = auth.uid();`);
        console.log('\n⚠️  ATENÇÃO: Este UPDATE não foi executado automaticamente.');
        console.log('   Confirme se o tenant_id sugerido está correto antes de aplicar.');
      } else {
        console.log('❌ Não há tenant_id válido nos eventos para sugerir.');
      }
    } else if (profile.tenant_id) {
      console.log('✅ Usuário já possui tenant_id configurado. Nenhuma ação necessária.');
    } else {
      console.log('❌ Nenhum evento encontrado para análise.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTenantId();