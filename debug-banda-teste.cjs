const { createClient } = require('@supabase/supabase-js');

// Substitua pelos seus valores reais do Supabase
const supabase = createClient(
  'https://your-project.supabase.co', // Cole sua URL aqui
  'your-anon-key' // Cole sua chave aqui
);

async function debugBandaTeste() {
  const bandaId = '7caff123-2825-4ee4-ac21-54f1bcb4942f';
  
  console.log('=== DEBUG BANDA TESTE ===');
  console.log('ID da banda:', bandaId);
  
  try {
    // 1. Verificar se existe na view
    console.log('\n1. Verificando na view vw_bandas_lista...');
    const { data: viewData, error: viewError } = await supabase
      .from('vw_bandas_lista')
      .select('*')
      .eq('id', bandaId);
    
    if (viewError) {
      console.error('Erro na view:', viewError);
    } else {
      console.log('Dados na view:', viewData);
    }
    
    // 2. Verificar se existe na tabela banda
    console.log('\n2. Verificando na tabela banda...');
    const { data: tableData, error: tableError } = await supabase
      .from('banda')
      .select('*')
      .eq('id', bandaId);
    
    if (tableError) {
      console.error('Erro na tabela:', tableError);
    } else {
      console.log('Dados na tabela:', tableData);
    }
    
    // 3. Verificar todas as bandas na tabela
    console.log('\n3. Todas as bandas na tabela banda...');
    const { data: allBandas, error: allError } = await supabase
      .from('banda')
      .select('id, nome, ativa')
      .order('nome');
    
    if (allError) {
      console.error('Erro ao buscar todas:', allError);
    } else {
      console.log('Todas as bandas:', allBandas);
    }
    
    // 4. Verificar integrantes da banda teste
    console.log('\n4. Integrantes da banda teste...');
    const { data: integrantes, error: integrantesError } = await supabase
      .from('banda_integrante')
      .select('*')
      .eq('banda_id', bandaId);
    
    if (integrantesError) {
      console.error('Erro nos integrantes:', integrantesError);
    } else {
      console.log('Integrantes encontrados:', integrantes);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugBandaTeste();
