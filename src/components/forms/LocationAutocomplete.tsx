import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LocationData {
  name: string;
  address: string;
  place_id: string;
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: string;
  initialAddress?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

// Extend HTMLElement to include gmpx-place-picker
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any;
      'gmpx-place-picker': any;
    }
  }
}

export function LocationAutocomplete({
  onLocationSelect,
  initialLocation = "",
  initialAddress = "",
  disabled = false,
}: LocationAutocompleteProps) {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackValue, setFallbackValue] = useState(initialLocation);
  const [useWebComponents, setUseWebComponents] = useState(false);
  const placePickerRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      setError("API key do Google Places não configurada");
      console.error("❌ VITE_GOOGLE_PLACES_API_KEY não encontrada");
      return;
    }

    // Check for Web Components support
    if ('customElements' in window) {
      loadExtendedComponentLibrary();
    } else {
      console.warn('⚠️ Web Components não suportados, usando fallback');
      setIsLibraryLoaded(true);
    }
  }, []);

  const loadExtendedComponentLibrary = async () => {
    try {
      // Load Extended Component Library
      if (!document.querySelector('script[src*="@googlemaps/extended-component-library"]')) {
        const script = document.createElement('script');
        script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
        script.type = 'module';
        script.onload = () => {
          setUseWebComponents(true);
          setIsLibraryLoaded(true);
          console.log('✅ Google Extended Component Library carregada');
        };
        script.onerror = () => {
          console.error('❌ Erro ao carregar Extended Component Library');
          setError('Erro ao carregar biblioteca Google Places');
          setIsLibraryLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setUseWebComponents(true);
        setIsLibraryLoaded(true);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setError('Erro ao inicializar Google Places');
      setIsLibraryLoaded(true);
    }
  };

  const handlePlaceChange = (event: any) => {
    const place = event.target.place;
    if (place) {
      const locationData: LocationData = {
        name: place.displayName || place.formattedAddress?.split(',')[0] || '',
        address: place.formattedAddress || '',
        place_id: place.id || ''
      };
      onLocationSelect(locationData);
      console.log('✅ Local selecionado:', locationData);
    }
  };

  const handleFallbackSubmit = () => {
    if (fallbackValue.trim()) {
      const locationData: LocationData = {
        name: fallbackValue,
        address: fallbackValue,
        place_id: `manual_${Date.now()}`
      };
      onLocationSelect(locationData);
    }
  };

  if (!isLibraryLoaded) {
    return (
      <div className="space-y-2">
        <Label htmlFor="location">
          Local do Evento
          <span className="text-destructive ml-1">*</span>
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
          <Input
            placeholder="Carregando Google Places..."
            className="pl-10"
            disabled
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location">
        Local do Evento
        <span className="text-destructive ml-1">*</span>
      </Label>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {useWebComponents && !error ? (
        <div className="relative">
          {/* Google API Loader */}
          <gmpx-api-loader 
            key={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
            solution-channel="GMP_GE_placepicker_v2"
          />
          
          {/* Place Picker */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
              <MapPin className="h-4 w-4" />
            </div>
            <gmpx-place-picker
              ref={placePickerRef}
              placeholder="Digite o nome do local ou endereço..."
              country="br"
              language="pt-BR"
              onGmpxPlacechange={handlePlaceChange}
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: '40px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) - 2px)',
                backgroundColor: 'hsl(var(--background))',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            id="location"
            type="text"
            value={fallbackValue}
            onChange={(e) => setFallbackValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFallbackSubmit()}
            placeholder="Digite o local do evento..."
            className="pl-10"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}