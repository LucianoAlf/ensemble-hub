# Guia de Deploy - Ensemble Hub

## Configuração de Variáveis de Ambiente em Produção

### 🔑 Variáveis Necessárias

Configure as seguintes variáveis de ambiente na sua plataforma de deploy:

```env
VITE_SUPABASE_PROJECT_ID=legnxdmlmagysxirfiwe
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ254ZG1sbWFneXN4aXJmaXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4NjYsImV4cCI6MjA3MDMyMDg2Nn0.kvQVnQp3ClhXcaSsNPyLcwNTmB5uLMhrF6tEhwC6qos
VITE_SUPABASE_URL=https://legnxdmlmagysxirfiwe.supabase.co
VITE_GOOGLE_MAPS_API_KEY=AIzaSyB8nN_DMF7GUUud13jgmiMu_39TH4i24uY
```

### 🗺️ Configuração da API do Google Maps

#### Problema: RefererNotAllowedMapError

Este erro ocorre quando a URL do site não está autorizada no Google Cloud Console.

#### Solução:

1. **Acesse o Google Cloud Console:**
   - Vá para [Google Cloud Console](https://console.cloud.google.com/)
   - Selecione seu projeto

2. **Configure as Restrições da API Key:**
   - Navegue para "APIs & Services" > "Credentials"
   - Clique na API Key: `AIzaSyB8nN_DMF7GUUud13jgmiMu_39TH4i24uY`
   - Em "Application restrictions", selecione "HTTP referrers (web sites)"

3. **Adicione os Domínios Autorizados:**
   ```
   https://preview--ensemble-hub.lovable.app/*
   https://*.lovable.app/*
   http://localhost:*
   https://localhost:*
   ```

4. **Salve as alterações**

### 🚀 Plataformas de Deploy

#### Vercel
```bash
# Via CLI
vercel env add VITE_SUPABASE_PROJECT_ID
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_GOOGLE_MAPS_API_KEY

# Ou via Dashboard em Settings > Environment Variables
```

#### Netlify
```bash
# Via CLI
netlify env:set VITE_SUPABASE_PROJECT_ID "legnxdmlmagysxirfiwe"
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
netlify env:set VITE_SUPABASE_URL "https://legnxdmlmagysxirfiwe.supabase.co"
netlify env:set VITE_GOOGLE_MAPS_API_KEY "AIzaSyB8nN_DMF7GUUud13jgmiMu_39TH4i24uY"

# Ou via Dashboard em Site settings > Environment variables
```

### ⚠️ Importante

- **Nunca** commite o arquivo `.env` para o repositório
- Use sempre o arquivo `.env.example` como referência
- Teste as configurações em ambiente de staging antes de produção
- Monitore os logs de erro para identificar problemas de configuração

### 🔧 Troubleshooting

#### Erro: "for development purposes only"
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se a API key está ativa no Google Cloud Console

#### Erro: RefererNotAllowedMapError
- Adicione o domínio de produção às restrições da API key
- Aguarde alguns minutos para as alterações serem propagadas

#### Erro: API key inválida
- Verifique se a API key está correta
- Confirme se as APIs necessárias estão habilitadas no projeto