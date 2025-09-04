/**
 * Script simplificado para validar a página Financeiro
 */

import { chromium } from 'playwright';

async function validateFinancialPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capturar erros do console
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    console.log('🔍 Navegando para a página Financeiro...');
    await page.goto('http://localhost:8080/financeiro');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000); // Aguardar mais tempo para dados carregarem
    
    console.log('📸 Tirando screenshot da página...');
    await page.screenshot({ path: 'financeiro-screenshot.png', fullPage: true });
    
    console.log('🔍 Verificando se a página carregou...');
    const pageTitle = await page.title();
    console.log(`Título da página: ${pageTitle}`);
    
    // Verificar se há conteúdo na página
    const bodyText = await page.locator('body').textContent();
    const hasFinanceiroContent = bodyText.includes('Financeiro') || bodyText.includes('Dashboard');
    
    console.log(`Conteúdo Financeiro encontrado: ${hasFinanceiroContent ? 'SIM' : 'NÃO'}`);
    
    // Verificar se há valores monetários
    const hasMoneyValues = bodyText.includes('R$');
    console.log(`Valores monetários encontrados: ${hasMoneyValues ? 'SIM' : 'NÃO'}`);
    
    // Verificar abas
    const hasDashboard = bodyText.includes('Dashboard');
    const hasMovimentacoes = bodyText.includes('Movimentações');
    const hasRelatorios = bodyText.includes('Relatórios');
    
    console.log(`Aba Dashboard: ${hasDashboard ? 'SIM' : 'NÃO'}`);
    console.log(`Aba Movimentações: ${hasMovimentacoes ? 'SIM' : 'NÃO'}`);
    console.log(`Aba Relatórios: ${hasRelatorios ? 'SIM' : 'NÃO'}`);
    
    // Verificar valores específicos
    const hasReceitas = bodyText.includes('31.500') || bodyText.includes('31500');
    const hasDespesas = bodyText.includes('8.800') || bodyText.includes('8800');
    const hasSaldo = bodyText.includes('40.300') || bodyText.includes('40300');
    
    console.log(`Receitas (R$ 31.500): ${hasReceitas ? 'SIM' : 'NÃO'}`);
    console.log(`Despesas (R$ 8.800): ${hasDespesas ? 'SIM' : 'NÃO'}`);
    console.log(`Saldo (R$ 40.300): ${hasSaldo ? 'SIM' : 'NÃO'}`);
    
    // Verificar contrapartes (procurar por nomes comuns)
    const contraparteNames = ['Studio', 'Music', 'Band', 'Event', 'Show', 'Concert'];
    let contrapartesFound = 0;
    contraparteNames.forEach(name => {
      if (bodyText.includes(name)) {
        contrapartesFound++;
      }
    });
    
    console.log(`Contrapartes encontradas: ${contrapartesFound}`);
    
    console.log('\n🔍 Verificando erros no console...');
    if (consoleErrors.length === 0) {
      console.log('✅ Nenhum erro encontrado no console!');
    } else {
      console.log('❌ Erros encontrados no console:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n📋 RESUMO DA VALIDAÇÃO:');
    console.log(`✅ Página carrega sem erros: ${consoleErrors.length === 0 ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Conteúdo Financeiro: ${hasFinanceiroContent ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Valores monetários: ${hasMoneyValues ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Valores corretos: ${hasReceitas && hasDespesas && hasSaldo ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Três abas: ${hasDashboard && hasMovimentacoes && hasRelatorios ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Screenshot salvo: financeiro-screenshot.png`);
    
    // Aguardar um pouco para visualização
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Erro durante a validação:', error.message);
  } finally {
    await browser.close();
  }
}

// Executar validação
validateFinancialPage().catch(console.error);