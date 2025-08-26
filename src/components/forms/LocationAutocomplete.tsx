import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  useEffect(() => {
    const loadGooglePlaces = async () => {
      if (window.google && window.google.maps) {
        setGoogleLoaded(true);
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=places&language=pt-BR&region=BR`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setGoogleLoaded(true);
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      };

      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, []);

  const searchPlaces = async (input: string) => {
    if (!googleLoaded || !autocompleteServiceRef.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input,
      componentRestrictions: { country: "br" },
      types: ["establishment", "geocode"],
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions: PlacePrediction[] | null, status: string) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 5));
        } else {
          setPredictions([]);
        }
      }
    );
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

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ["name", "formatted_address", "place_id"],
    };

    placesServiceRef.current.getDetails(
      request,
      (place: any, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData: LocationData = {
            name: place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || prediction.description,
            place_id: place.place_id,
          };

          setQuery(locationData.name);
          setShowSuggestions(false);
          setPredictions([]);
          onLocationSelect(locationData);
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

      {!googleLoaded && (
        <p className="text-sm text-muted-foreground">
          Carregando sugestões de locais...
        </p>
      )}
    </div>
  );
}