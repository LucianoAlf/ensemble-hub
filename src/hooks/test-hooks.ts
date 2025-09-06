// Arquivo de teste temporário para validar os hooks useBands e useEvents
// Este arquivo será removido após os testes

import { useBands } from './useBands';
import { useEvents } from './useEvents';

// Função de teste para useBands
export async function testUseBands() {
  console.log('🧪 Testando hook useBands...');
  
  try {
    const bandsHook = useBands();
    
    // Teste 1: getBands
    console.log('📋 Testando getBands...');
    const bands = await bandsHook.getBands();
    console.log('✅ getBands executado com sucesso:', bands?.length || 0, 'bandas encontradas');
    
    // Teste 2: getBandsForSelect
    console.log('📋 Testando getBandsForSelect...');
    const bandsForSelect = await bandsHook.getBandsForSelect();
    console.log('✅ getBandsForSelect executado com sucesso:', bandsForSelect?.length || 0, 'opções de bandas');
    
    // Validar estrutura dos dados
    if (bandsForSelect && bandsForSelect.length > 0) {
      const firstBand = bandsForSelect[0];
      const hasRequiredFields = firstBand.id && firstBand.name;
      console.log('✅ Estrutura de dados válida:', hasRequiredFields ? 'Sim' : 'Não');
      console.log('📊 Exemplo de banda:', firstBand);
    }
    
    return { success: true, bandsCount: bands?.length || 0, selectOptionsCount: bandsForSelect?.length || 0 };
    
  } catch (error) {
    console.error('❌ Erro no teste useBands:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Função de teste para useEvents
export async function testUseEvents() {
  console.log('🧪 Testando hook useEvents...');
  
  try {
    const eventsHook = useEvents();
    
    // Teste 1: getEvents
    console.log('📋 Testando getEvents...');
    const events = await eventsHook.getEvents();
    console.log('✅ getEvents executado com sucesso:', events?.length || 0, 'eventos encontrados');
    
    // Teste 2: getEventsForSelect
    console.log('📋 Testando getEventsForSelect...');
    const eventsForSelect = await eventsHook.getEventsForSelect();
    console.log('✅ getEventsForSelect executado com sucesso:', eventsForSelect?.length || 0, 'opções de eventos');
    
    // Teste 3: getFutureEvents
    console.log('📋 Testando getFutureEvents...');
    const futureEvents = await eventsHook.getFutureEvents();
    console.log('✅ getFutureEvents executado com sucesso:', futureEvents?.length || 0, 'eventos futuros');
    
    // Validar estrutura dos dados
    if (eventsForSelect && eventsForSelect.length > 0) {
      const firstEvent = eventsForSelect[0];
      const hasRequiredFields = firstEvent.id && firstEvent.title && firstEvent.date;
      console.log('✅ Estrutura de dados válida:', hasRequiredFields ? 'Sim' : 'Não');
      console.log('📊 Exemplo de evento:', firstEvent);
    }
    
    return { 
      success: true, 
      eventsCount: events?.length || 0, 
      selectOptionsCount: eventsForSelect?.length || 0,
      futureEventsCount: futureEvents?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erro no teste useEvents:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Função principal de teste
export async function runHooksTests() {
  console.log('🚀 Iniciando testes dos hooks useBands e useEvents...');
  console.log('=' .repeat(60));
  
  const bandsResult = await testUseBands();
  console.log('\n' + '=' .repeat(60));
  
  const eventsResult = await testUseEvents();
  console.log('\n' + '=' .repeat(60));
  
  console.log('📊 Resumo dos testes:');
  console.log('- useBands:', bandsResult.success ? '✅ Sucesso' : '❌ Falhou');
  console.log('- useEvents:', eventsResult.success ? '✅ Sucesso' : '❌ Falhou');
  
  if (bandsResult.success && eventsResult.success) {
    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log(`📈 Dados encontrados: ${bandsResult.bandsCount} bandas, ${eventsResult.eventsCount} eventos`);
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
  
  return {
    bandsTest: bandsResult,
    eventsTest: eventsResult,
    allPassed: bandsResult.success && eventsResult.success
  };
}

// Para usar no console do navegador:
// import { runHooksTests } from './src/hooks/test-hooks';
// runHooksTests();