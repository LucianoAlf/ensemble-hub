/**
 * Serviço de health checks client-side
 * Fornece status de saúde do sistema para monitoramento
 * Compatível com Vite/React (não Next.js)
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    supabase: boolean;
    network: boolean;
    localStorage: boolean;
  };
}

const startTime = Date.now();

/**
 * Executa health check completo
 */
export async function performHealthCheck(): Promise<HealthResponse> {
  try {
    // Executar health checks básicos
    const checks = {
      supabase: await checkSupabase(),
      network: await checkNetwork(),
      localStorage: checkLocalStorage()
    };

    // Determinar status geral
    const allHealthy = Object.values(checks).every(check => check);
    const someHealthy = Object.values(checks).some(check => check);
    
    let status: HealthResponse['status'];
    if (allHealthy) {
      status = 'healthy';
    } else if (someHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: '1.0.0', // Versão do sistema
      checks
    };

    return response;

  } catch (error) {
    console.error('Erro no health check:', error);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: '1.0.0',
      checks: {
        supabase: false,
        network: false,
        localStorage: false
      }
    };
  }
}

/**
 * Verifica conectividade com o Supabase
 */
async function checkSupabase(): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return false;
    }

    // Fazer uma requisição simples para verificar se o Supabase está acessível
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Verifica conectividade de rede
 */
async function checkNetwork(): Promise<boolean> {
  try {
    if (!navigator.onLine) {
      return false;
    }

    // Tentar fazer uma requisição simples
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true; // Se chegou até aqui, a rede está funcionando
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Verifica localStorage
 */
function checkLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined') {
      return true; // Server-side, assumir OK
    }

    // Testar escrita e leitura
    const testKey = '_health_check_test';
    const testValue = Date.now().toString();
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return retrieved === testValue;
  } catch (error) {
    return false;
  }
}

/**
 * Endpoint simulado para compatibilidade
 * Pode ser usado em um servidor Express se necessário
 */
export function createHealthEndpoint() {
  return async (req: any, res: any) => {
    // Apenas métodos GET e HEAD são permitidos
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', ['GET', 'HEAD']);
      return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
      // Headers de segurança
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Para requisições HEAD, apenas retornar status
      if (req.method === 'HEAD') {
        return res.status(200).end();
      }

      const healthResponse = await performHealthCheck();
      
      // Status HTTP baseado na saúde
      const httpStatus = healthResponse.status === 'unhealthy' ? 503 : 200;
      
      return res.status(httpStatus).json(healthResponse);

    } catch (error) {
      console.error('Erro no health check:', error);
      
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  };
}
