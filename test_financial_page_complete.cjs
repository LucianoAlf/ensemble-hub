// Script completo para testar a página Financeiro
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFinancialPage() {
  console.log('🔍 TESTE COMPLETO DA PÁGINA FINANCEIRO');
  console.log('=' .repeat(50));
  
  let browser;
  try {
    // 1. Verificar se há usuários no sistema
    console.log('\n1. Verificando usuários no sistema...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.log('❌ Erro ao listar usuários:', usersError.message);
    } else {
      console.log(`✅ Encontrados ${users.users.length} usuários`);
      if (users.users.length > 0) {
        console.log('   Primeiro usuário:', users.users[0].email);
      }
    }
    
    // 2. Verificar dados na tabela transactions
    console.log('\n2. Verificando dados na tabela transactions...');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (transError) {
      console.log('❌ Erro ao acessar transactions:', transError.message);
    } else {
      console.log(`✅ Encontradas ${transactions.length} transações`);
      if (transactions.length > 0) {
        const total = transactions.reduce((sum, t) => sum + (t.net_amount || 0), 0);
        console.log(`   Total das primeiras 5: R$ ${total.toFixed(2)}`);
      }
    }
    
    // 3. Testar acesso à página sem autenticação
    console.log('\n3. Testando acesso à página Financeiro...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Interceptar erros do console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Interceptar erros de rede
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    console.log('   Navegando para http://localhost:8080/financeiro...');
    await page.goto('http://localhost:8080/financeiro', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Aguardar um pouco para a página carregar
    await page.waitForTimeout(3000);
    
    // Verificar se foi redirecionado para login
    const currentUrl = page.url();
    console.log(`   URL atual: ${currentUrl}`);
    
    if (currentUrl.includes('/auth')) {
      console.log('⚠️  Redirecionado para página de login (esperado se não autenticado)');
      
      // Tentar fazer login se estivermos na página de auth
      console.log('\n4. Tentando fazer login...');
      
      // Verificar se há campos de login
      const emailField = await page.$('input[type="email"]');
      const passwordField = await page.$('input[type="password"]');
      
      if (emailField && passwordField) {
        console.log('   Campos de login encontrados');
        
        // Tentar com credenciais de teste
        await page.type('input[type="email"]', 'teste@exemplo.com');
        await page.type('input[type="password"]', 'senha123');
        
        // Procurar botão de submit
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          const newUrl = page.url();
          console.log(`   URL após login: ${newUrl}`);
          
          if (newUrl.includes('/financeiro') || newUrl.includes('/dashboard')) {
            console.log('✅ Login bem-sucedido!');
          } else {
            console.log('❌ Login falhou ou redirecionou para outro lugar');
          }
        }
      } else {
        console.log('❌ Campos de login não encontrados');
      }
    } else {
      console.log('✅ Acesso direto à página Financeiro (sem redirecionamento)');
      
      // Verificar conteúdo da página
      console.log('\n4. Verificando conteúdo da página...');
      
      // Verificar se há valores monetários
      const pageContent = await page.content();
      const hasMoneyValues = /R\$\s*[\d.,]+/.test(pageContent);
      console.log(`   Valores monetários encontrados: ${hasMoneyValues ? '✅' : '❌'}`);
      
      // Verificar se há as abas esperadas
      const hasMovimentacoes = pageContent.includes('Movimentações') || pageContent.includes('Transações');
      const hasRelatorios = pageContent.includes('Relatórios');
      console.log(`   Aba Movimentações/Transações: ${hasMovimentacoes ? '✅' : '❌'}`);
      console.log(`   Aba Relatórios: ${hasRelatorios ? '✅' : '❌'}`);
      
      // Verificar contrapartes
      const contraparteMatches = pageContent.match(/contraparte|counterparty/gi);
      console.log(`   Contrapartes encontradas: ${contraparteMatches ? contraparteMatches.length : 0}`);
    }
    
    // 5. Relatório de erros
    console.log('\n5. Relatório de erros:');
    if (consoleErrors.length > 0) {
      console.log('   Erros do console:');
      consoleErrors.forEach(error => console.log(`     - ${error}`));
    } else {
      console.log('   ✅ Nenhum erro no console');
    }
    
    if (networkErrors.length > 0) {
      console.log('   Erros de rede:');
      networkErrors.forEach(error => console.log(`     - ${error}`));
    } else {
      console.log('   ✅ Nenhum erro de rede');
    }
    
    // Tirar screenshot
    await page.screenshot({ path: 'financial_page_test.png', fullPage: true });
    console.log('\n📸 Screenshot salvo como financial_page_test.png');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
testFinancialPage().catch(console.error);