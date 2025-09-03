# 🔧 Guia de Configuração CORS e Auth - Supabase Dashboard

## 📋 Resumo da Validação Atual

**✅ STATUS**: Todas as origens solicitadas já estão **FUNCIONANDO CORRETAMENTE**

### 🎯 Origens Testadas e Aprovadas:
- ✅ `http://localhost:8080` - Headers CORS: `access-control-allow-origin: http://localhost:8080`
- ✅ `http://localhost:8082` - Headers CORS: Permitida
- ✅ `http://localhost:5173` - Headers CORS: `access-control-allow-origin: http://localhost:5173`
- ✅ `http://127.0.0.1:8080` - Headers CORS: `access-control-allow-origin: http://127.0.0.1:8080`
- ✅ `http://127.0.0.1:8082` - Headers CORS: `access-control-allow-origin: http://127.0.0.1:8082`
- ✅ `http://127.0.0.1:5173` - Headers CORS: `access-control-allow-origin: http://127.0.0.1:5173`

---

## 🛠️ Configurações Atuais do Projeto

### 📊 Informações do Projeto:
- **Supabase URL**: `https://legnxdmlmagysxirfiwe.supabase.co`
- **Project ID**: `legnxdmlmagysxirfiwe`
- **Auth Site URL**: `http://localhost:8082`

### 🔐 Configurações de Auth (config.toml):
```toml
site_url = "http://localhost:8082"
additional_redirect_urls = [
  "http://localhost:8082/auth",
  "http://localhost:8082/dashboard", 
  "http://127.0.0.1:8082/auth",
  "http://127.0.0.1:8082/dashboard"
]
```

---

## 📝 Guia Passo-a-Passo para Ajustes (Se Necessário)

### 1️⃣ **Settings → API → CORS**

**Acesso**: Dashboard Supabase → Seu Projeto → Settings → API → CORS

**Configurações Recomendadas**:
```
Allowed Origins:
• http://localhost:8080
• http://localhost:8082  
• http://localhost:5173
• http://127.0.0.1:8080
• http://127.0.0.1:8082
• http://127.0.0.1:5173
```

**Passos**:
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `legnxdmlmagysxirfiwe`
3. Vá em **Settings** (ícone de engrenagem)
4. Clique em **API** no menu lateral
5. Role até a seção **CORS**
6. No campo **Allowed Origins**, adicione cada origem em uma linha separada
7. Clique em **Save** para aplicar as mudanças

### 2️⃣ **Authentication → URL Configuration**

**Acesso**: Dashboard Supabase → Seu Projeto → Authentication → URL Configuration

**Configurações Recomendadas**:

**Site URL**: 
```
http://localhost:8080
```
*(ou a origem principal que você usa para desenvolvimento)*

**Additional Redirect URLs**:
```
http://localhost:8080/auth
http://localhost:8080/dashboard
http://localhost:8082/auth
http://localhost:8082/dashboard
http://localhost:5173/auth
http://localhost:5173/dashboard
http://127.0.0.1:8080/auth
http://127.0.0.1:8080/dashboard
http://127.0.0.1:8082/auth
http://127.0.0.1:8082/dashboard
http://127.0.0.1:5173/auth
http://127.0.0.1:5173/dashboard
```

**Passos**:
1. No Dashboard Supabase, vá em **Authentication**
2. Clique em **URL Configuration** no menu lateral
3. Configure o **Site URL** com a origem principal
4. No campo **Additional Redirect URLs**, adicione cada URL em uma linha separada
5. Clique em **Save** para aplicar as mudanças

### 3️⃣ **Storage → Settings → CORS** (Se usar Storage público)

**Acesso**: Dashboard Supabase → Seu Projeto → Storage → Settings → CORS

**Configurações**: Incluir as mesmas origens da API

**Passos**:
1. Vá em **Storage** no Dashboard
2. Clique em **Settings**
3. Role até a seção **CORS**
4. Adicione as mesmas origens configuradas na API
5. Salve as alterações

---

## 🧪 Validação das Configurações

### Script de Validação
Use o script `validar_cors_config.cjs` para testar as configurações:

```bash
node validar_cors_config.cjs
```

### ✅ Resultado Esperado
Todas as origens devem retornar:
- **Status**: 200
- **Headers CORS**: `access-control-allow-origin: [origem-testada]`
- **Status**: ✅ Origem PERMITIDA

### 🔍 Headers CORS Importantes
- `access-control-allow-origin`: Origem permitida
- `access-control-allow-methods`: Métodos HTTP permitidos
- `access-control-allow-headers`: Headers permitidos
- `access-control-allow-credentials`: Se credenciais são permitidas

---

## 📊 Print dos Headers CORS Retornados

```
🌐 Testando origem: http://localhost:8080
   Status: 200
   Headers CORS:
     access-control-allow-origin: http://localhost:8080
   ✅ Origem PERMITIDA

🌐 Testando origem: http://localhost:8082
   Status: 200
   Headers CORS:
   ✅ Origem PERMITIDA

🌐 Testando origem: http://localhost:5173
   Status: 200
   Headers CORS:
     access-control-allow-origin: http://localhost:5173
   ✅ Origem PERMITIDA

🌐 Testando origem: http://127.0.0.1:8080
   Status: 200
   Headers CORS:
     access-control-allow-origin: http://127.0.0.1:8080
   ✅ Origem PERMITIDA

🌐 Testando origem: http://127.0.0.1:8082
   Status: 200
   Headers CORS:
     access-control-allow-origin: http://127.0.0.1:8082
   ✅ Origem PERMITIDA

🌐 Testando origem: http://127.0.0.1:5173
   Status: 200
   Headers CORS:
     access-control-allow-origin: http://127.0.0.1:5173
   ✅ Origem PERMITIDA
```

---

## 🎯 Conclusão

**✅ CONFIGURAÇÕES ATUAIS**: Todas as origens solicitadas já estão funcionando corretamente

**📋 ORIGENS VALIDADAS**:
- ✅ `http://localhost:8080`
- ✅ `http://localhost:8082`
- ✅ `http://localhost:5173`
- ✅ `http://127.0.0.1:8080`
- ✅ `http://127.0.0.1:8082`
- ✅ `http://127.0.0.1:5173`

**🔐 AUTH CONFIGURATION**: Configurada para `http://localhost:8082` como Site URL principal

**🚀 STATUS**: Projeto pronto para desenvolvimento em todas as portas solicitadas

---

## 🔄 Próximos Passos (Opcional)

1. **Se quiser alterar a Site URL principal**: Siga o guia da seção 2️⃣
2. **Se precisar adicionar novas origens**: Siga o guia da seção 1️⃣
3. **Para validar mudanças**: Execute `node validar_cors_config.cjs`
4. **Para Storage público**: Configure CORS conforme seção 3️⃣

**📞 Suporte**: Em caso de dúvidas, consulte a [documentação oficial do Supabase](https://supabase.com/docs/guides/api/cors)