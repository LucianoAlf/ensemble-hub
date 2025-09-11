import React, { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

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
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: {
                input: string;
                componentRestrictions?: { country: string };
                types?: string[];
              },
              callback: (predictions: PlacePrediction[] | null, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
          };
        };
        importLibrary: (library: string) => Promise<{
          AutocompleteSuggestion?: new (...args: unknown[]) => unknown;
          Place?: new (options: { id: string; requestedLanguage: string }) => {
            fetchFields: (options: { fields: string[] }) => Promise<void>;
            displayName?: string;
            formattedAddress?: string;
            id?: string;
          };
        }>;
      };
    };
  }
}

export function LocationAutocomplete({
  onLocationSelect,
  initialLocation = "",
  initialAddress = "",
  disabled = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(initialLocation);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadGooglePlaces = () => {
      // Verificar se já existe
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps API já disponível');
        setGoogleLoaded(true);
        return;
      }

      // Verificar se script já foi adicionado
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('🔄 Script já existe, aguardando carregamento...');
        // Aguardar carregamento
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            console.log('✅ Google Maps carregado (script existente)');
            setGoogleLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 500);
        
        // Timeout após 10 segundos
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!googleLoaded) {
            console.error('❌ Timeout no carregamento do Google Maps');
          }
        }, 10000);
        return;
      }

      console.log('🔄 Carregando Google Maps API...');

      // Callback global simples
      (window as any).initGoogleMaps = () => {
        console.log('✅ Google Maps carregado via callback');
        setGoogleLoaded(true);
        delete (window as any).initGoogleMaps;
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps&language=pt-BR&region=BR`;
      script.async = true;
      script.defer = true;
      
      script.onerror = (error) => {
        console.error('❌ Erro ao carregar Google Maps:', error);
        delete (window as any).initGoogleMaps;
      };

      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, []);

  const searchPlaces = async (input: string) => {
    if (!googleLoaded || !window.google?.maps?.places || input.length < 3) {
      setPredictions([]);
      return;
    }

    console.log('🔍 Iniciando busca:', { input, googleLoaded });
    setIsLoading(true);

    try {
      // Usar apenas AutocompleteService (mais simples e confiável)
      const service = new window.google.maps.places.AutocompleteService();
      const request = {
        input,
        componentRestrictions: { country: "br" },
        types: ["establishment", "geocode"],
      };

      service.getPlacePredictions(
        request,
        (predictions: PlacePrediction[] | null, status: string) => {
          console.log('📍 Resultado da busca:', { 
            status, 
            predictionsCount: predictions?.length || 0,
            statusOK: status === window.google.maps.places.PlacesServiceStatus.OK 
          });
          
          setIsLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.slice(0, 5));
            console.log('✅ Sugestões carregadas:', predictions.slice(0, 5).map(p => p.structured_formatting.main_text));
          } else {
            console.warn('⚠️ Busca sem resultados:', status);
            setPredictions([]);
          }
        }
      );
    } catch (error) {
      console.error('❌ Erro na busca:', error);
      setIsLoading(false);
      setPredictions([]);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    
    if (value.length >= 3) {
      searchPlaces(value);
    } else {
      setPredictions([]);
    }
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    if (!window.google?.maps?.places) return;

    console.log('📍 Selecionando local:', prediction.structured_formatting.main_text);

    // Usar sempre dados da predição (mais simples e confiável)
    const locationData: LocationData = {
      name: prediction.structured_formatting.main_text,
      address: prediction.description,
      place_id: prediction.place_id,
    };

    console.log('✅ Local selecionado:', locationData);

    setQuery(locationData.name);
    setShowSuggestions(false);
    setPredictions([]);
    onLocationSelect(locationData);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">
        Local do Evento
        <span className="text-destructive ml-1">*</span>
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="location"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Digite o nome do local..."
          className="pl-9 px-3 py-2"
          disabled={disabled}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay para permitir cliques nas sugestões
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        {isLoading && query.length >= 3 && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <Card className="absolute z-50 w-full max-h-60 overflow-y-auto border shadow-lg">
          {predictions.map((prediction) => (
            <Button
              key={prediction.place_id}
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 hover:bg-muted"
              onClick={() => handlePlaceSelect(prediction)}
            >
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </Button>
          ))}
        </Card>
      )}

      {!googleLoaded && (
        <p className="text-sm text-muted-foreground">
          Carregando sugestões de locais...
        </p>
      )}
    </div>
  );
}