const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDashboardFix() {
  console.log('🔧 Aplicando correção da função get_dashboard_metrics...');
  
  const fixQuery = `
    -- Corrigir função get_dashboard_metrics
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
        -- Obter tenant_id do usuário atual ou usar um padrão se não autenticado
        SELECT COALESCE(
            (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()),
            'd93bd1e5-245e-4a40-9027-4bd669ccc390'::uuid
        ) INTO user_tenant_id;
        
        -- Contar bandas ativas (CORRIGIDO: usar 'ativa' da tabela banda)
        SELECT COUNT(*)
        INTO total_bands
        FROM public.banda
        WHERE ativa = true  -- CORREÇÃO: era "ativo", agora é "ativa"
        AND tenant_id = user_tenant_id;
        
        -- Contar eventos do mês atual
        SELECT COUNT(*)
        INTO total_events
        FROM public.evento
        WHERE DATE_TRUNC('month', inicio) = DATE_TRUNC('month', CURRENT_DATE)
        AND tenant_id = user_tenant_id;
        
        -- Contar integrantes ativos (CORRETO: usar 'ativo' da tabela banda_integrante)
        SELECT COUNT(*)
        INTO total_members
        FROM public.banda_integrante
        WHERE ativo = true  -- MANTIDO: tabela banda_integrante usa "ativo"
        AND tenant_id = user_tenant_id;
        
        -- Calcular receita mensal (baseada no orçamento dos eventos)
        SELECT COALESCE(SUM(orcamento), 0)
        INTO monthly_revenue
        FROM public.evento
        WHERE DATE_TRUNC('month', inicio) = DATE_TRUNC('month', CURRENT_DATE)
        AND tenant_id = user_tenant_id
        AND orcamento IS NOT NULL;
        
        -- Retornar resultado como JSON
        RETURN json_build_object(
            'total_bands', total_bands,
            'total_events', total_events,
            'total_members', total_members,
            'monthly_revenue', monthly_revenue
        );
    END;
    $$;
    
    -- Conceder permissões
    GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO anon;
  `;
  
  try {
    const { data, error } = await supabase.rpc('sql', { query: fixQuery });
    
    if (error) {
      console.error('❌ Erro ao aplicar correção:', error);
      return;
    }
    
    console.log('✅ Correção aplicada com sucesso!');
    
    // Testar a função corrigida
    console.log('🧪 Testando função corrigida...');
    const { data: testResult, error: testError } = await supabase.rpc('get_dashboard_metrics');
    
    if (testError) {
      console.error('❌ Erro ao testar função:', testError);
    } else {
      console.log('✅ Teste bem-sucedido! Resultado:', testResult);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

// Executar correção
applyDashboardFix().then(() => {
  console.log('🎉 Processo concluído!');
}).catch(err => {
  console.error('💥 Falha no processo:', err);
});