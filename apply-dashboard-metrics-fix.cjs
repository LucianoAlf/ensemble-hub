const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://legnxdmlmagysxirflwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzQ2NzQsImV4cCI6MjA1MDA1MDY3NH0.Ql9nWJqFJOdnNhJKJhJKJhJKJhJKJhJKJhJKJhJK';
