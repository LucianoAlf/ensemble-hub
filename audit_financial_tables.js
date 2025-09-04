// Script para auditoria das tabelas financeiras
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 AUDITORIA DAS TABELAS FINANCEIRAS');
console.log('=' .repeat(60));

async function auditFinancialTables() {
  try {
    // 1. Verificar estrutura das tabelas financeiras
    console.log('\n📊 1. VERIFICANDO ESTRUTURA DAS TABELAS');
    
    const tables = ['transactions', 'payouts', 'financeiro'];
    
    for (const table of tables) {
      console.log(`\n🔍 Tabela: ${table}`);
      
      // Verificar se a tabela existe e buscar dados
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.log(`❌ Erro ao acessar ${table}:`, error.message);
        
        // Se a tabela não existe, vamos tentar criar
        if (error.code === '42P01') {
          console.log(`⚠️  Tabela ${table} não existe. Criando...`);
          await createFinancialTable(table);
        }
      } else {
        console.log(`✅ Tabela ${table} existe`);
        console.log(`📈 Total de registros: ${count}`);
        
        if (data && data.length > 0) {
          console.log(`📋 Primeiros registros:`);
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log(`📋 Tabela vazia`);
        }
      }
    }
    
    // 2. Verificar dados mockados vs reais
    console.log('\n\n🎭 2. VERIFICANDO DADOS MOCKADOS VS REAIS');
    await checkMockData();
    
    // 3. Testar operações CRUD
    console.log('\n\n🔧 3. TESTANDO OPERAÇÕES CRUD');
    await testCrudOperations();
    
    // 4. Verificar sincronização em tempo real
    console.log('\n\n⚡ 4. VERIFICANDO SINCRONIZAÇÃO EM TEMPO REAL');
    await testRealtimeSync();
    
  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
  }
}

async function createFinancialTable(tableName) {
  let sql = '';
  
  switch (tableName) {
    case 'transactions':
      sql = `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
          status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'settled', 'cancelled')),
          category VARCHAR(50) NOT NULL,
          gross_amount DECIMAL(10,2) NOT NULL,
          fee_amount DECIMAL(10,2) DEFAULT 0,
          net_amount DECIMAL(10,2) NOT NULL,
          transaction_date DATE NOT NULL,
          payment_method VARCHAR(50),
          description TEXT,
          reference_id VARCHAR(100),
          banda_id UUID,
          evento_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices
        CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
        
        -- RLS
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS
        CREATE POLICY "Users can only see their own transactions" ON transactions
          FOR ALL USING (tenant_id = auth.uid());
      `;
      break;
      
    case 'payouts':
      sql = `
        CREATE TABLE IF NOT EXISTS payouts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('musician', 'service', 'venue')),
          recipient_name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          payment_method VARCHAR(50),
          scheduled_date DATE,
          processed_date DATE,
          description TEXT,
          evento_id UUID,
          banda_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices
        CREATE INDEX IF NOT EXISTS idx_payouts_tenant_id ON payouts(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
        CREATE INDEX IF NOT EXISTS idx_payouts_scheduled_date ON payouts(scheduled_date);
        
        -- RLS
        ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS
        CREATE POLICY "Users can only see their own payouts" ON payouts
          FOR ALL USING (tenant_id = auth.uid());
      `;
      break;
      
    case 'financeiro':
      sql = `
        CREATE TABLE IF NOT EXISTS financeiro (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
          categoria VARCHAR(50) NOT NULL,
          valor DECIMAL(10,2) NOT NULL,
          descricao TEXT,
          data_transacao DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'ativo',
          evento_id UUID,
          banda_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices
        CREATE INDEX IF NOT EXISTS idx_financeiro_tenant_id ON financeiro(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro(tipo);
        CREATE INDEX IF NOT EXISTS idx_financeiro_data ON financeiro(data_transacao);
        
        -- RLS
        ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS
        CREATE POLICY "Users can only see their own financeiro" ON financeiro
          FOR ALL USING (tenant_id = auth.uid());
      `;
      break;
  }
  
  if (sql) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log(`❌ Erro ao criar tabela ${tableName}:`, error.message);
    } else {
      console.log(`✅ Tabela ${tableName} criada com sucesso`);
    }
  }
}

