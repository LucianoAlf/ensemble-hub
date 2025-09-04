// =====================================================
// TESTE DE AUTENTICAÇÃO FRONTEND - Supabase
// =====================================================
// Execute este script no console do navegador para testar a autenticação

// Configuração do Supabase (substitua pelas suas credenciais)
const SUPABASE_URL = 'https://legnxdmlmagysxirfiwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ0NzQsImV4cCI6MjA1MDU1MDQ3NH0.Ej5zOGJhNjJhNjJhNjJhNjJhNjJhNjJhNjJhNjJhNjJh';

// Credenciais de teste
const TEST_USER = {
    email: 'teste@ensemblehub.com',
    password: 'TesteEnsemble123!'
};

// =====================================================
// FUNÇÕES DE TESTE
// =====================================================

// Função para testar login
async function testLogin() {
    console.log('🔐 Testando login...');
    
    try {
        // Verificar se o Supabase está disponível
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client não encontrado. Certifique-se de que está na página do app.');
            return false;
        }
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        if (error) {
            console.error('❌ Erro no login:', error.message);
            return false;
        }
        
        console.log('✅ Login realizado com sucesso!');
        console.log('👤 Usuário:', data.user.email);
        console.log('🔑 Token:', data.session?.access_token ? 'Presente' : 'Ausente');
        
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado no login:', err);
        return false;
    }
}

// Função para testar sessão atual
async function testCurrentSession() {
    console.log('📋 Verificando sessão atual...');
    
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Erro ao obter sessão:', error.message);
            return false;
        }
        
        if (!session) {
            console.log('⚠️ Nenhuma sessão ativa encontrada');
            return false;
        }
        
        console.log('✅ Sessão ativa encontrada!');
        console.log('👤 Usuário:', session.user.email);
        console.log('🕒 Expira em:', new Date(session.expires_at * 1000).toLocaleString());
        
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao verificar sessão:', err);
        return false;
    }
}

// Função para testar acesso ao perfil
async function testProfileAccess() {
    console.log('👤 Testando acesso ao perfil...');
    
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', (await window.supabase.auth.getUser()).data.user?.id);
        
        if (error) {
            console.error('❌ Erro ao acessar perfil:', error.message);
            return false;
        }
        
        if (!data || data.length === 0) {
            console.log('⚠️ Perfil não encontrado');
            return false;
        }
        
        console.log('✅ Perfil acessado com sucesso!');
        console.log('🏢 Tenant ID:', data[0].tenant_id);
        console.log('📧 Email:', data[0].email);
        
        return data[0];
    } catch (err) {
        console.error('❌ Erro inesperado ao acessar perfil:', err);
        return false;
    }
}

// Função para testar acesso às tabelas financeiras
async function testFinancialTablesAccess() {
    console.log('💰 Testando acesso às tabelas financeiras...');
    
    const tables = ['transactions', 'payouts', 'financeiro'];
    const results = {};
    
    for (const table of tables) {
        try {
            console.log(`📊 Testando tabela: ${table}`);
            
            const { data, error, count } = await window.supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.error(`❌ Erro ao acessar ${table}:`, error.message);
                results[table] = { success: false, error: error.message };
            } else {
                console.log(`✅ ${table}: ${count} registros encontrados`);
                results[table] = { success: true, count };
            }
        } catch (err) {
            console.error(`❌ Erro inesperado ao acessar ${table}:`, err);
            results[table] = { success: false, error: err.message };
        }
    }
    
    return results;
}

// Função para testar inserção (com rollback)
async function testInsertTransaction() {
    console.log('💳 Testando inserção de transação...');
    
    try {
        // Obter tenant_id do usuário
        const profile = await testProfileAccess();
        if (!profile) {
            console.error('❌ Não foi possível obter perfil do usuário');
            return false;
        }
        
        // Tentar inserir transação
        const testTransaction = {
            tenant_id: profile.tenant_id,
            tipo: 'receita',
            valor: 1.00,
            descricao: 'Teste de inserção - ' + new Date().toISOString(),
            data_transacao: new Date().toISOString().split('T')[0]
        };
        
        const { data, error } = await window.supabase
            .from('transactions')
            .insert([testTransaction])
            .select();
        
        if (error) {
            console.error('❌ Erro ao inserir transação:', error.message);
            return false;
        }
        
        console.log('✅ Transação inserida com sucesso!');
        console.log('📝 ID da transação:', data[0].id);
        
        // Remover a transação de teste
        const { error: deleteError } = await window.supabase
            .from('transactions')
            .delete()
            .eq('id', data[0].id);
        
        if (deleteError) {
            console.warn('⚠️ Erro ao remover transação de teste:', deleteError.message);
        } else {
            console.log('🗑️ Transação de teste removida');
        }
        
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao testar inserção:', err);
        return false;
    }
}

