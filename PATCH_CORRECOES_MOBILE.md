# Patch: Correções Mobile Finais

## Aplicar Manualmente no GitHub

As correções estão prontas localmente mas não conseguimos fazer push. Aplique estas alterações diretamente no GitHub:

### 1. CompleteBandDialog.tsx
**Arquivo:** `src/components/bands/CompleteBandDialog.tsx`

**Localizar linha 555 e 736:**
```tsx
// SUBSTITUIR:
<TabsList className="grid w-full grid-cols-5">

// POR:
<TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
```

**Localizar as TabsTrigger e substituir:**
```tsx
// SUBSTITUIR:
<TabsTrigger value="info">Informações</TabsTrigger>
<TabsTrigger value="members">Integrantes</TabsTrigger>
<TabsTrigger value="repertoire">Repertório</TabsTrigger>
<TabsTrigger value="rider">Rider Técnico</TabsTrigger>
<TabsTrigger value="stage">Mapa de Palco</TabsTrigger>

// POR:
<TabsTrigger value="info" className="text-xs sm:text-sm px-2 py-1">Info</TabsTrigger>
<TabsTrigger value="members" className="text-xs sm:text-sm px-2 py-1">Membros</TabsTrigger>
<TabsTrigger value="repertoire" className="text-xs sm:text-sm px-2 py-1">Repertório</TabsTrigger>
<TabsTrigger value="rider" className="text-xs sm:text-sm px-2 py-1">Rider</TabsTrigger>
<TabsTrigger value="stage" className="text-xs sm:text-sm px-2 py-1">Palco</TabsTrigger>
```

### 2. adaptive-chart.tsx
**Arquivo:** `src/components/ui/adaptive-chart.tsx`

**Localizar as linhas com ResponsiveContainer e substituir:**
```tsx
// SUBSTITUIR:
<ResponsiveContainer width="100%" height="100%">
  {children}
</ResponsiveContainer>

// POR:
<ResponsiveContainer width="100%" height="100%">
  {React.cloneElement(children as React.ReactElement, {
    margin: isMobile 
      ? { top: 20, right: 15, left: 15, bottom: 30 }
      : { top: 20, right: 30, left: 20, bottom: 20 }
  })}
</ResponsiveContainer>
```

### 3. LocationAutocomplete.tsx
**Arquivo:** `src/components/forms/LocationAutocomplete.tsx`

**Localizar handleInputChange e manter simples:**
```tsx
// CERTIFICAR que está assim:
const handleInputChange = (value: string) => {
  setQuery(value);
  setShowSuggestions(true);
  
  if (value.length >= 3) {
    searchPlaces(value);
  } else {
    setPredictions([]);
  }
};
```

## Como Aplicar

1. Vá para https://github.com/LucianoAlf/ensemble-hub
2. Navegue até cada arquivo
3. Clique em "Edit" (ícone lápis)
4. Aplique as alterações acima
5. Commit com mensagem: "fix(mobile): correções finais - tabs responsivas e gráficos otimizados"

## Resultado Esperado

Após aplicar e fazer commit:
- ✅ Tabs do modal de banda responsivas
- ✅ Gráficos com margens otimizadas no mobile
- ✅ Google Places autocomplete funcionando

A Vercel fará deploy automático após o commit.
