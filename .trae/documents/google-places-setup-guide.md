# Guia de Configuração - Google Places Autocomplete

## 1. Pré-requisitos

Antes de implementar a funcionalidade de autocompletar de endereços, certifique-se de ter:

- Conta no Google Cloud Platform
- Projeto React com TypeScript
- Vite como build tool
- Componentes Shadcn/ui configurados

## 2. Configuração da API Google Places

### 2.1 Criação do Projeto no Google Cloud

1. **Acesse o Google Cloud Console**
   - Vá para [console.cloud.google.com](https://console.cloud.google.com/)
   - Faça login com sua conta Google

2. **Crie um novo projeto**
   ```bash
   # Ou use um projeto existente
   Projeto: la-music-hub-places
   ```

3. **Ative a API Places**
   - Navegue para "APIs & Services" > "Library"
   - Busque por "Places API"
   - Clique em "Enable"

### 2.2 Criação da API Key

1. **Gere a API Key**
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "API Key"
   - Copie a chave gerada

2. **Configure restrições (Recomendado)**
   ```javascript
   // Restrições de aplicativo
   HTTP referrers (web sites): [
     "localhost:*",
     "127.0.0.1:*",
     "*.seudominio.com/*"
   ]
   
   // Restrições de API
   APIs selecionadas: [
     "Places API"
   ]
   ```

## 3. Configuração do Projeto

### 3.1 Variáveis de Ambiente

1. **Crie o arquivo `.env.local`**
   ```env
   # .env.local
   VITE_GOOGLE_PLACES_API_KEY=AIzaSyC...
   ```

2. **Atualize o `.gitignore`**
   ```gitignore
   # Environment variables
   .env.local
   .env
   *.local
   ```

3. **Validação da configuração**
   ```typescript
   // Verificar se a API key está configurada
   console.log('API Key configured:', !!import.meta.env.VITE_GOOGLE_PLACES_API_KEY);
   ```

### 3.2 Dependências Necessárias

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.400.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-popover": "^1.0.0"
  }
}
```

## 4. Implementação do Componente

### 4.1 Estrutura de Arquivos

```
src/
├── components/
│   └── forms/
│       └── LocationAutocomplete.tsx
├── lib/
│   └── utils.ts
└── types/
    └── location.ts
```

### 4.2 Tipos TypeScript

```typescript
// src/types/location.ts
export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface LocationData {
  name: string;
  address: string;
  place_id: string;
}

export interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: string;
  initialAddress?: string;
  disabled?: boolean;
}
```

### 4.3 Implementação Base

```typescript
// src/components/forms/LocationAutocomplete.tsx
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PlacePrediction, LocationData, LocationAutocompleteProps } from "@/types/location";

export function LocationAutocomplete({
  onLocationSelect,
  initialLocation = "",
  initialAddress = "",
  disabled = false,
}: LocationAutocompleteProps) {
  // Estados do componente
  const [query, setQuery] = useState(initialLocation);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  
  // Refs para serviços do Google
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  // Implementação dos métodos...
  // (Ver arquivo completo no projeto)
}
```

## 5. Integração com Formulários

### 5.1 Uso Básico

```typescript
// Exemplo de uso em um formulário
import { LocationAutocomplete } from "@/components/forms/LocationAutocomplete";

function EventForm() {
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");

  const handleLocationSelect = (location: LocationData) => {
    setVenue(location.name);
    setAddress(location.address);
    console.log('Local selecionado:', location);
  };

  return (
    <form>
      <LocationAutocomplete
        onLocationSelect={handleLocationSelect}
        initialLocation={venue}
        initialAddress={address}
        disabled={false}
      />
      
      {/* Outros campos do formulário */}
    </form>
  );
}
```

### 5.2 Integração com React Hook Form

```typescript
import { useForm, Controller } from "react-hook-form";

interface FormData {
  eventName: string;
  venue: string;
  address: string;
}

