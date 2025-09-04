# 🔐 Configuração Google OAuth - Supabase

## 🚨 Problema Identificado

Os erros de login com Google (`net::ERR_ABORTED`, `https://accounts.google.com/jserror`) ocorrem porque:

1. **Variável de ambiente ausente**: `GOOGLE_OAUTH_CLIENT_ID` não estava definida no `.env`
2. **Configuração incompleta**: Google OAuth precisa ser configurado no Google Console
3. **URLs de redirecionamento**: Precisam estar configuradas corretamente

---

## 📋 Passo a Passo para Configurar

### 1️⃣ **Google Cloud Console** (10-15 min)

#### Criar Projeto (se não existir)
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID**

#### Configurar OAuth 2.0
1. Vá em **APIs & Services** → **Credentials**
2. Clique em **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. Configure:
   - **Application type**: Web application
   - **Name**: Ensemble Hub (ou nome de sua escolha)
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8080
     http://localhost:8082
     http://127.0.0.1:8080
     http://127.0.0.1:8082
     ```
   - **Authorized redirect URIs**:
     ```
     https://legnxdmlmagysxirfiwe.supabase.co/auth/v1/callback
     ```

4. **Salve** e copie:
   - **Client ID** (formato: `xxx.apps.googleusercontent.com`)
   - **Client Secret**

### 2️⃣ **Configurar Variáveis de Ambiente**

Edite o arquivo `.env` e substitua os valores placeholder:

```env
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID="SEU_CLIENT_ID_AQUI.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="SEU_CLIENT_SECRET_AQUI"
```

### 3️⃣ **Supabase Dashboard** (5 min)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `legnxdmlmagysxirfiwe`
3. Vá em **Authentication** → **Providers**
4. Configure **Google**:
   - **Enable**: ✅ Ativado
   - **Client ID**: Cole o Client ID do Google
   - **Client Secret**: Cole o Client Secret do Google
5. **Save**

### 4️⃣ **Verificar URLs de Redirecionamento**

No Supabase Dashboard:
1. **Authentication** → **URL Configuration**
2. Confirme que estão configuradas:
   - **Site URL**: `http://localhost:8082`
   - **Additional Redirect URLs**:
     ```
     http://localhost:8080/auth
     http://localhost:8080/dashboard
     http://localhost:8082/auth
     http://localhost:8082/dashboard
     http://127.0.0.1:8080/auth
     http://127.0.0.1:8080/dashboard
     http://127.0.0.1:8082/auth
     http://127.0.0.1:8082/dashboard
     ```

---

## 🧪 Teste da Configuração

### Teste Rápido
1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Acesse `http://localhost:8082/auth`
3. Clique em **"Continuar com Google"**
4. Deve abrir popup/redirecionamento do Google

### Teste Completo (Console do Navegador)
```javascript
// Cole no console do navegador (F12)
const testGoogleAuth = async () => {
  try {
    console.log('🧪 Testando Google OAuth...');
    
    const { data, error } = await window.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Sucesso:', data);
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
};

testGoogleAuth();
```

---

## 🔍 Diagnóstico de Problemas

### Erro: "Invalid client_id"
**Causa**: Client ID incorreto ou não configurado  
**Solução**: Verificar Client ID no Google Console e Supabase

### Erro: "Unauthorized redirect_uri"
**Causa**: URL de redirecionamento não autorizada  
**Solução**: Adicionar URL no Google Console (Authorized redirect URIs)

### Erro: "Access blocked"
**Causa**: App não verificado pelo Google  
**Solução**: Para desenvolvimento, usar "Continue" na tela de aviso

### Erro: "net::ERR_ABORTED"
**Causa**: Configuração incompleta ou Client ID inválido  
**Solução**: Verificar todas as configurações acima

---

## 📝 Checklist de Verificação

- [ ] **Google Console**: Projeto criado
- [ ] **Google Console**: OAuth 2.0 Client configurado
- [ ] **Google Console**: URLs de origem autorizadas
- [ ] **Google Console**: URLs de redirecionamento configuradas
- [ ] **Arquivo .env**: Client ID e Secret configurados
- [ ] **Supabase**: Provider Google habilitado
- [ ] **Supabase**: Client ID e Secret configurados
- [ ] **Supabase**: URLs de redirecionamento configuradas
- [ ] **Teste**: Login com Google funcionando

---

## 🎯 Resultado Esperado

Após configuração completa:
1. ✅ Botão "Continuar com Google" funciona
2. ✅ Popup/redirecionamento do Google abre
3. ✅ Usuário consegue fazer login
4. ✅ Redirecionamento para dashboard funciona
5. ✅ Sessão persistida corretamente

---

## 📞 Próximos Passos

1. **Configure o Google Console** seguindo o passo 1️⃣
2. **Atualize o arquivo .env** com as credenciais reais
3. **Configure o Supabase Dashboard** seguindo o passo 3️⃣
4. **Teste o login** e reporte se ainda há erros

**Tempo estimado**: 20-30 minutos  
**Complexidade**: Média  
**Impacto**: Resolve completamente o login com Google

---

*Última atualização: Janeiro 2025*