// Função para testar logout
async function testLogout() {
    console.log('🚪 Testando logout...');
    
    try {
        const { error } = await window.supabase.auth.signOut();
        
        if (error) {
            console.error('❌ Erro no logout:', error.message);
            return false;
        }
        
        console.log('✅ Logout realizado com sucesso!');
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado no logout:', err);
        return false;
    }
}

// =====================================================
// FUNÇÃO PRINCIPAL DE TESTE
// =====================================================

async function runAuthTests() {
    console.log('🚀 Iniciando testes de autenticação...');
    console.log('=' .repeat(50));
    
    const results = {
        currentSession: false,
        login: false,
        profileAccess: false,
        financialAccess: {},
        insertTest: false,
        logout: false
    };
    
    // 1. Verificar sessão atual
    results.currentSession = await testCurrentSession();
    console.log('');
    
    // 2. Se não há sessão, fazer login
    if (!results.currentSession) {
        results.login = await testLogin();
        console.log('');
    } else {
        results.login = true;
    }
    
    // 3. Testar acesso ao perfil
    if (results.login || results.currentSession) {
        results.profileAccess = await testProfileAccess();
        console.log('');
    }
    
    // 4. Testar acesso às tabelas financeiras
    if (results.profileAccess) {
        results.financialAccess = await testFinancialTablesAccess();
        console.log('');
    }
    
    // 5. Testar inserção
    if (results.profileAccess) {
        results.insertTest = await testInsertTransaction();
        console.log('');
    }
    
    // 6. Testar logout
    results.logout = await testLogout();
    console.log('');
    
    // Resumo dos resultados
    console.log('📊 RESUMO DOS TESTES:');
    console.log('=' .repeat(50));
    console.log('🔐 Login:', results.login ? '✅ PASS' : '❌ FAIL');
    console.log('👤 Acesso ao Perfil:', results.profileAccess ? '✅ PASS' : '❌ FAIL');
    
    Object.entries(results.financialAccess).forEach(([table, result]) => {
        console.log(`💰 ${table}:`, result.success ? `✅ PASS (${result.count} registros)` : `❌ FAIL (${result.error})`);
    });
    
    console.log('💳 Teste de Inserção:', results.insertTest ? '✅ PASS' : '❌ FAIL');
    console.log('🚪 Logout:', results.logout ? '✅ PASS' : '❌ FAIL');
    
    const totalTests = 5 + Object.keys(results.financialAccess).length;
    const passedTests = [results.login, results.profileAccess, results.insertTest, results.logout]
        .filter(Boolean).length + Object.values(results.financialAccess).filter(r => r.success).length;
    
    console.log('');
    console.log(`🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
    
    if (passedTests === totalTests) {
        console.log('🎉 Todos os testes passaram! Autenticação está funcionando corretamente.');
    } else {
        console.log('⚠️ Alguns testes falharam. Verifique a configuração de autenticação.');
    }
    
    return results;
}

// =====================================================
// INSTRUÇÕES DE USO
// =====================================================

console.log('📋 INSTRUÇÕES DE USO:');
console.log('1. Abra o console do navegador na página do Ensemble Hub');
console.log('2. Cole este script completo no console');
console.log('3. Execute: runAuthTests()');
console.log('4. Aguarde os resultados dos testes');
console.log('');
console.log('🔧 Para executar testes individuais:');
console.log('- testCurrentSession() - Verificar sessão atual');
console.log('- testLogin() - Testar login');
console.log('- testProfileAccess() - Testar acesso ao perfil');
console.log('- testFinancialTablesAccess() - Testar tabelas financeiras');
console.log('- testInsertTransaction() - Testar inserção');
console.log('- testLogout() - Testar logout');
console.log('');
console.log('▶️ Execute: runAuthTests() para iniciar todos os testes');