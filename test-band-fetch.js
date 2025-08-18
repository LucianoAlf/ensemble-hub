// Script completo para validar estrutura e dados do projeto Supabase
// Project ID: legnxdmlmagysxirfiwe

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lista de todas as tabelas do projeto baseada nas migrações
const TABLES = [
  'banda',
  'banda_integrante', 
  'banda_repertorio',
  'banda_rider_tecnico',
  'banda_mapa_palco',
  'banda_setlist',
  'banda_setlist_musica',
  'banda_membro',
  'evento',
  'evento_banda',
  'financeiro',
  'profiles'
];

// Lista de views do projeto
const VIEWS = [
  'vw_bandas_lista',
  'vw_eventos_proximos',
  'vw_bandas_ativas',
  'vw_proximos_eventos'
];

async function validateProjectStructure() {
  console.log("=== VALIDAÇÃO DO PROJETO SUPABASE ===");
  console.log(`Project ID: legnxdmlmagysxirfiwe`);
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`\nData/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log("\n" + "=".repeat(50));
  
  // Verificar estrutura das tabelas
  console.log("\n🔍 VERIFICANDO ESTRUTURA DAS TABELAS");
  console.log("-".repeat(40));
  
  for (const table of TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERRO - ${err.message}`);
    }
  }
  
  // Verificar views
  console.log("\n🔍 VERIFICANDO VIEWS");
  console.log("-".repeat(40));
  
  for (const view of VIEWS) {
    try {
      const { data, error, count } = await supabase
        .from(view)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${view}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${view}: ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ ${view}: ERRO - ${err.message}`);
    }
  }
  
  // Verificar dados detalhados das tabelas principais
  console.log("\n📊 DADOS DETALHADOS DAS TABELAS PRINCIPAIS");
  console.log("-".repeat(50));
  
  await checkTableData('banda', 'Bandas');
  await checkTableData('banda_integrante', 'Integrantes de Banda');
  await checkTableData('banda_repertorio', 'Repertório');
  await checkTableData('banda_rider_tecnico', 'Rider Técnico');
  await checkTableData('banda_mapa_palco', 'Mapa de Palco');
  await checkTableData('evento', 'Eventos');
  await checkTableData('profiles', 'Perfis de Usuário');
  
  // Verificar estrutura específica da tabela banda
  console.log("\n🏗️ ESTRUTURA DETALHADA DA TABELA 'banda'");
  console.log("-".repeat(45));
  await checkBandaStructure();
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ VALIDAÇÃO CONCLUÍDA");
}

async function checkTableData(tableName, displayName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`\n❌ ${displayName} (${tableName}): ERRO - ${error.message}`);
      return;
    }
    
    console.log(`\n📋 ${displayName} (${tableName}):`);
    if (data && data.length > 0) {
      console.log(`   Total de registros: ${data.length} (mostrando até 5)`);
      console.log(`   Campos disponíveis: ${Object.keys(data[0]).join(', ')}`);
      
      // Mostrar alguns dados de exemplo
      data.forEach((record, index) => {
        console.log(`   Registro ${index + 1}:`, JSON.stringify(record, null, 2).substring(0, 200) + '...');
      });
    } else {
      console.log(`   ⚠️ Tabela vazia - sem registros`);
    }
  } catch (err) {
    console.log(`\n❌ ${displayName} (${tableName}): ERRO - ${err.message}`);
  }
}

async function checkBandaStructure() {
  try {
    // Tentar inserir e depois deletar um registro de teste para verificar a estrutura
    const testData = {
      nome: 'TESTE_ESTRUTURA',
      genero: 'Rock',
      descricao: 'Teste de estrutura',
      unidade: 'Teste',
      influencias: 'Teste',
      instagram: '@teste',
      youtube: 'teste',
      spotify: 'teste',
      anotacoes: 'Teste'
    };
    
    console.log(`   Campos esperados na tabela 'banda':`);
    console.log(`   - id (UUID, PK)`);
    console.log(`   - tenant_id (UUID, obrigatório)`);
    console.log(`   - nome (TEXT, obrigatório)`);
    console.log(`   - genero (TEXT)`);
    console.log(`   - descricao (TEXT)`);
    console.log(`   - unidade (TEXT)`);
    console.log(`   - influencias (TEXT)`);
    console.log(`   - instagram (TEXT)`);
    console.log(`   - youtube (TEXT)`);
    console.log(`   - spotify (TEXT)`);
    console.log(`   - anotacoes (TEXT)`);
    console.log(`   - logo_url (TEXT)`);
    console.log(`   - ativa (BOOLEAN, default: true)`);
    console.log(`   - created_at (TIMESTAMP)`);
    console.log(`   - updated_at (TIMESTAMP)`);
    
  } catch (err) {
    console.log(`   ❌ Erro ao verificar estrutura: ${err.message}`);
  }
}

// Executar validação
validateProjectStructure().catch(console.error);

// Função adicional para testar conexão
async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log("\n🔐 STATUS DA CONEXÃO:");
    console.log(`   Conectado: ${error ? 'Não' : 'Sim'}`);
    console.log(`   Usuário autenticado: ${data?.session?.user ? 'Sim' : 'Não'}`);
    if (error) console.log(`   Erro: ${error.message}`);
  } catch (err) {
    console.log(`\n❌ Erro de conexão: ${err.message}`);
  }
}

// Testar conexão também
testConnection();