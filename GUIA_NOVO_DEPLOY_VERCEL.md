# 🚀 GUIA: Novo Deploy na Vercel

**Data:** 08/09/2025  
**Motivo:** Projeto atual conectado ao repositório incorreto  
**Repositório Correto:** `https://github.com/LucianoAlf/ensemble-hub.git`

---

## 🎯 PASSO A PASSO

### **1. Criar Novo Projeto na Vercel**

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New"** → **"Project"**
3. Conecte ao GitHub se necessário
4. Procure por: **"LucianoAlf/ensemble-hub"**
5. Clique em **"Import"**

### **2. Configurações do Build**

```
Framework Preset: Vite
Build Command: npm run build  
Output Directory: dist
Install Command: npm install
```

### **3. Variáveis de Ambiente**

Adicione estas variáveis no painel da Vercel:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
```

**⚠️ IMPORTANTE:** Use apenas as chaves públicas (VITE_)

### **4. Deploy**

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Anote a nova URL (ex: `ensemble-hub-abc123.vercel.app`)

---

## ✅ VERIFICAÇÕES PÓS-DEPLOY

### **Logo e Branding**
- [ ] Logo mostra "LA Band Pilot" (não "LA Music Hub")
- [ ] Cores e tema corretos

### **Mobile (Principais Correções)**
- [ ] Menu hambúrguer aparece no mobile
- [ ] Navegação mobile funciona
- [ ] Cards de transação abrem modais
- [ ] Gráficos adaptam altura no mobile

### **Funcionalidades Gerais**
- [ ] Login/logout funciona
- [ ] Dashboard carrega dados
- [ ] Páginas de Bandas, Eventos, Financeiro funcionam

---

## 🔧 CONFIGURAR SUPABASE

Após o deploy, configure no **painel do Supabase**:

**Authentication → URL Configuration:**
```
Site URL: https://sua-nova-url.vercel.app
Redirect URLs:
- https://sua-nova-url.vercel.app
- https://sua-nova-url.vercel.app/auth/callback
- https://sua-nova-url.vercel.app/**
```

---

## 🎉 RESULTADO ESPERADO

Com o novo deploy você terá:
- ✅ Menu mobile funcional
- ✅ Modais adaptativos (drawer no mobile)
- ✅ Cards de transação responsivos
- ✅ Gráficos otimizados para mobile
- ✅ Logo e branding corretos

---

## 🆘 SUPORTE

Se encontrar problemas:
1. Verifique logs no painel da Vercel
2. Confirme variáveis de ambiente
3. Teste em modo incógnito
4. Verifique configuração do Supabase
