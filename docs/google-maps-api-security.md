# Configuração de Segurança para Google Maps API

## Restrições Recomendadas para API Key

### 1. Restrições de Aplicativo
Configure as seguintes restrições no Google Cloud Console:

#### Restrições HTTP (Websites)
```
# Domínios de produção
https://seu-dominio.com/*
https://www.seu-dominio.com/*

# Domínios de desenvolvimento (remover em produção)
http://localhost:*
http://127.0.0.1:*
https://localhost:*
```

#### Restrições de API
Habilite apenas as APIs necessárias:
- Maps JavaScript API
- Places API
- Geocoding API (se necessário)
- Geolocation API (se necessário)

### 2. Configuração no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Navegue para "APIs & Services" > "Credentials"
3. Clique na sua API Key
4. Configure as seguintes restrições:

#### Application Restrictions
- Selecione "HTTP referrers (web sites)"
- Adicione os domínios permitidos:
  ```
  https://seu-dominio.com/*
  https://www.seu-dominio.com/*
  ```

#### API Restrictions
- Selecione "Restrict key"
- Escolha apenas as APIs necessárias:
  - Maps JavaScript API
  - Places API

### 3. Monitoramento de Uso

Configure alertas para:
- Uso excessivo da API
- Requests de domínios não autorizados
- Picos de tráfego anômalos

### 4. Rotação de Chaves

- Rotacione a API key a cada 90 dias
- Mantenha uma chave de backup durante a transição
- Monitore logs durante a rotação

### 5. Implementação no Código

```typescript
// Verificar origem antes de carregar Maps
const allowedOrigins = [
  'https://seu-dominio.com',
  'https://www.seu-dominio.com',
  // Remover em produção:
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const currentOrigin = window.location.origin;
if (!allowedOrigins.includes(currentOrigin)) {
  console.error('Domínio não autorizado para Google Maps');
  return;
}
```

### 6. Variáveis de Ambiente

```bash
# .env.local (desenvolvimento)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_desenvolvimento

# .env.production (produção)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_producao
```

### 7. Checklist de Segurança

- [ ] API Key restrita por domínio
- [ ] Apenas APIs necessárias habilitadas
- [ ] Monitoramento de uso configurado
- [ ] Alertas de segurança ativos
- [ ] Chaves diferentes para dev/prod
- [ ] Rotação de chaves agendada
- [ ] Logs de acesso monitorados

### 8. Resposta a Incidentes

Em caso de uso não autorizado:
1. Revogue a API key imediatamente
2. Gere uma nova chave com restrições mais rígidas
3. Analise logs para identificar a origem
4. Atualize as restrições conforme necessário
5. Documente o incidente

### 9. Configuração de Rate Limiting

Configure limites apropriados:
- Requests por segundo: 50
- Requests por dia: 25,000
- Requests por usuário: 1,000/dia

### 10. Backup e Recuperação

- Mantenha backup das configurações
- Documente todas as restrições aplicadas
- Teste regularmente a funcionalidade
- Tenha plano de contingência para falhas da API
