# Guia: Sincronização Vercel com GitHub

## Problema Identificado
- **GitHub:** Commit atual `ba496e7` (correções mobile finais)
- **Vercel:** Deploy usando commit `11daad0` (versão anterior)
- **Status:** Vercel não sincronizada com o repositório

## Soluções para Forçar Deploy Correto

### Método 1: Redeploy Manual na Vercel ⭐ (Recomendado)

1. **Acesse o Dashboard da Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Selecione o projeto `ensemble-hub`

2. **Force Novo Deploy:**
   - Clique na aba **"Deployments"**
   - No último deployment, clique nos **3 pontos (⋯)**
   - Selecione **"Redeploy"**
   - **IMPORTANTE:** Desmarque "Use existing Build Cache"
   - Clique em **"Redeploy"**

3. **Verificar Branch:**
   - Certifique-se que está deployando da branch `main`
   - Confirme que o commit é `ba496e7`

### Método 2: Webhook Manual

1. **Trigger via URL:**
   - Na Vercel, vá em **Settings → Git**
   - Procure por **"Deploy Hooks"**
   - Crie um novo hook se necessário
   - Use o URL do webhook para triggerar deploy

### Método 3: Commit Vazio (Último Recurso)

```bash
# Fazer commit vazio para triggerar
git commit --allow-empty -m "trigger: força deploy das correções mobile"
git push origin main
```

## Verificação Pós-Deploy

Após o deploy bem-sucedido, verificar:

1. **Commit ID na Vercel:**
   - Deve mostrar `ba496e7`
   - Source deve apontar para `main` branch

2. **Funcionalidades Mobile:**
   - ✅ Modal de banda com tabs responsivas
   - ✅ Gráficos com espaçamento otimizado
   - ✅ Google Places autocomplete funcionando

3. **URL de Produção:**
   - https://ensemble-hub-git-main-lucianoalfs-projects.vercel.app

## Possíveis Causas do Problema

- **Cache da Vercel:** Build cache antigo
- **Webhook não disparado:** GitHub não notificou a Vercel
- **Branch incorreta:** Deploy de branch diferente
- **Configuração Git:** Problemas na integração

## Prevenção Futura

1. **Auto-Deploy:** Verificar se está habilitado
2. **Branch Protection:** Configurar corretamente
3. **Webhooks:** Validar funcionamento
4. **Monitoramento:** Acompanhar deployments

---

**Status Atual:** Aguardando redeploy manual na Vercel para sincronizar com commit `ba496e7`
