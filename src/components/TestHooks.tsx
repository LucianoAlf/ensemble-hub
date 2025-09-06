import React, { useState, useEffect } from 'react';
import { useBands } from '../hooks/useBands';
import { useEvents } from '../hooks/useEvents';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
  count?: number;
}

export function TestHooks() {
  const [bandsResult, setBandsResult] = useState<TestResult | null>(null);
  const [eventsResult, setEventsResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const bandsHook = useBands();
  const eventsHook = useEvents();

  const testBands = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testando useBands...');
      
      const bands = await bandsHook.getBands();
      const bandsForSelect = await bandsHook.getBandsForSelect();
      
      console.log('✅ Bandas carregadas:', bands?.length || 0);
      console.log('✅ Opções de bandas:', bandsForSelect?.length || 0);
      
      setBandsResult({
        success: true,
        data: { bands, bandsForSelect },
        count: bands?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Erro no teste de bandas:', error);
      setBandsResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
    setIsLoading(false);
  };

  const testEvents = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testando useEvents...');
      
      const events = await eventsHook.getEvents();
      const eventsForSelect = await eventsHook.getEventsForSelect();
      const futureEvents = await eventsHook.getFutureEvents();
      
      console.log('✅ Eventos carregados:', events?.length || 0);
      console.log('✅ Opções de eventos:', eventsForSelect?.length || 0);
      console.log('✅ Eventos futuros:', futureEvents?.length || 0);
      
      setEventsResult({
        success: true,
        data: { events, eventsForSelect, futureEvents },
        count: events?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Erro no teste de eventos:', error);
      setEventsResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
    setIsLoading(false);
  };

  const testBoth = async () => {
    await testBands();
    await testEvents();
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste dos Hooks useBands e useEvents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testBands} 
              disabled={isLoading}
              variant="outline"
            >
              Testar useBands
            </Button>
            <Button 
              onClick={testEvents} 
              disabled={isLoading}
              variant="outline"
            >
              Testar useEvents
            </Button>
            <Button 
              onClick={testBoth} 
              disabled={isLoading}
            >
              Testar Ambos
            </Button>
          </div>
          
          {isLoading && (
            <div className="text-blue-600">🔄 Executando testes...</div>
          )}
        </CardContent>
      </Card>

      {bandsResult && (
        <Card>
          <CardHeader>
            <CardTitle className={bandsResult.success ? 'text-green-600' : 'text-red-600'}>
              {bandsResult.success ? '✅' : '❌'} Resultado useBands
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bandsResult.success ? (
              <div>
                <p><strong>Bandas encontradas:</strong> {bandsResult.count}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">Ver dados</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(bandsResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-red-600">
                <strong>Erro:</strong> {bandsResult.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {eventsResult && (
        <Card>
          <CardHeader>
            <CardTitle className={eventsResult.success ? 'text-green-600' : 'text-red-600'}>
              {eventsResult.success ? '✅' : '❌'} Resultado useEvents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsResult.success ? (
              <div>
                <p><strong>Eventos encontrados:</strong> {eventsResult.count}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">Ver dados</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(eventsResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-red-600">
                <strong>Erro:</strong> {eventsResult.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}