function EventFormWithHookForm() {
  const { control, setValue, watch } = useForm<FormData>();
  const venue = watch('venue');
  const address = watch('address');

  const handleLocationSelect = (location: LocationData) => {
    setValue('venue', location.name);
    setValue('address', location.address);
  };

  return (
    <form>
      <LocationAutocomplete
        onLocationSelect={handleLocationSelect}
        initialLocation={venue}
        initialAddress={address}
      />
    </form>
  );
}
```

## 6. Customização e Configuração

### 6.1 Configurações Avançadas

```typescript
// Configurações personalizáveis
const CONFIG = {
  // Configurações da API
  api: {
    language: 'pt-BR',
    region: 'BR',
    componentRestrictions: { country: 'br' },
    types: ['establishment', 'geocode']
  },
  
  // Configurações de UI
  ui: {
    minQueryLength: 3,
    maxResults: 5,
    placeholder: 'Digite o nome do local...',
    loadingText: 'Carregando sugestões...'
  },
  
  // Configurações de performance
  performance: {
    debounceDelay: 300,
    cacheTimeout: 300000
  }
};
```

### 6.2 Personalização Visual

```typescript
// Props adicionais para customização
interface ExtendedLocationAutocompleteProps extends LocationAutocompleteProps {
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  maxResults?: number;
}
```

## 7. Testes e Validação

### 7.1 Testes Manuais

```typescript
// Checklist de testes
const testChecklist = [
  '✓ API key configurada corretamente',
  '✓ Sugestões aparecem após 3 caracteres',
  '✓ Máximo 5 sugestões exibidas',
  '✓ Seleção de local funciona',
  '✓ Callback onLocationSelect é chamado',
  '✓ Loading indicator aparece',
  '✓ Tratamento de erros funciona',
  '✓ Componente desabilitado funciona',
  '✓ Valores iniciais são carregados'
];
```

### 7.2 Debug e Troubleshooting

```typescript
// Função de debug
const debugGooglePlaces = () => {
  console.log('=== Google Places Debug ===');
  console.log('API Key:', import.meta.env.VITE_GOOGLE_PLACES_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
  console.log('Google Maps loaded:', !!window.google?.maps);
  console.log('Places library:', !!window.google?.maps?.places);
  console.log('AutocompleteService:', !!window.google?.maps?.places?.AutocompleteService);
  console.log('PlacesService:', !!window.google?.maps?.places?.PlacesService);
};

// Chame no console do navegador para debug
// debugGooglePlaces();
```

## 8. Problemas Comuns e Soluções

### 8.1 Erros Frequentes

| Erro | Causa | Solução |
|------|-------|----------|
| `API key not configured` | Variável de ambiente não definida | Verificar `.env.local` |
| `CORS error` | Domínio não autorizado | Configurar HTTP referrers no Google Cloud |
| `OVER_QUERY_LIMIT` | Limite de quota excedido | Verificar uso no Google Cloud Console |
| `REQUEST_DENIED` | API key inválida ou restrita | Verificar configurações da API key |
| `Sugestões não aparecem` | Script não carregado | Verificar console para erros |

### 8.2 Soluções de Debug

```typescript
// Verificar carregamento da API
useEffect(() => {
  const checkGoogleMaps = () => {
    if (window.google?.maps?.places) {
      console.log('✓ Google Places API carregada com sucesso');
    } else {
      console.error('✗ Erro ao carregar Google Places API');
    }
  };
  
  // Verificar após 5 segundos
  setTimeout(checkGoogleMaps, 5000);
}, []);
```

## 9. Deployment e Produção

### 9.1 Configuração de Produção

```env
# .env.production
VITE_GOOGLE_PLACES_API_KEY=AIzaSyC...
```

### 9.2 Configurações de Segurança

```javascript
// Configurações recomendadas para produção
const productionConfig = {
  httpReferrers: [
    'https://seudominio.com/*',
    'https://*.seudominio.com/*'
  ],
  quotaLimits: {
    requestsPerDay: 10000,
    requestsPerMinute: 1000
  },
  monitoring: true
};
```

## 10. Monitoramento e Métricas

### 10.1 Métricas Importantes

```typescript
// Métricas para monitorar
const metrics = {
  searchesPerDay: 0,
  selectionsPerDay: 0,
  errorRate: 0,
  averageResponseTime: 0,
  quotaUsage: 0
};
```

### 10.2 Alertas Recomendados

- **Quota próxima do limite**: 80% da quota diária
- **Taxa de erro alta**: > 5% de erros
- **Tempo de resposta alto**: > 2 segundos
- **API key expirada**: Erro REQUEST_DENIED

## 11. Próximos Passos

Após implementar a funcionalidade básica:

1. **Teste em diferentes dispositivos**
2. **Configure monitoramento de uso**
3. **Implemente cache local para melhor performance**
4. **Adicione testes automatizados**
5. **Configure alertas de quota**
6. **Documente casos de uso específicos**

Este guia fornece todas as informações necessárias para implementar e configurar a funcionalidade de autocompletar de endereços com Google Places API no seu projeto.