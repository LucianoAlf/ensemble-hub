import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, AlertCircle, Loader2 } from "lucide-react";
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      setError("API key do Google Places não configurada");
      setIsInitializing(false);
      console.error("❌ VITE_GOOGLE_PLACES_API_KEY não encontrada");
      return;
    }

    // Define global callback function
    window.initGooglePlaces = () => {
      try {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          
          // Create a dummy element for PlacesService
          const dummyElement = document.createElement('div');
          placesServiceRef.current = new window.google.maps.places.PlacesService(dummyElement);
          
          setGoogleLoaded(true);
          setIsInitializing(false);
          setError(null);
          console.log('✅ Google Places API inicializada');
        } else {
          throw new Error('Google Places API não disponível');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar Google Places:', error);
        setError('Erro ao inicializar Google Places API');
        setIsInitializing(false);
      }
    };

    // Check if already loaded
    if (window.google?.maps?.places) {
      window.initGooglePlaces();
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log('🔄 Google Maps script já presente');
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR&region=BR&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar Google Maps script');
      setError('Erro ao carregar Google Maps API');
      setIsInitializing(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.initGooglePlaces) {
        delete window.initGooglePlaces;
      }
    };
  }, []);

  const searchPlaces = useCallback((searchQuery: string) => {
    if (!autocompleteServiceRef.current || !searchQuery.trim() || searchQuery.length < 3) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    const request = {
      input: searchQuery,
      componentRestrictions: { country: 'br' },
      types: ['establishment', 'geocode'],
      language: 'pt-BR'
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions: PlacePrediction[] | null, status: any) => {
        setIsLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 5));
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
      }
    );
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setError(null);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce search
    debounceTimeoutRef.current = setTimeout(() => {
      if (googleLoaded) {
        searchPlaces(value);
      }
    }, 300);
  };

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    if (!placesServiceRef.current) {
      console.error('❌ PlacesService não disponível');
      return;
    }

    setQuery(prediction.description);
    setShowSuggestions(false);
    setIsLoading(true);

    const request = {
      placeId: prediction.place_id,
      fields: ['name', 'formatted_address', 'place_id']
    };

    placesServiceRef.current.getDetails(
      request,
      (place: any, status: any) => {
        setIsLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData: LocationData = {
            name: place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || prediction.description,
            place_id: place.place_id
          };
          onLocationSelect(locationData);
        } else {
          // Fallback to prediction data
          const fallbackData: LocationData = {
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            place_id: prediction.place_id
          };
          onLocationSelect(fallbackData);
        }
      }
    );
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">
        Local do Evento
        <span className="text-destructive ml-1">*</span>
      </Label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {isInitializing || isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        
        <Input
          id="location"
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(predictions.length > 0)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={
            isInitializing 
              ? "Carregando Google Places..." 
              : error 
                ? "Erro ao carregar API"
                : "Digite o nome do local ou endereço..."
          }
          className="pl-10"
          disabled={disabled || isInitializing || !!error}
        />
      </div>

      {/* Error message */}
      {error && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dropdown with suggestions */}
      {showSuggestions && predictions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-2 max-h-64 overflow-y-auto shadow-lg border">
          <div className="space-y-1">
            {predictions.map((prediction) => (
              <Button
                key={prediction.place_id}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handlePlaceSelect(prediction)}
              >
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {showSuggestions && predictions.length === 0 && query.length >= 3 && !isLoading && googleLoaded && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-4 text-center text-sm text-muted-foreground">
          Nenhum local encontrado para "{query}"
        </Card>
      )}

      {/* Loading state message */}
      {!googleLoaded && !error && (
        <p className="text-sm text-muted-foreground">
          Carregando sugestões de locais...
        </p>
      )}

      {/* Minimum characters hint */}
      {googleLoaded && !error && query.length > 0 && query.length < 3 && (
        <p className="text-sm text-muted-foreground">
          Digite pelo menos 3 caracteres para buscar locais...
        </p>
      )}
    </div>
  );
}