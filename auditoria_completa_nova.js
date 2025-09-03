// AUDITORIA COMPLETA DO SCHEMA PUBLIC - ENSEMBLE HUB
// Baseado no arquivo auditoria.md
// Data: $(date)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 AUDITORIA COMPLETA DO SCHEMA PUBLIC - ENSEMBLE HUB');
console.log('=' .repeat(70));
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Chave configurada: ${SUPABASE_KEY ? 'Sim' : 'Não'}`);
console.log('=' .repeat(70));

// Relatório de auditoria
const relatorio = {
  timestamp: new Date().toISOString(),
  pontos_positivos: [],
  alertas: [],
  pontos_criticos: [],
  patches_sql: []
};

// Função para executar SQL via RPC
async function executarSQL(query, descricao) {
  try {
    console.log(`\n🔍 ${descricao}`);
    console.log('-'.repeat(50));
    
    // Tentar executar via query direta primeiro
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error(`❌ Erro RPC: ${error.message}`);
      return { success: false, error: error.message, data: null };
    }
    
    console.log(`✅ Sucesso: ${data ? (Array.isArray(data) ? data.length : 'OK') : 'Sem dados'}`);
    return { success: true, error: null, data };
  } catch (err) {
    console.error(`❌ Exceção: ${err.message}`);
    return { success: false, error: err.message, data: null };
  }
}

// Função para executar query simples
async function executarQuery(query, descricao) {
  try {
    console.log(`\n🔍 ${descricao}`);
    console.log('-'.repeat(50));
    
    const { data, error } = await supabase.rpc('sql', { query });
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message, data: null };
    }
    
    console.log(`✅ Sucesso: ${data ? (Array.isArray(data) ? data.length : 'OK') : 'Sem dados'}`);
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`📋 Amostra:`, data.slice(0, 2));
    }
    return { success: true, error: null, data };
  } catch (err) {
    console.error(`❌ Exceção: ${err.message}`);
    return { success: false, error: err.message, data: null };
  }
}

// [1] INVENTÁRIO DE SCHEMA
async function auditoria1_InventarioSchema() {
  console.log('\n📊 [1] INVENTÁRIO DE SCHEMA');
  console.log('=' .repeat(70));
  
  // Colunas das tabelas principais
  const queryColunas = `
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
    ORDER BY table_name, ordinal_position;
  `;
  
  const resultColunas = await executarQuery(queryColunas, 'Inventário de colunas das tabelas principais');
  
  // Constraints (PK/FK/UNIQUE)
  const queryConstraints = `
    SELECT tc.table_name, tc.constraint_type, tc.constraint_name,
           kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema
    WHERE tc.table_schema='public'
      AND tc.table_name IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
  `;
  
  const resultConstraints = await executarQuery(queryConstraints, 'Constraints (PK/FK/UNIQUE)');
  
  // Índices
  const queryIndices = `
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
    ORDER BY tablename, indexname;
  `;
  
  const resultIndices = await executarQuery(queryIndices, 'Índices das tabelas');
  
  // Análise dos resultados
  if (resultColunas.success && resultColunas.data && resultColunas.data.length > 0) {
    relatorio.pontos_positivos.push('✅ Schema bem estruturado com tabelas principais identificadas');
    
    // Verificar se todas as tabelas têm tenant_id
    const tabelasComTenant = resultColunas.data.filter(col => col.column_name === 'tenant_id');
    const tabelasUnicas = [...new Set(resultColunas.data.map(col => col.table_name))];
    
    if (tabelasComTenant.length === tabelasUnicas.length) {
      relatorio.pontos_positivos.push('✅ Todas as tabelas implementam multi-tenancy com tenant_id');
    } else {
      relatorio.alertas.push('⚠️ Algumas tabelas podem não ter tenant_id implementado');
      relatorio.patches_sql.push('-- Verificar e adicionar tenant_id nas tabelas que não possuem');
    }
  } else {
    relatorio.pontos_criticos.push('🚨 Falha ao acessar informações do schema');
  }
  
  return {
    colunas: resultColunas,
    constraints: resultConstraints,
    indices: resultIndices
  };
}

// [2] RLS & POLÍTICAS
async function auditoria2_RLSPoliticas() {
  console.log('\n🔒 [2] RLS & POLÍTICAS');
  console.log('=' .repeat(70));
  
  // Verificar RLS habilitado
  const queryRLS = `
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname='public'
      AND tablename IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
    ORDER BY tablename;
  `;
  
  const resultRLS = await executarQuery(queryRLS, 'Status do RLS nas tabelas');
  
  // Políticas existentes
  const queryPoliticas = `
    SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
    ORDER BY tablename, policyname;
  `;
  
  const resultPoliticas = await executarQuery(queryPoliticas, 'Políticas RLS existentes');
  
  // Análise dos resultados
  if (resultRLS.success && resultRLS.data) {
    const tabelasSemRLS = resultRLS.data.filter(t => !t.rowsecurity);
    
    if (tabelasSemRLS.length === 0) {
      relatorio.pontos_positivos.push('✅ RLS habilitado em todas as tabelas principais');
    } else {
      relatorio.pontos_criticos.push(`🚨 RLS desabilitado em: ${tabelasSemRLS.map(t => t.tablename).join(', ')}`);
      tabelasSemRLS.forEach(tabela => {
        relatorio.patches_sql.push(`ALTER TABLE public.${tabela.tablename} ENABLE ROW LEVEL SECURITY;`);
      });
    }
  }
  
  if (resultPoliticas.success && resultPoliticas.data) {
    if (resultPoliticas.data.length > 0) {
      relatorio.pontos_positivos.push(`✅ ${resultPoliticas.data.length} políticas RLS implementadas`);
    } else {
      relatorio.pontos_criticos.push('🚨 Nenhuma política RLS encontrada');
      relatorio.patches_sql.push('-- Implementar políticas RLS baseadas em tenant_id para todas as tabelas');
    }
  }
  
  return {
    rls: resultRLS,
    politicas: resultPoliticas
  };
}

// [3] CONSISTÊNCIA DE TENANT
async function auditoria3_ConsistenciaTenant() {
  console.log('\n🏢 [3] CONSISTÊNCIA DE TENANT');
  console.log('=' .repeat(70));
  
  // Verificar quais tabelas têm tenant_id
  const queryTenantTables = `
    SELECT table_name, bool_or(column_name='tenant_id') AS has_tenant_id
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name IN ('evento','evento_banda','banda','banda_membro','profiles','financeiro','transactions','unidade')
    GROUP BY table_name ORDER BY table_name;
  `;
  
  const resultTenantTables = await executarQuery(queryTenantTables, 'Tabelas com tenant_id');
  
  // Verificar mismatches de tenant_id
  const queryMismatches = `
    SELECT 'evento_banda_vs_evento' AS check, COUNT(*) AS mismatches
    FROM public.evento_banda eb JOIN public.evento e ON e.id=eb.evento_id
    WHERE eb.tenant_id IS DISTINCT FROM e.tenant_id
    UNION ALL
    SELECT 'evento_banda_vs_banda', COUNT(*)
    FROM public.evento_banda eb JOIN public.banda b ON b.id=eb.banda_id
    WHERE eb.tenant_id IS DISTINCT FROM b.tenant_id
    UNION ALL
    SELECT 'banda_membro_vs_banda', COUNT(*)
    FROM public.banda_membro bm JOIN public.banda b ON b.id=bm.banda_id
    WHERE bm.tenant_id IS DISTINCT FROM b.tenant_id
    UNION ALL
    SELECT 'banda_membro_vs_profiles', COUNT(*)
    FROM public.banda_membro bm JOIN public.profiles p ON p.id=bm.profile_id
    WHERE bm.tenant_id IS DISTINCT FROM p.tenant_id;
  `;
  
  const resultMismatches = await executarQuery(queryMismatches, 'Mismatches de tenant_id entre relacionamentos');
  
  // Análise dos resultados
  if (resultTenantTables.success && resultTenantTables.data) {
    const tabelasSemTenant = resultTenantTables.data.filter(t => !t.has_tenant_id);
    
    if (tabelasSemTenant.length === 0) {
      relatorio.pontos_positivos.push('✅ Todas as tabelas implementam tenant_id');
    } else {
      relatorio.alertas.push(`⚠️ Tabelas sem tenant_id: ${tabelasSemTenant.map(t => t.table_name).join(', ')}`);
    }
  }
  
  if (resultMismatches.success && resultMismatches.data) {
    const problemasEncontrados = resultMismatches.data.filter(m => m.mismatches > 0);
    
    if (problemasEncontrados.length === 0) {
      relatorio.pontos_positivos.push('✅ Consistência de tenant_id mantida entre relacionamentos');
    } else {
      problemasEncontrados.forEach(problema => {
        relatorio.pontos_criticos.push(`🚨 ${problema.mismatches} mismatches em ${problema.check}`);
        relatorio.patches_sql.push(`-- Corrigir mismatches em ${problema.check}`);
      });
    }
  }
  
  return {
    tenantTables: resultTenantTables,
    mismatches: resultMismatches
  };
}

// [4] ÓRFÃOS (integridade referencial)
async function auditoria4_Orfaos() {
  console.log('\n🔗 [4] ÓRFÃOS (integridade referencial)');
  console.log('=' .repeat(70));
  
  const queryOrfaos = `
    SELECT 'eb_sem_evento' AS check, COUNT(*) FROM public.evento_banda eb
    WHERE NOT EXISTS (SELECT 1 FROM public.evento e WHERE e.id=eb.evento_id)
    UNION ALL
    SELECT 'eb_sem_banda', COUNT(*) FROM public.evento_banda eb
    WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id=eb.banda_id)
    UNION ALL
    SELECT 'bm_sem_banda', COUNT(*) FROM public.banda_membro bm
    WHERE NOT EXISTS (SELECT 1 FROM public.banda b WHERE b.id=bm.banda_id)
    UNION ALL
    SELECT 'bm_sem_profile', COUNT(*) FROM public.banda_membro bm
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=bm.profile_id);
  `;
  
  const resultOrfaos = await executarQuery(queryOrfaos, 'Verificação de registros órfãos');
  
  // Análise dos resultados
  if (resultOrfaos.success && resultOrfaos.data) {
    const orfaosEncontrados = resultOrfaos.data.filter(o => o.count > 0);
    
    if (orfaosEncontrados.length === 0) {
      relatorio.pontos_positivos.push('✅ Integridade referencial mantida - nenhum registro órfão encontrado');
    } else {
      orfaosEncontrados.forEach(orfao => {
        relatorio.pontos_criticos.push(`🚨 ${orfao.count} registros órfãos em ${orfao.check}`);
        relatorio.patches_sql.push(`-- Limpar registros órfãos em ${orfao.check}`);
      });
    }
  }
  
  return {
    orfaos: resultOrfaos
  };
}

// [5] DATETIME & TIMEZONE
async function auditoria5_DatetimeTimezone() {
  console.log('\n🕐 [5] DATETIME & TIMEZONE');
  console.log('=' .repeat(70));
  
  const queryDatetime = `
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name IN ('evento','profiles')
      AND column_name IN ('inicio','fim','created_at','updated_at')
    ORDER BY table_name, column_name;
  `;
  
  const resultDatetime = await executarQuery(queryDatetime, 'Tipos de data/hora nas tabelas');
  
  // Análise dos resultados
  if (resultDatetime.success && resultDatetime.data) {
    const camposSemTimezone = resultDatetime.data.filter(d => d.data_type === 'timestamp without time zone');
    const camposComTimezone = resultDatetime.data.filter(d => d.data_type === 'timestamp with time zone');
    
    if (camposComTimezone.length > 0) {
      relatorio.pontos_positivos.push(`✅ ${camposComTimezone.length} campos usando timestamptz (com timezone)`);
    }
    
    if (camposSemTimezone.length > 0) {
      relatorio.alertas.push(`⚠️ ${camposSemTimezone.length} campos usando timestamp sem timezone`);
      camposSemTimezone.forEach(campo => {
        relatorio.patches_sql.push(`ALTER TABLE public.${campo.table_name} ALTER COLUMN ${campo.column_name} TYPE timestamptz;`);
      });
    }
  }
  
  return {
    datetime: resultDatetime
  };
}

// [6] RPCs (existência, assinatura, SECURITY, privilégios)
async function auditoria6_RPCs() {
  console.log('\n⚙️ [6] RPCs (existência, assinatura, SECURITY, privilégios)');
  console.log('=' .repeat(70));
  
  // Verificar funções existentes
  const queryFuncoes = `
    SELECT n.nspname AS schema, p.proname AS function,
           pg_get_function_identity_arguments(p.oid) AS args,
           CASE p.prosecdef WHEN TRUE THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('get_evento_full','update_evento_full')
    ORDER BY p.proname;
  `;
  
  const resultFuncoes = await executarQuery(queryFuncoes, 'Funções RPC existentes');
  
  // Verificar privilégios
  const queryPrivilegios = `
    SELECT 'anon' AS role, has_function_privilege('anon','public.get_evento_full(uuid)','EXECUTE') AS can_exec
    UNION ALL
    SELECT 'authenticated', has_function_privilege('authenticated','public.get_evento_full(uuid)','EXECUTE');
  `;
  
  const resultPrivilegios = await executarQuery(queryPrivilegios, 'Privilégios de execução das RPCs');
  
  // Análise dos resultados
  if (resultFuncoes.success && resultFuncoes.data) {
    if (resultFuncoes.data.length >= 2) {
      relatorio.pontos_positivos.push('✅ RPCs principais (get_evento_full, update_evento_full) encontradas');
      
      const funcoesSecurityDefiner = resultFuncoes.data.filter(f => f.security === 'SECURITY DEFINER');
      if (funcoesSecurityDefiner.length > 0) {
        relatorio.alertas.push(`⚠️ ${funcoesSecurityDefiner.length} funções usando SECURITY DEFINER`);
      }
    } else {
      relatorio.pontos_criticos.push('🚨 RPCs principais não encontradas ou incompletas');
      relatorio.patches_sql.push('-- Implementar RPCs get_evento_full e update_evento_full');
    }
  }
  
  return {
    funcoes: resultFuncoes,
    privilegios: resultPrivilegios
  };
}

// [7] PERFORMANCE
async function auditoria7_Performance() {
  console.log('\n⚡ [7] PERFORMANCE');
  console.log('=' .repeat(70));
  
  // Teste de performance simples
  const queryPerformance = `
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT id, titulo, inicio
    FROM public.evento
    WHERE inicio >= now()
    ORDER BY inicio ASC
    LIMIT 10;
  `;
  
  const resultPerformance = await executarQuery(queryPerformance, 'Análise de performance - consulta de eventos');
  
  // Análise básica
  if (resultPerformance.success) {
    relatorio.pontos_positivos.push('✅ Query de eventos executada com sucesso');
  } else {
    relatorio.alertas.push('⚠️ Problemas na execução de queries de performance');
  }
  
  return {
    performance: resultPerformance
  };
}

// Função principal
async function executarAuditoriaCompleta() {
  try {
    console.log('\n🚀 INICIANDO AUDITORIA COMPLETA');
    console.log('=' .repeat(70));
    
    const resultados = {};
    
    // Executar todas as auditorias
    resultados.inventario = await auditoria1_InventarioSchema();
    resultados.rls = await auditoria2_RLSPoliticas();
    resultados.tenant = await auditoria3_ConsistenciaTenant();
    resultados.orfaos = await auditoria4_Orfaos();
    resultados.datetime = await auditoria5_DatetimeTimezone();
    resultados.rpcs = await auditoria6_RPCs();
    resultados.performance = await auditoria7_Performance();
    
    // Gerar relatório final
    console.log('\n📋 RELATÓRIO FINAL DA AUDITORIA');
    console.log('=' .repeat(70));
    
    console.log('\n✅ PONTOS POSITIVOS:');
    relatorio.pontos_positivos.forEach((ponto, index) => {
      console.log(`${index + 1}. ${ponto}`);
    });
    
    console.log('\n⚠️ ALERTAS:');
    relatorio.alertas.forEach((alerta, index) => {
      console.log(`${index + 1}. ${alerta}`);
    });
    
    console.log('\n🚨 PONTOS CRÍTICOS:');
    relatorio.pontos_criticos.forEach((critico, index) => {
      console.log(`${index + 1}. ${critico}`);
    });
    
    console.log('\n🔧 PATCHES SQL SUGERIDOS:');
    relatorio.patches_sql.forEach((patch, index) => {
      console.log(`${index + 1}. ${patch}`);
    });
    
    // Salvar relatório em arquivo
    const relatorioCompleto = {
      ...relatorio,
      resultados_detalhados: resultados
    };
    
    fs.writeFileSync(
      'RELATORIO_AUDITORIA_COMPLETA_NOVA.json',
      JSON.stringify(relatorioCompleto, null, 2)
    );
    
    console.log('\n💾 Relatório salvo em: RELATORIO_AUDITORIA_COMPLETA_NOVA.json');
    console.log('\n🎯 AUDITORIA COMPLETA FINALIZADA!');
    
    return relatorioCompleto;
    
  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error);
    relatorio.pontos_criticos.push(`🚨 Erro durante execução: ${error.message}`);
    return relatorio;
  }
}

// Executar auditoria
executarAuditoriaCompleta().then(resultado => {
  console.log('\n🏁 Auditoria finalizada!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});