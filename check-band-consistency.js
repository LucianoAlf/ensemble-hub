import { createClient } from '@supabase/supabase-js';

// Valores hardcoded para teste rápido - substitua pelos seus valores reais
const supabase = createClient(
  'https://your-project.supabase.co', // Substitua pela sua URL
  'your-anon-key' // Substitua pela sua chave
);

async function checkInconsistency() {
  console.log('=== VERIFICANDO INCONSISTÊNCIA ENTRE VIEW E TABELA ===');
  
  try {
    // Buscar IDs da view
    const { data: viewData, error: viewError } = await supabase
      .from('vw_bandas_lista')
      .select('id, nome');
    
    if (viewError) {
      console.error('Erro na view:', viewError);
      return;
    }
    
    console.log('IDs na view vw_bandas_lista:', viewData?.map(b => ({ id: b.id, nome: b.nome })));
    
    // Buscar IDs da tabela
    const { data: tableData, error: tableError } = await supabase
      .from('banda')
      .select('id, nome');
      
    if (tableError) {
      console.error('Erro na tabela:', tableError);
      return;
    }
    
    console.log('IDs na tabela banda:', tableData?.map(b => ({ id: b.id, nome: b.nome })));
    
    // Verificar diferenças
    const viewIds = new Set(viewData?.map(b => b.id) || []);
    const tableIds = new Set(tableData?.map(b => b.id) || []);
    
    const onlyInView = viewData?.filter(b => !tableIds.has(b.id)) || [];
    const onlyInTable = tableData?.filter(b => !viewIds.has(b.id)) || [];
    
    console.log('\n=== RESULTADOS ===');
    console.log('Apenas na view (não na tabela):', onlyInView);
    console.log('Apenas na tabela (não na view):', onlyInTable);
    
    if (onlyInView.length === 0 && onlyInTable.length === 0) {
      console.log('✅ Não há inconsistências entre view e tabela');
    } else {
      console.log('❌ Encontradas inconsistências!');
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkInconsistency();
