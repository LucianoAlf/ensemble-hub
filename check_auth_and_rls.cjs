const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - substitua pelos valores reais
const supabaseUrl = 'https://ixqjqfqjqfqjqfqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFqcWZxanFmcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNDUxNzE0NCwiZXhwIjoyMDQwMDkzMTQ0fQ.VKjP7-Ks_7SoLONKlbHJQJOYKOJOYKOJOYKOJOYKOJO';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configuração do Supabase não encontrada!');
  console.log('Por favor, configure as variáveis supabaseUrl e supabaseKey no script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthAndRLS() {
  console.log('🔍 Verificando configuração de autenticação e RLS...');
  console.log('\n=== CONFIGURAÇÃO SUPABASE ===');
  console.log('URL:', supabaseUrl);
  console.log('Key (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...');
  
  try {
    // 1. Verificar sessão atual
    console.log('\n=== VERIFICAÇÃO DE SESSÃO ===');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Sessão obtida com sucesso');
      console.log('Usuário logado:', sessionData.session ? 'Sim' : 'Não');
      if (sessionData.session) {
        console.log('User ID:', sessionData.session.user.id);
        console.log('Email:', sessionData.session.user.email);
      }
    }

    // 2. Verificar políticas RLS nas tabelas financeiras
    console.log('\n=== POLÍTICAS RLS ===');
    const tables = ['transactions', 'payouts', 'financeiro'];
    
    for (const table of tables) {
      console.log(`\n--- Tabela: ${table} ---`);
      
      // Verificar se RLS está habilitado
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('check_rls_status', { table_name: table })
        .single();
      
      if (rlsError && !rlsError.message.includes('function check_rls_status')) {
        console.error(`❌ Erro ao verificar RLS para ${table}:`, rlsError.message);
      }
      
      // Tentar consultar políticas diretamente
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', table);
      
      if (policiesError) {
        console.log(`⚠️  Não foi possível acessar políticas para ${table}:`, policiesError.message);
      } else if (policies && policies.length > 0) {
        console.log(`✅ Encontradas ${policies.length} políticas para ${table}:`);
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.cmd}) - Roles: ${policy.roles}`);
        });
      } else {
        console.log(`⚠️  Nenhuma política encontrada para ${table}`);
      }
      
      // Testar acesso à tabela
      const { data: testData, error: testError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log(`❌ Erro ao acessar ${table}:`, testError.message);
        if (testError.message.includes('RLS')) {
          console.log(`   → RLS está bloqueando o acesso`);
        }
        if (testError.message.includes('permission denied')) {
          console.log(`   → Permissão negada - possível problema de autenticação`);
        }
      } else {
        console.log(`✅ Acesso à tabela ${table} funcionando (${testData?.length || 0} registros retornados)`);
      }
    }

    // 3. Verificar estrutura das tabelas
    console.log('\n=== ESTRUTURA DAS TABELAS ===');
    for (const table of tables) {
      console.log(`\n--- Colunas da tabela: ${table} ---`);
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: table });
      
      if (columnsError && !columnsError.message.includes('function get_table_columns')) {
        console.error(`❌ Erro ao obter colunas de ${table}:`, columnsError.message);
      } else {
        // Tentar uma abordagem alternativa
        const { data: sampleData, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (sampleError) {
          console.log(`⚠️  Não foi possível obter estrutura de ${table}:`, sampleError.message);
        } else {
          console.log(`✅ Tabela ${table} existe e é acessível`);
        }
      }
    }

    // 4. Testar inserção simples (para identificar problemas específicos)
    console.log('\n=== TESTE DE INSERÇÃO ===');
    const testTransaction = {
      description: 'Teste de inserção',
      amount: 100.00,
      type: 'income',
      category: 'test',
      date: new Date().toISOString().split('T')[0]
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('transactions')
      .insert(testTransaction)
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir teste:', insertError.message);
      if (insertError.message.includes('tenant_id')) {
        console.log('   → Problema relacionado ao tenant_id');
      }
      if (insertError.message.includes('RLS')) {
        console.log('   → RLS está bloqueando a inserção');
      }
      if (insertError.message.includes('authentication')) {
        console.log('   → Problema de autenticação');
      }
    } else {
      console.log('✅ Inserção de teste bem-sucedida:', insertData);
      
      // Limpar o teste
      if (insertData && insertData[0]) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAuthAndRLS().then(() => {
  console.log('\n🏁 Verificação concluída');
}).catch(console.error);