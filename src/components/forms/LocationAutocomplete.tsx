import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    google: any;
    initGooglePlaces: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestAbortRef = useRef<boolean>(false);

  useEffect(() => {
    const loadGooglePlaces = async () => {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.error("Google Places API key not configured");
        setError("Configuração da API do Google Places não encontrada");
        return;
      }

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Places API already loaded");
        setGoogleLoaded(true);
        setError(null);
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        return;
      }

      console.log("Loading Google Places API...");
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR&region=BR&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log("Google Places API loaded successfully");
        setGoogleLoaded(true);
        setError(null);
        setRetryCount(0);
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      };

      script.onerror = () => {
        console.error("Failed to load Google Places API");
        setError("Erro ao carregar a API do Google Places");
        setGoogleLoaded(false);
        
        // Retry logic with exponential backoff
        if (retryCount < 3) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            script.remove();
            loadGooglePlaces();
          }, retryDelay);
        }
      };

      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, [retryCount]);

  const searchPlaces = useCallback(async (input: string) => {
    if (!googleLoaded || !autocompleteServiceRef.current || input.length < 3) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    requestAbortRef.current = true;
    setIsLoading(true);
    setError(null);

    const request = {
      input,
      componentRestrictions: { country: "br" },
      types: ["establishment", "geocode"],
    };

    // Reset abort flag for current request
    requestAbortRef.current = false;

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions: PlacePrediction[] | null, status: string) => {
          // Check if request was aborted
          if (requestAbortRef.current) {
            return;
          }

          setIsLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            console.log(`Found ${predictions.length} place predictions`);
            setPredictions(predictions.slice(0, 5));
            setError(null);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log("No place predictions found");
            setPredictions([]);
            setError(null);
          } else {
            console.error("Places API error:", status);
            setPredictions([]);
            setError("Erro ao buscar locais. Tente novamente.");
          }
        }
      );
    } catch (err) {
      console.error("Error calling Places API:", err);
      setIsLoading(false);
      setPredictions([]);
      setError("Erro na busca de locais");
    }
  }, [googleLoaded]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    setError(null);
    
    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (value.length >= 3) {
      // Debounce search requests
      debounceTimeoutRef.current = setTimeout(() => {
        searchPlaces(value);
      }, 300);
    } else {
      setPredictions([]);
      setIsLoading(false);
    }
  };

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    if (!placesServiceRef.current) {
      console.error("Places service not available");
      setError("Serviço de lugares não disponível");
      return;
    }

    setIsLoading(true);
    setError(null);

    const request = {
      placeId: prediction.place_id,
      fields: ["name", "formatted_address", "place_id"],
    };

    placesServiceRef.current.getDetails(
      request,
      (place: any, status: string) => {
        setIsLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData: LocationData = {
            name: place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || prediction.description,
            place_id: place.place_id,
          };

          console.log("Place selected:", locationData);
          setQuery(locationData.name);
          setShowSuggestions(false);
          setPredictions([]);
          onLocationSelect(locationData);
        } else {
          console.error("Place details error:", status);
          setError("Erro ao obter detalhes do local");
        }
      }
    );
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
          className="pl-9"
          disabled={disabled}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        {isLoading && (
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

      {error && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!googleLoaded && !error && (
        <p className="text-sm text-muted-foreground">
          Carregando sugestões de locais...
        </p>
      )}

      {googleLoaded && !error && query.length > 0 && query.length < 3 && (
        <p className="text-sm text-muted-foreground">
          Digite pelo menos 3 caracteres para buscar locais...
        </p>
      )}
    </div>
  );
}