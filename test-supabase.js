import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://legnxdmlmagysxirfiwe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('Testing Supabase client...');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase client created:', !!supabase);
console.log('Supabase from method:', typeof supabase.from);

// Teste simples de consulta
async function testSupabase() {
  try {
    const { data, error } = await supabase
      .from('banda')
      .select('*')
      .limit(1);
    
    console.log('Query result:');
    console.log('Data:', data);
    console.log('Error:', error);
  } catch (err) {
    console.error('Error in query:', err);
  }
}

testSupabase();