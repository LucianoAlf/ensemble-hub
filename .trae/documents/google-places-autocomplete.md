# Funcionalidade de Autocompletar de Endereços - Google Places API

## 1. Visão Geral

A aplicação LA Music Hub possui uma funcionalidade completa de autocompletar para campos de endereço, integrada à API Google Places. Esta funcionalidade permite que usuários digitem o nome de um local e recebam sugestões de estabelecimentos registrados no Google Meu Negócio, facilitando a seleção precisa de endereços.

## 2. Funcionalidades Implementadas

### 2.1 Busca Inteligente
- **Autocompletar em tempo real**: Sugestões aparecem após digitar 3 caracteres
- **Filtros geográficos**: Busca restrita ao Brasil (`componentRestrictions: { country: "br" }`)
- **Tipos de estabelecimentos**: Inclui estabelecimentos comerciais e endereços geocodificados
- **Limite de resultados**: Máximo de 5 sugestões por busca
- **Idioma localizado**: Interface em português brasileiro

### 2.2 Interface de Usuário
- **Campo de busca com ícone**: Ícone de lupa para indicar funcionalidade de busca
- **Loading indicator**: Spinner animado durante carregamento das sugestões
- **Lista de sugestões**: Cards clicáveis com informações estruturadas
- **Formatação de resultados**: Nome principal e endereço secundário separados
- **Ícones visuais**: Ícone de localização (MapPin) para cada sugestão

### 2.3 Dados Retornados
Cada seleção de local retorna:
- **Nome do estabelecimento**: Nome principal do local
- **Endereço completo**: Endereço formatado pelo Google
- **Place ID**: Identificador único do Google Places

## 3. Configuração da API Google Places

### 3.1 Obtenção da API Key
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Places API" no projeto
4. Vá para "Credenciais" e crie uma nova API Key
5. Configure restrições de segurança (opcional mas recomendado):
   - Restrições de aplicativo: HTTP referrers
   - Restrições de API: Places API

### 3.2 Configuração no Projeto
1. Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_GOOGLE_PLACES_API_KEY=sua_api_key_aqui
```

2. Adicione o arquivo `.env.local` ao `.gitignore` (se não estiver):
```gitignore
# Environment variables
.env.local
.env
```

### 3.3 Variáveis de Ambiente
A aplicação utiliza a variável de ambiente:
- `VITE_GOOGLE_PLACES_API_KEY`: Chave da API Google Places

## 4. Uso do Componente LocationAutocomplete

### 4.1 Importação
```typescript
import { LocationAutocomplete } from "@/components/forms/LocationAutocomplete";
```

### 4.2 Interface do Componente
```typescript
interface LocationData {
  name: string;        // Nome do estabelecimento
  address: string;     // Endereço completo
  place_id: string;    // ID único do Google Places
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: string;   // Valor inicial do campo
  initialAddress?: string;    // Endereço inicial (não exibido)
  disabled?: boolean;         // Desabilitar o componente
}
```

### 4.3 Exemplo de Uso
```typescript
const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

const handleLocationSelect = (location: LocationData) => {
  setSelectedLocation(location);
  console.log('Local selecionado:', location);
};

return (
  <LocationAutocomplete
    onLocationSelect={handleLocationSelect}
    initialLocation=""
    disabled={false}
  />
);
```

### 4.4 Integração com Formulários
O componente está integrado no formulário de criação de eventos (`CreateEventDialog.tsx`):

```typescript
const handleLocationSelect = (location: LocationData) => {
  setVenue(location.name);      // Nome do local
  setAddress(location.address); // Endereço completo
};

<LocationAutocomplete
  onLocationSelect={handleLocationSelect}
  initialLocation={venue}
  initialAddress={address}
  disabled={isLoading}
/>
```

## 5. Configurações Técnicas

### 5.1 Configurações da API
- **Região**: Brasil (`region=BR`)
- **Idioma**: Português brasileiro (`language=pt-BR`)
- **Bibliotecas**: Places API (`libraries=places`)
- **Tipos de busca**: `["establishment", "geocode"]`

### 5.2 Otimizações Implementadas
- **Debounce implícito**: Busca apenas após 3 caracteres
- **Cache de serviços**: Reutilização dos serviços Google Maps
- **Carregamento assíncrono**: Script da API carregado dinamicamente
- **Limite de resultados**: Máximo 5 sugestões para performance

### 5.3 Estados do Componente
- **Loading**: Indicador visual durante busca
- **Empty state**: Mensagem quando não há sugestões
- **Error handling**: Tratamento de erros da API
- **Focus/Blur**: Controle de visibilidade das sugestões

## 6. Estrutura de Arquivos

```
src/
├── components/
│   └── forms/
│       └── LocationAutocomplete.tsx  # Componente principal
└── components/
    └── events/
        └── CreateEventDialog.tsx     # Uso do componente
```

## 7. Dependências

### 7.1 Bibliotecas Utilizadas
- **React**: Hooks (useState, useEffect, useRef)
- **Lucide React**: Ícones (MapPin, Search)
- **Shadcn/ui**: Componentes de UI (Input, Label, Button, Card)

### 7.2 APIs Externas
- **Google Maps JavaScript API**: Carregamento dinâmico
- **Google Places API**: AutocompleteService e PlacesService

## 8. Considerações de Segurança

### 8.1 Proteção da API Key
- Nunca commitar a API key no repositório
- Usar variáveis de ambiente para configuração
- Configurar restrições no Google Cloud Console

### 8.2 Restrições Recomendadas
- **HTTP Referrers**: Limitar domínios autorizados
- **API Restrictions**: Apenas Places API
- **Quotas**: Monitorar uso para evitar custos excessivos

## 9. Troubleshooting

### 9.1 Problemas Comuns
- **API key não configurada**: Verificar arquivo `.env.local`
- **Sugestões não aparecem**: Verificar console para erros da API
- **Erro de CORS**: Configurar domínios no Google Cloud Console
- **Limite de quota**: Verificar uso no Google Cloud Console

### 9.2 Debug
```typescript
// Verificar se a API key está carregada
console.log('API Key:', import.meta.env.VITE_GOOGLE_PLACES_API_KEY);

// Verificar se o Google Maps está carregado
console.log('Google Maps loaded:', !!window.google?.maps);
```

## 10. Melhorias Futuras

### 10.1 Funcionalidades Adicionais
- **Geolocalização**: Priorizar resultados próximos ao usuário
- **Histórico**: Salvar locais recentemente selecionados
- **Favoritos**: Permitir salvar locais favoritos
- **Validação**: Verificar se o local ainda existe

### 10.2 Performance
- **Cache local**: Armazenar resultados recentes
- **Debounce configurável**: Permitir ajustar tempo de espera
- **Lazy loading**: Carregar API apenas quando necessário

Esta documentação cobre todos os aspectos da funcionalidade de autocompletar de endereços implementada no LA Music Hub, fornecendo um guia completo para desenvolvedores e usuários.