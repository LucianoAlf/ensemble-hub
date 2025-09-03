const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('=== APLICANDO CORREÇÃO DA FUNÇÃO get_dashboard_metrics ===\n');
  
  // SQL da função corrigida
  const fixSQL = `
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_tenant_id uuid;
    default_tenant_id uuid := 'd93bd1e5-245e-4a40-9027-4bd669ccc390';
    total_bands integer;
    total_events integer;
    total_members integer;
    monthly_revenue numeric;
BEGIN
    -- Obter tenant_id do usuário atual ou usar padrão
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Se não há usuário autenticado, usar tenant_id padrão
    IF user_tenant_id IS NULL THEN
        user_tenant_id := default_tenant_id;
    END IF;
    
    -- Contar bandas ativas
    SELECT COUNT(*)
    INTO total_bands
    FROM public.banda
    WHERE ativo = true
    AND tenant_id = user_tenant_id;
    
    -- Contar eventos do mês atual
    SELECT COUNT(*)
    INTO total_events
    FROM public.evento
    WHERE DATE_TRUNC('month', data_evento) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id;
    
    -- Contar integrantes ativos (CORRIGIDO: usando banda_integrante)
    SELECT COUNT(*)
    INTO total_members
    FROM public.banda_integrante
    WHERE ativo = true
    AND tenant_id = user_tenant_id;
    
    -- Calcular receita mensal
    SELECT COALESCE(SUM(orcamento), 0)
    INTO monthly_revenue
    FROM public.evento
    WHERE DATE_TRUNC('month', data_evento) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id;
    
    -- Retornar métricas
    RETURN json_build_object(
        'total_bands', total_bands,
        'total_events', total_events,
        'total_members', total_members,
        'monthly_revenue', monthly_revenue,
        'tenant_id_used', user_tenant_id
    );
END;
$$;
  `;
  
  try {
    console.log('1. Aplicando correção da função...');
    
    // Executar SQL diretamente
    const { data: sqlResult, error: sqlError } = await supabase
      .from('_temp')
      .select('*')
      .limit(0); // Query dummy para testar conexão
    
    if (sqlError && !sqlError.message.includes('does not exist')) {
      console.error('Erro de conexão:', sqlError);
      return;
    }
    
    console.log('Conexão OK. Tentando executar SQL via RPC...');
    
    // Tentar via fetch direto
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: fixSQL })
    });
    
    if (!response.ok) {
      console.log('RPC não disponível. Tentando método alternativo...');
      
      // Método alternativo: executar partes da função separadamente
      console.log('\n2. Testando função atual...');
      
      const { data: currentResult, error: currentError } = await supabase
        .rpc('get_dashboard_metrics');
      
      console.log('Resultado atual:', currentResult);
      console.log('Erro atual:', currentError);
      
      console.log('\n3. Verificando contagem de integrantes...');
      
      const { data: integrantesCount, error: integrantesError } = await supabase
        .from('banda_integrante')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      
      console.log('Contagem de integrantes ativos:', integrantesCount);
      console.log('Erro na contagem:', integrantesError);
      
      console.log('\n❌ Não foi possível aplicar a correção automaticamente.');
      console.log('\n📋 SOLUÇÃO MANUAL:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o SQL abaixo:');
      console.log('\n' + fixSQL);
      
    } else {
      const result = await response.json();
      console.log('✅ Função corrigida com sucesso!');
      console.log('Resultado:', result);
      
      // Testar a função corrigida
      console.log('\n4. Testando função corrigida...');
      const { data: newResult, error: newError } = await supabase
        .rpc('get_dashboard_metrics');
      
      console.log('Novo resultado:', newResult);
      console.log('Erro:', newError);
    }
    
  } catch (error) {
    console.error('Erro durante a aplicação da correção:', error);
    console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE:');
    console.log(fixSQL);
  }
}

// Executar
applyFix().then(() => {
  console.log('\n=== PROCESSO CONCLUÍDO ===');
}).catch(console.error);