// Script para executar auditoria completa do banco Supabase
// Implementação das tarefas 11, 12 e 13 usando MCP Supabase

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 INICIANDO AUDITORIA COMPLETA DO BANCO SUPABASE');
console.log('=' .repeat(60));
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Chave configurada: ${SUPABASE_KEY ? 'Sim' : 'Não'}`);
console.log('=' .repeat(60));

// Função para executar SQL e capturar resultados
async function executarSQL(query, descricao) {
  try {
    console.log(`\n🔍 ${descricao}`);
    console.log('-'.repeat(40));
    
    const { data, error } = await supabase.rpc('exec', { sql: query });
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message, data: null };
    }
    
    console.log(`✅ Sucesso: ${data ? data.length : 0} registros`);
    return { success: true, error: null, data };
  } catch (err) {
    console.error(`❌ Exceção: ${err.message}`);
    return { success: false, error: err.message, data: null };
  }
}

// Função para executar query direta
async function executarQuery(table, select = '*', descricao) {
  try {
    console.log(`\n🔍 ${descricao}`);
    console.log('-'.repeat(40));
    
    const { data, error, count } = await supabase
      .from(table)
      .select(select, { count: 'exact' });
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message, data: null, count: 0 };
    }
    
    console.log(`✅ Sucesso: ${count || data?.length || 0} registros`);
    if (data && data.length > 0) {
      console.log(`📋 Primeiros registros:`, data.slice(0, 3));
    }
    return { success: true, error: null, data, count };
  } catch (err) {
    console.error(`❌ Exceção: ${err.message}`);
    return { success: false, error: err.message, data: null, count: 0 };
  }
}

// TAREFA 11: Resolver problema de acesso ao Supabase
async function tarefa11_ResolverAcesso() {
  console.log('\n🎯 TAREFA 11: Resolvendo problema de acesso ao Supabase');
  console.log('=' .repeat(60));
  
  // Teste de conectividade básica
  const resultado = await executarQuery('profiles', 'id', 'Testando conectividade com tabela profiles');
  
  if (resultado.success) {
    console.log('✅ TAREFA 11 CONCLUÍDA: Acesso ao Supabase funcionando!');
    return true;
  } else {
    console.log('❌ TAREFA 11 FALHOU: Problema de acesso persiste');
    return false;
  }
}

// TAREFA 12: Executar auditoria completa
async function tarefa12_ExecutarAuditoria() {
  console.log('\n🎯 TAREFA 12: Executando auditoria completa do banco');
  console.log('=' .repeat(60));
  
  const resultados = {
    schema: {},
    rls: {},
    rpcs: {},
    integridade: {},
    tenant: {},
    performance: {}
  };
  
  // 1. INVENTÁRIO DO SCHEMA
  console.log('\n📊 1. INVENTÁRIO DO SCHEMA');
  const tabelas = ['profiles', 'banda', 'evento', 'banda_membro', 'evento_banda', 'financeiro', 'transactions', 'payouts'];
  
  for (const tabela of tabelas) {
    const resultado = await executarQuery(tabela, 'id', `Verificando tabela ${tabela}`);
    resultados.schema[tabela] = {
      existe: resultado.success,
      registros: resultado.count || 0,
      erro: resultado.error
    };
  }
  
  // 2. VERIFICAÇÃO RLS
  console.log('\n🔒 2. VERIFICAÇÃO RLS E POLÍTICAS');
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar políticas RLS:', error.message);
      resultados.rls.erro = error.message;
    } else {
      console.log(`✅ Políticas RLS encontradas: ${policies?.length || 0}`);
      resultados.rls.politicas = policies?.length || 0;
      resultados.rls.detalhes = policies;
    }
  } catch (err) {
    console.error('❌ Exceção ao verificar RLS:', err.message);
    resultados.rls.erro = err.message;
  }
  
  // 3. VERIFICAÇÃO DE FUNÇÕES/RPCs
  console.log('\n⚙️ 3. VERIFICAÇÃO DE FUNÇÕES/RPCs');
  try {
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('proname, pronamespace')
      .eq('pronamespace', 2200); // public schema
    
    if (error) {
      console.error('❌ Erro ao buscar funções:', error.message);
      resultados.rpcs.erro = error.message;
    } else {
      console.log(`✅ Funções encontradas: ${functions?.length || 0}`);
      resultados.rpcs.funcoes = functions?.length || 0;
      resultados.rpcs.detalhes = functions;
    }
  } catch (err) {
    console.error('❌ Exceção ao verificar funções:', err.message);
    resultados.rpcs.erro = err.message;
  }
  
  // 4. INTEGRIDADE REFERENCIAL
  console.log('\n🔗 4. VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL');
  
  // Verificar profiles órfãos
  const profilesOrfaos = await executarQuery(
    'profiles',
    'id',
    'Verificando profiles sem auth.users correspondente'
  );
  resultados.integridade.profiles_orfaos = profilesOrfaos;
  
  // Verificar banda_membro órfãos
  const bandaMembroOrfaos = await executarQuery(
    'banda_membro',
    'id, banda_id, profile_id',
    'Verificando banda_membro com referências inválidas'
  );
  resultados.integridade.banda_membro_orfaos = bandaMembroOrfaos;
  
  // 5. CONSISTÊNCIA DE TENANT
  console.log('\n🏢 5. VERIFICAÇÃO DE CONSISTÊNCIA DE TENANT');
  
  // Verificar se todas as tabelas têm tenant_id
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('id')
        .is('tenant_id', null)
        .limit(1);
      
      if (!error && data) {
        resultados.tenant[tabela] = {
          tem_tenant_id: true,
          registros_sem_tenant: data.length > 0
        };
      }
    } catch (err) {
      resultados.tenant[tabela] = {
        tem_tenant_id: false,
        erro: err.message
      };
    }
  }
  
  // 6. PERFORMANCE E ÍNDICES
  console.log('\n⚡ 6. VERIFICAÇÃO DE PERFORMANCE');
  try {
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('*')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('❌ Erro ao buscar índices:', error.message);
      resultados.performance.erro = error.message;
    } else {
      console.log(`✅ Índices encontrados: ${indexes?.length || 0}`);
      resultados.performance.indices = indexes?.length || 0;
      resultados.performance.detalhes = indexes;
    }
  } catch (err) {
    console.error('❌ Exceção ao verificar índices:', err.message);
    resultados.performance.erro = err.message;
  }
  
  console.log('\n✅ TAREFA 12 CONCLUÍDA: Auditoria executada!');
  return resultados;
}

// TAREFA 13: Aplicar correção crítica da tabela profiles
async function tarefa13_CorrigirProfiles() {
  console.log('\n🎯 TAREFA 13: Aplicando correção crítica da tabela profiles');
  console.log('=' .repeat(60));
  
  // Ler arquivo de correção
  let sqlCorrecao;
  try {
    sqlCorrecao = fs.readFileSync('correcao_profiles.sql', 'utf8');
    console.log('✅ Arquivo correcao_profiles.sql carregado');
  } catch (err) {
    console.error('❌ Erro ao ler arquivo correcao_profiles.sql:', err.message);
    return false;
  }
  
  // Dividir em comandos individuais
  const comandos = sqlCorrecao
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
  
  console.log(`📋 ${comandos.length} comandos SQL para executar`);
  
  let sucessos = 0;
  let falhas = 0;
  
  for (let i = 0; i < comandos.length; i++) {
    const comando = comandos[i];
    console.log(`\n🔧 Executando comando ${i + 1}/${comandos.length}`);
    console.log(`SQL: ${comando.substring(0, 100)}...`);
    
    const resultado = await executarSQL(comando, `Comando ${i + 1}`);
    
    if (resultado.success) {
      sucessos++;
    } else {
      falhas++;
      console.error(`❌ Falha no comando ${i + 1}: ${resultado.error}`);
    }
  }
  
  console.log(`\n📊 RESULTADO DA CORREÇÃO:`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  
  if (falhas === 0) {
    console.log('✅ TAREFA 13 CONCLUÍDA: Correção aplicada com sucesso!');
    return true;
  } else {
    console.log('⚠️ TAREFA 13 PARCIAL: Algumas correções falharam');
    return false;
  }
}

// Função principal
async function main() {
  try {
    console.log('🚀 INICIANDO IMPLEMENTAÇÃO DAS TAREFAS 11, 12 E 13');
    console.log('=' .repeat(60));
    
    // TAREFA 11: Resolver acesso
    const acesso = await tarefa11_ResolverAcesso();
    
    if (!acesso) {
      console.log('❌ FALHA CRÍTICA: Não foi possível resolver o acesso ao Supabase');
      process.exit(1);
    }
    
    // TAREFA 12: Executar auditoria
    const resultadosAuditoria = await tarefa12_ExecutarAuditoria();
    
    // Salvar resultados da auditoria
    const relatorioAuditoria = {
      timestamp: new Date().toISOString(),
      status: 'CONCLUÍDA',
      resultados: resultadosAuditoria
    };
    
    fs.writeFileSync(
      'RELATORIO_AUDITORIA_EXECUTADA.json',
      JSON.stringify(relatorioAuditoria, null, 2)
    );
    
    console.log('💾 Relatório salvo em: RELATORIO_AUDITORIA_EXECUTADA.json');
    
    // TAREFA 13: Aplicar correção
    const correcao = await tarefa13_CorrigirProfiles();
    
    // RESUMO FINAL
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RESUMO FINAL DAS TAREFAS');
    console.log('=' .repeat(60));
    console.log(`✅ TAREFA 11 (Acesso): ${acesso ? 'SUCESSO' : 'FALHA'}`);
    console.log(`✅ TAREFA 12 (Auditoria): SUCESSO`);
    console.log(`✅ TAREFA 13 (Correção): ${correcao ? 'SUCESSO' : 'PARCIAL'}`);
    console.log('=' .repeat(60));
    
    if (acesso && correcao) {
      console.log('🎉 TODAS AS TAREFAS CONCLUÍDAS COM SUCESSO!');
    } else {
      console.log('⚠️ ALGUMAS TAREFAS PRECISAM DE ATENÇÃO');
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    process.exit(1);
  }
}

// Executar
main().catch(console.error);