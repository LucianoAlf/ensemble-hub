const { createClient } = require('@supabase/supabase-js');

// Usar as credenciais do .env
const supabaseUrl = 'https://legnxdmlmagysxirfiwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDashboardMetrics() {
  try {
    console.log('=== Aplicando correção na função get_dashboard_metrics ===');
    
    // SQL para corrigir a função
    const fixSQL = `
      DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
      
      CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
       RETURNS json
       LANGUAGE plpgsql
       SECURITY DEFINER
       SET search_path = 'public'
      AS $function$
      DECLARE
        v_tenant_id UUID;
        v_result JSON;
      BEGIN
        -- Get user's tenant_id
        SELECT tenant_id INTO v_tenant_id
        FROM public.profiles
        WHERE id = auth.uid();
        
        IF v_tenant_id IS NULL THEN
          RETURN '{"error": "User must have a tenant_id"}'::JSON;
        END IF;
        
        SELECT json_build_object(
          'active_bands', (
            SELECT COUNT(*) FROM public.banda 
            WHERE tenant_id = v_tenant_id AND ativa = true
          ),
          'upcoming_events', (
            SELECT COUNT(*) FROM public.evento 
            WHERE tenant_id = v_tenant_id AND inicio >= now()
          ),
          'total_members', (
            SELECT COUNT(*) FROM public.banda_integrante bi
            JOIN public.banda b ON bi.banda_id = b.id
            WHERE b.tenant_id = v_tenant_id AND bi.ativo = true
          ),
          'monthly_revenue', (
            SELECT COALESCE(SUM(valor), 0) FROM public.financeiro
            WHERE tenant_id = v_tenant_id 
            AND tipo = 'receita'
            AND DATE_TRUNC('month', data_transacao) = DATE_TRUNC('month', CURRENT_DATE)
          )
        ) INTO v_result;
        
        RETURN v_result;
      END;
      $function$;
    `;
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec', { sql: fixSQL });
    
    if (error) {
      console.log('Erro ao aplicar correção:', error.message);
      
      // Tentar uma abordagem alternativa - executar diretamente
      console.log('\n=== Tentando abordagem alternativa ===');
      
      // Primeiro, vamos verificar se conseguimos executar uma query simples
      const { data: testData, error: testError } = await supabase
        .from('banda_integrante')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        console.log('Erro no teste:', testError.message);
      } else {
        console.log('Total de integrantes na tabela banda_integrante:', testData);
      }
      
    } else {
      console.log('Função corrigida com sucesso!');
      
      // Testar a função corrigida
      console.log('\n=== Testando função corrigida ===');
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics');
      
      if (metricsError) {
        console.log('Erro ao testar função:', metricsError.message);
      } else {
        console.log('Métricas do dashboard (corrigidas):', metricsData);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

fixDashboardMetrics();