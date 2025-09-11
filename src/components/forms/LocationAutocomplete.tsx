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
    const loadGooglePlaces = async () => {
      if (window.google && window.google.maps) {
        console.log('🗺️ Google Maps já carregado');
        setGoogleLoaded(true);
        return;
      }

      console.log('🔄 Carregando Google Maps API...', { isMobile, retryCount });

      const script = document.createElement("script");
      // Configuração específica para mobile
      const loadingParam = isMobile ? 'async' : 'async';
      const callbackParam = isMobile ? '&callback=initGoogleMaps' : '';
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&language=pt-BR&region=BR&loading=${loadingParam}${callbackParam}`;
      script.async = true;
      script.defer = true;
      
      // Callback global para mobile
      if (isMobile) {
        (window as any).initGoogleMaps = () => {
          console.log('✅ Google Maps carregado via callback (mobile)');
          setGoogleLoaded(true);
          delete (window as any).initGoogleMaps;
        };
      }
      
      script.onload = () => {
        if (!isMobile) {
          console.log('✅ Google Maps carregado via onload (desktop)');
          setGoogleLoaded(true);
        }
      };

      script.onerror = (error) => {
        console.error('❌ Falha ao carregar Google Maps API:', error);
        // Retry logic para mobile
        if (isMobile && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      };

      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, [isMobile, retryCount]);

  const searchPlaces = async (input: string) => {
    if (!googleLoaded || !window.google?.maps?.places || input.length < 3) {
      setPredictions([]);
      return;
    }

    console.log('🔍 Buscando locais:', { input, isMobile, googleLoaded });
    setIsLoading(true);

    try {
      // Estratégia diferente para mobile e desktop
      if (isMobile) {
        // Mobile: usar apenas AutocompleteService (mais estável)
        const service = new window.google.maps.places.AutocompleteService();
        const request = {
          input,
          componentRestrictions: { country: "br" },
          types: ["establishment", "geocode"],
        };

        service.getPlacePredictions(
          request,
          (predictions: PlacePrediction[] | null, status: string) => {
            console.log('📱 Resultado mobile:', { status, predictions: predictions?.length });
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setPredictions(predictions.slice(0, 5));
            } else {
              console.warn('⚠️ Status não OK:', status);
              setPredictions([]);
            }
          }
        );
      } else {
        // Desktop: usar nova API com fallback
        try {
          const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
          const service = new window.google.maps.places.AutocompleteService();
          
          const request = {
            input,
            componentRestrictions: { country: "br" },
            types: ["establishment", "geocode"],
          };

          service.getPlacePredictions(
            request,
            (predictions: PlacePrediction[] | null, status: string) => {
              console.log('💻 Resultado desktop:', { status, predictions: predictions?.length });
              setIsLoading(false);
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                setPredictions(predictions.slice(0, 5));
              } else {
                setPredictions([]);
              }
            }
          );
        } catch (importError) {
          console.warn('⚠️ Fallback para API antiga:', importError);
          // Fallback para API antiga
          const service = new window.google.maps.places.AutocompleteService();
          const request = {
            input,
            componentRestrictions: { country: "br" },
            types: ["establishment", "geocode"],
          };

          service.getPlacePredictions(request, (predictions, status) => {
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setPredictions(predictions.slice(0, 5));
            } else {
              setPredictions([]);
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro na busca de locais:', error);
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

    console.log('📍 Selecionando local:', { prediction, isMobile });

    try {
      if (isMobile) {
        // Mobile: usar apenas dados da predição (mais rápido e confiável)
        console.log('📱 Usando dados diretos da predição (mobile)');
        const locationData: LocationData = {
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          place_id: prediction.place_id,
        };

        setQuery(locationData.name);
        setShowSuggestions(false);
        setPredictions([]);
        onLocationSelect(locationData);
      } else {
        // Desktop: tentar usar nova API com fallback
        try {
          const { Place } = await window.google.maps.importLibrary("places");
          
          const place = new Place({
            id: prediction.place_id,
            requestedLanguage: 'pt-BR'
          });

          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "id"]
          });

          const locationData: LocationData = {
            name: place.displayName || prediction.structured_formatting.main_text,
            address: place.formattedAddress || prediction.description,
            place_id: place.id || prediction.place_id,
          };

          console.log('💻 Dados obtidos via nova API (desktop):', locationData);
          setQuery(locationData.name);
          setShowSuggestions(false);
          setPredictions([]);
          onLocationSelect(locationData);
        } catch (placeError) {
          console.warn('⚠️ Fallback para dados da predição (desktop):', placeError);
          // Fallback para dados da predição
          const locationData: LocationData = {
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            place_id: prediction.place_id,
          };

          setQuery(locationData.name);
          setShowSuggestions(false);
          setPredictions([]);
          onLocationSelect(locationData);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar local:', error);
      // Fallback final
      const locationData: LocationData = {
        name: prediction.structured_formatting.main_text,
        address: prediction.description,
        place_id: prediction.place_id,
      };

      setQuery(locationData.name);
      setShowSuggestions(false);
      setPredictions([]);
      onLocationSelect(locationData);
    }
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
            // Delay maior para mobile para permitir cliques nas sugestões
            const delay = isMobile ? 300 : 200;
            setTimeout(() => setShowSuggestions(false), delay);
          }}
        />
        {isLoading && query.length >= 3 && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <Card className={`absolute z-50 w-full max-h-60 overflow-y-auto border shadow-lg ${isMobile ? 'touch-manipulation' : ''}`}>
          {predictions.map((prediction) => (
            <Button
              key={prediction.place_id}
              variant="ghost"
              className={`w-full justify-start text-left h-auto hover:bg-muted ${isMobile ? 'p-4 min-h-[60px]' : 'p-3'}`}
              onClick={() => handlePlaceSelect(prediction)}
              onTouchStart={() => {
                // Previne o blur do input no mobile
                if (isMobile) {
                  document.getElementById('location')?.focus();
                }
              }}
            >
              <MapPin className={`text-muted-foreground flex-shrink-0 ${isMobile ? 'mr-3 h-5 w-5' : 'mr-2 h-4 w-4'}`} />
              <div className="min-w-0 flex-1">
                <div className={`font-medium truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {prediction.structured_formatting.main_text}
                </div>
                <div className={`text-muted-foreground truncate ${isMobile ? 'text-sm' : 'text-xs'}`}>
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