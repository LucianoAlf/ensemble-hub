# 🔧 CONFIGURAÇÃO SUPABASE GOOGLE OAUTH

**Data:** 27 de Janeiro de 2025  
**Status:** ⚙️ CONFIGURAÇÃO NECESSÁRIA NO DASHBOARD  

---

## 📋 CREDENCIAIS DISPONÍVEIS

### ✅ **GOOGLE OAUTH CREDENTIALS**
```
Client ID: 854749217414-av2fnopmb3gclfdhn7gt3g0fv7jlkqaa.apps.googleusercontent.com
Client Secret: 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
```

### ✅ **SUPABASE PROJECT**
```
Project ID: legnxdmlmagysxirfiwe
URL: https://legnxdmlmagysxirfiwe.supabase.co
```

---

## 🎯 **PRÓXIMO PASSO: CONFIGURAR SUPABASE DASHBOARD**

### **1. Acessar Supabase Dashboard**
1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto: `legnxdmlmagysxirfiwe`

### **2. Configurar Google Provider**
1. Vá em **Authentication** → **Providers**
2. Encontre **Google** na lista de providers
3. Clique para configurar:
   - **Enable**: ✅ Marque como ativado
   - **Client ID**: `854749217414-av2fnopmb3gclfdhn7gt3g0fv7jlkqaa.apps.googleusercontent.com`
   - **Client Secret**: `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`
4. Clique em **Save**

### **3. Configurar URLs de Redirecionamento**
1. Ainda em **Authentication**, vá em **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:8082`
   - **Additional Redirect URLs** (adicione todas):
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
3. Clique em **Save**

---

## ✅ **CONFIGURAÇÕES JÁ APLICADAS NO CÓDIGO**

### **1. Arquivo .env Configurado**
```env
VITE_SUPABASE_PROJECT_ID="legnxdmlmagysxirfiwe"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://legnxdmlmagysxirfiwe.supabase.co"
VITE_GOOGLE_MAPS_API_KEY="AIzaSyB8nN_DMF7GUUud13jgmiMu_39TH4i24uY"

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=854749217414-av2fnopmb3gclfdhn7gt3g0fv7jlkqaa.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
```

### **2. Supabase Client Atualizado**
- ✅ Removidas credenciais hardcoded
- ✅ Agora usa variáveis de ambiente (`import.meta.env`)
- ✅ Configuração de auth mantida (localStorage, persistSession, autoRefresh)

---

## 🧪 **TESTE APÓS CONFIGURAÇÃO**

### **Teste Manual**
1. Reinicie o servidor: `npm run dev`
2. Acesse: `http://localhost:8082/auth`
3. Clique em **"Continuar com Google"**
4. Deve abrir popup/redirecionamento do Google
5. Após login, deve redirecionar para dashboard

### **Teste no Console (Opcional)**
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

## 📊 **CHECKLIST FINAL**

### **Supabase Dashboard**
- [ ] Google Provider habilitado
- [ ] Client ID configurado
- [ ] Client Secret configurado
- [ ] Site URL configurada
- [ ] Additional Redirect URLs configuradas

### **Teste de Funcionamento**
- [ ] Botão "Continuar com Google" funciona
- [ ] Popup/redirecionamento do Google abre
- [ ] Login completa com sucesso
- [ ] Redirecionamento para dashboard funciona
- [ ] Sessão persistida corretamente

---

## 🎯 **RESULTADO ESPERADO**

Após configurar o Supabase Dashboard:
1. ✅ Login com Google funcionando 100%
2. ✅ Erro 403 resolvido
3. ✅ Redirecionamentos funcionando
4. ✅ Sessão persistida
5. ✅ Sistema de autenticação completo

**Tempo estimado**: 5-10 minutos  
**Complexidade**: Baixa (apenas configuração no dashboard)  
**Impacto**: Resolve completamente o problema de autenticação

---

*Configuração aplicada em: 27 de Janeiro de 2025*
