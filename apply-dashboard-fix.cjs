const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDashboardFix() {
  console.log('=== APLICANDO CORREÇÃO: get_dashboard_metrics ===\n');
  
  const fixSQL = `
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_tenant_id uuid;
    total_bands integer;
    total_events integer;
    total_members integer;
    monthly_revenue numeric;
BEGIN
    -- Obter tenant_id do usuário atual
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Verificar se o usuário tem tenant_id
    IF user_tenant_id IS NULL THEN
        RETURN json_build_object('error', 'User must have a tenant_id');
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
    SELECT COALESCE(SUM(valor), 0)
    INTO monthly_revenue
    FROM public.evento
    WHERE DATE_TRUNC('month', data_evento) = DATE_TRUNC('month', CURRENT_DATE)
    AND tenant_id = user_tenant_id;
    
    -- Retornar métricas
    RETURN json_build_object(
        'total_bands', total_bands,
        'total_events', total_events,
        'total_members', total_members,
        'monthly_revenue', monthly_revenue
    );
END;
$$;
  `;
  
  try {
    console.log('Aplicando correção da função get_dashboard_metrics...');
    
    // Tentar aplicar via RPC se existir uma função de execução SQL
    const { data, error } = await supabase.rpc('exec', { sql: fixSQL });
    
    if (error) {
      console.error('Erro ao aplicar correção via RPC:', error);
      console.log('\nTentando método alternativo...');
      
      // Método alternativo: usar uma query direta
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql: fixSQL })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na requisição HTTP:', errorText);
        console.log('\n❌ Não foi possível aplicar a correção automaticamente.');
        console.log('\n📋 SOLUÇÃO MANUAL:');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o seguinte SQL:');
        console.log('\n' + fixSQL);
        return;
      }
      
      console.log('✅ Correção aplicada com sucesso via HTTP!');
    } else {
      console.log('✅ Correção aplicada com sucesso via RPC!');
    }
    
    // Testar a função corrigida
    console.log('\n=== TESTANDO FUNÇÃO CORRIGIDA ===');
    const { data: testResult, error: testError } = await supabase
      .rpc('get_dashboard_metrics');
    
    if (testError) {
      console.error('Erro ao testar função:', testError);
    } else {
      console.log('Resultado do teste:');
      console.log(JSON.stringify(testResult, null, 2));
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
    console.log('\n📋 SOLUÇÃO MANUAL:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte SQL:');
    console.log('\n' + fixSQL);
  }
}

applyDashboardFix();