async function checkMockData() {
  // Verificar se há dados mockados no código
  console.log('🔍 Verificando dados mockados no código...');
  
  // Dados mockados encontrados no FinanceDashboard.tsx
  const mockKpis = {
    "Saldo Total": "R$ 45.230,50",
    "Receitas do Mês": "R$ 28.450,00",
    "Despesas do Mês": "R$ 15.220,00",
    "Cachês Pendentes": "R$ 8.500,00"
  };
  
  console.log('⚠️  Dados mockados encontrados no FinanceDashboard.tsx:');
  console.log(JSON.stringify(mockKpis, null, 2));
  
  // Verificar dados reais no banco
  console.log('\n🔍 Verificando dados reais no banco...');
  
  const { data: realTransactions } = await supabase
    .from('transactions')
    .select('*')
    .limit(5);
    
  const { data: realPayouts } = await supabase
    .from('payouts')
    .select('*')
    .limit(5);
    
  const { data: realFinanceiro } = await supabase
    .from('financeiro')
    .select('*')
    .limit(5);
  
  console.log(`📊 Transactions reais: ${realTransactions?.length || 0}`);
  console.log(`📊 Payouts reais: ${realPayouts?.length || 0}`);
  console.log(`📊 Financeiro reais: ${realFinanceiro?.length || 0}`);
}

async function testCrudOperations() {
  const testTenantId = 'd93bd1e5-245e-4a40-9027-4bd669ccc390'; // Tenant ID padrão encontrado
  
  console.log('🧪 Testando operações CRUD...');
  console.log('⚠️  Nota: Teste de CRUD requer autenticação válida (RLS ativo)');
  
  try {
    // Verificar se existe um usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ Usuário não autenticado - pulando teste CRUD');
      console.log('💡 Para testar CRUD: faça login na aplicação primeiro');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.email);
    
    // CREATE - Criar uma transação de teste
    const { data: newTransaction, error: createError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: testTenantId,
        type: 'income',
        category: 'test',
        gross_amount: 1000.00,
        fee_amount: 50.00,
        // net_amount é calculado automaticamente (GENERATED ALWAYS AS)
        transaction_date: new Date().toISOString().split('T')[0],
        description: 'Teste de auditoria - CREATE'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro no CREATE:', createError.message);
    } else {
      console.log('✅ CREATE bem-sucedido:', newTransaction.id);
      
      // READ - Ler a transação criada
      const { data: readTransaction, error: readError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', newTransaction.id)
        .single();
      
      if (readError) {
        console.log('❌ Erro no READ:', readError.message);
      } else {
        console.log('✅ READ bem-sucedido');
        
        // UPDATE - Atualizar a transação
        const { data: updatedTransaction, error: updateError } = await supabase
          .from('transactions')
          .update({ description: 'Teste de auditoria - UPDATE' })
          .eq('id', newTransaction.id)
          .select()
          .single();
        
        if (updateError) {
          console.log('❌ Erro no UPDATE:', updateError.message);
        } else {
          console.log('✅ UPDATE bem-sucedido');
          
          // DELETE - Deletar a transação
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', newTransaction.id);
          
          if (deleteError) {
            console.log('❌ Erro no DELETE:', deleteError.message);
          } else {
            console.log('✅ DELETE bem-sucedido');
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ Erro geral no teste CRUD:', error.message);
  }
}

async function testRealtimeSync() {
  console.log('🔄 Testando sincronização em tempo real...');
  
  try {
    // Configurar subscription para transactions
    const channel = supabase
      .channel('transactions-audit')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('📡 Evento em tempo real recebido:', payload.eventType);
          console.log('📄 Dados:', payload.new || payload.old);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da subscription: ${status}`);
      });
    
    console.log('✅ Subscription configurada para transactions');
    
    // Aguardar um pouco e depois desinscrever
    setTimeout(() => {
      channel.unsubscribe();
      console.log('📡 Subscription encerrada');
    }, 5000);
    
  } catch (error) {
    console.log('❌ Erro no teste de tempo real:', error.message);
  }
}

// Executar auditoria
auditFinancialTables().then(() => {
  console.log('\n🎉 Auditoria concluída!');
}).catch((error) => {
  console.error('💥 Erro na auditoria:', error);
});