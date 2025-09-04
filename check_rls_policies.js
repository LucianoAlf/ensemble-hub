// Script para verificar políticas RLS e estrutura da tabela transactions
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 VERIFICANDO POLÍTICAS RLS E ESTRUTURA DA TABELA TRANSACTIONS');
console.log('=' .repeat(70));

async function checkRLSAndStructure() {
  try {
    // Verificar políticas RLS da tabela transactions
    console.log('\n🛡️  VERIFICANDO POLÍTICAS RLS');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'transactions' });
    
    if (policiesError) {
      console.log('❌ Erro ao obter políticas RLS:', policiesError.message);
      
      // Tentar consulta SQL direta para verificar políticas
      console.log('\n🔍 Tentando consulta SQL direta...');
      const { data: sqlPolicies, error: sqlError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'transactions');
      
      if (sqlError) {
        console.log('❌ Erro na consulta SQL:', sqlError.message);
      } else {
        console.log('✅ Políticas encontradas via SQL:', sqlPolicies.length);
        sqlPolicies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
        });
      }
    } else {
      console.log('✅ Políticas RLS:', policies);
    }
    
    // Verificar estrutura da tabela usando information_schema
    console.log('\n📊 VERIFICANDO ESTRUTURA DA TABELA VIA INFORMATION_SCHEMA');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, is_generated, generation_expression')
      .eq('table_name', 'transactions')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.log('❌ Erro ao obter estrutura:', columnsError.message);
    } else {
      console.log('✅ Estrutura da tabela transactions:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'}, generated: ${col.is_generated || 'NO'})`);
        if (col.generation_expression) {
          console.log(`     Expression: ${col.generation_expression}`);
        }
      });
      
      // Verificar especificamente o campo net_amount
      const netAmountCol = columns.find(col => col.column_name === 'net_amount');
      if (netAmountCol) {
        console.log('\n💰 DETALHES DO CAMPO NET_AMOUNT:');
        console.log(`   Tipo: ${netAmountCol.data_type}`);
        console.log(`   Nullable: ${netAmountCol.is_nullable}`);
        console.log(`   Default: ${netAmountCol.column_default || 'none'}`);
        console.log(`   Generated: ${netAmountCol.is_generated}`);
        if (netAmountCol.generation_expression) {
          console.log(`   Expression: ${netAmountCol.generation_expression}`);
        }
      }
    }
    
    // Verificar se RLS está habilitado
    console.log('\n🔒 VERIFICANDO STATUS DO RLS');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'transactions')
      .eq('schemaname', 'public')
      .single();
    
    if (rlsError) {
      console.log('❌ Erro ao verificar RLS:', rlsError.message);
    } else {
      console.log(`✅ RLS habilitado: ${rlsStatus.rowsecurity}`);
    }
    
    // Tentar inserção com usuário autenticado (simulando)
    console.log('\n🧪 TESTANDO INSERÇÃO COM DADOS MÍNIMOS');
    const testData = {
      tenant_id: 'd93bd1e5-245e-4a40-9027-4bd669ccc390',
      type: 'income',
      status: 'pending',
      category: 'test',
      gross_amount: 1000.00,
      fee_amount: 50.00,
      transaction_date: new Date().toISOString().split('T')[0],
      description: 'Teste de inserção'
    };
    
    console.log('Dados para inserção:', testData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('transactions')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('   ID:', insertResult.id);
      console.log('   Net Amount:', insertResult.net_amount);
      
      // Limpar o registro de teste
      await supabase.from('transactions').delete().eq('id', insertResult.id);
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkRLSAndStructure().then(() => {
  console.log('\n🎉 Verificação de RLS e estrutura concluída!');
}).catch((error) => {
  console.error('💥 Erro na verificação:', error);
});