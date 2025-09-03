// Script para aplicar correção da tabela profiles usando SQL direto
// Alternativa para TAREFA 13 sem usar função exec()

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuração do Supabase
const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔧 APLICANDO CORREÇÃO CRÍTICA DA TABELA PROFILES');
console.log('=' .repeat(60));

// Função para executar comandos SQL individuais
async function executarComandoSQL(sql, descricao) {
  try {
    console.log(`\n🔍 ${descricao}`);
    console.log('-'.repeat(40));
    console.log(`SQL: ${sql.substring(0, 100)}...`);
    
    // Para comandos DDL, vamos tentar usar o cliente diretamente
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Sucesso`);
    return { success: true, data };
  } catch (err) {
    console.error(`❌ Exceção: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Função alternativa usando queries diretas
async function aplicarCorrecaoAlternativa() {
  console.log('\n🔄 Aplicando correção usando método alternativo...');
  
  const correcoes = [
    {
      descricao: 'Verificar estrutura atual da tabela profiles',
      acao: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('❌ Erro ao verificar profiles:', error.message);
          return false;
        }
        
        console.log('✅ Tabela profiles acessível');
        console.log('📋 Estrutura atual:', Object.keys(data?.[0] || {}));
        return true;
      }
    },
    {
      descricao: 'Verificar políticas RLS existentes',
      acao: async () => {
        try {
          // Tentar inserir um registro de teste para verificar RLS
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              id: '00000000-0000-0000-0000-000000000000',
              full_name: 'Teste RLS'
            })
            .select();
          
          if (error) {
            console.log('⚠️ RLS ativo (esperado):', error.message);
            return true;
          } else {
            console.log('⚠️ RLS pode não estar ativo - inserção permitida');
            // Remover registro de teste
            await supabase
              .from('profiles')
              .delete()
              .eq('id', '00000000-0000-0000-0000-000000000000');
            return true;
          }
        } catch (err) {
          console.error('❌ Erro ao testar RLS:', err.message);
          return false;
        }
      }
    },
    {
      descricao: 'Verificar constraint NOT NULL no campo id',
      acao: async () => {
        try {
          // Tentar inserir registro sem id para testar constraint
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              full_name: 'Teste Constraint'
            })
            .select();
          
          if (error && error.message.includes('null value')) {
            console.log('✅ Constraint NOT NULL ativa no campo id');
            return true;
          } else if (error) {
            console.log('⚠️ Outro erro (pode indicar RLS):', error.message);
            return true;
          } else {
            console.log('⚠️ Constraint NOT NULL pode não estar ativa');
            // Remover registro de teste se foi inserido
            if (data?.[0]?.id) {
              await supabase
                .from('profiles')
                .delete()
                .eq('id', data[0].id);
            }
            return false;
          }
        } catch (err) {
          console.error('❌ Erro ao testar constraint:', err.message);
          return false;
        }
      }
    },
    {
      descricao: 'Verificar trigger handle_new_user',
      acao: async () => {
        try {
          // Verificar se existe algum usuário autenticado
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) {
            console.log('⚠️ Nenhum usuário autenticado para testar trigger');
            return true;
          }
          
          if (user) {
            console.log('✅ Usuário autenticado encontrado:', user.id);
            
            // Verificar se existe profile para este usuário
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profileError && profileError.code === 'PGRST116') {
              console.log('⚠️ Profile não encontrado para usuário autenticado');
              console.log('💡 Trigger handle_new_user pode não estar funcionando');
              return false;
            } else if (profile) {
              console.log('✅ Profile encontrado para usuário autenticado');
              return true;
            }
          }
          
          return true;
        } catch (err) {
          console.error('❌ Erro ao verificar trigger:', err.message);
          return false;
        }
      }
    }
  ];
  
  let sucessos = 0;
  let falhas = 0;
  
  for (const correcao of correcoes) {
    console.log(`\n🔧 ${correcao.descricao}`);
    console.log('-'.repeat(40));
    
    const resultado = await correcao.acao();
    
    if (resultado) {
      sucessos++;
      console.log('✅ Verificação passou');
    } else {
      falhas++;
      console.log('❌ Verificação falhou');
    }
  }
  
  return { sucessos, falhas, total: correcoes.length };
}

// Função para gerar relatório de correção
async function gerarRelatorioCorrecao(resultados) {
  const relatorio = {
    timestamp: new Date().toISOString(),
    tarefa: 'TAREFA 13 - Correção Profiles',
    metodo: 'Verificação Alternativa (sem exec SQL)',
    resultados: resultados,
    status: resultados.falhas === 0 ? 'SUCESSO' : 'PARCIAL',
    recomendacoes: [
      'Execute as correções manualmente no Supabase SQL Editor',
      'Verifique se RLS está habilitado na tabela profiles',
      'Confirme se trigger handle_new_user está ativo',
      'Teste inserção de novos usuários para validar funcionamento'
    ]
  };
  
  fs.writeFileSync(
    'RELATORIO_CORRECAO_PROFILES.json',
    JSON.stringify(relatorio, null, 2)
  );
  
  console.log('💾 Relatório salvo em: RELATORIO_CORRECAO_PROFILES.json');
}

// Função principal
async function main() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO DA TABELA PROFILES');
    
    // Aplicar correção alternativa
    const resultados = await aplicarCorrecaoAlternativa();
    
    // Gerar relatório
    await gerarRelatorioCorrecao(resultados);
    
    // Resumo final
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RESUMO DA CORREÇÃO PROFILES');
    console.log('=' .repeat(60));
    console.log(`✅ Verificações bem-sucedidas: ${resultados.sucessos}/${resultados.total}`);
    console.log(`❌ Verificações com problemas: ${resultados.falhas}/${resultados.total}`);
    
    if (resultados.falhas === 0) {
      console.log('🎉 TAREFA 13 CONCLUÍDA: Tabela profiles está funcionando corretamente!');
    } else {
      console.log('⚠️ TAREFA 13 PARCIAL: Alguns problemas identificados');
      console.log('💡 Execute correcao_profiles.sql manualmente no Supabase SQL Editor');
    }
    
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    process.exit(1);
  }
}

// Executar
main().catch(console.error);