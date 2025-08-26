import React, { useState, useRef } from "react";
import { Search, AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePlacesInput } from "@/hooks/usePlacesInput";
import { getEnvironmentInfo } from "@/lib/environmentUtils";

declare namespace google.maps.places {
  interface PlaceResult {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    geometry?: any;
  }
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

export function LocationAutocomplete({
  onLocationSelect,
  initialLocation = "",
  initialAddress = "",
  disabled = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const envInfo = getEnvironmentInfo();

  // Show fallback if Google Places is not available
  React.useEffect(() => {
    if (!envInfo.canUseGooglePlaces) {
      setShowFallback(true);
    }
  }, [envInfo.canUseGooglePlaces]);

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.name || !place.formatted_address || !place.place_id) {
      setError('Dados incompletos do local selecionado');
      return;
    }

    const locationData: LocationData = {
      name: place.name,
      address: place.formatted_address,
      place_id: place.place_id
    };

    setQuery(place.name);
    setError(null);
    onLocationSelect(locationData);
  };

  const handlePlacesError = () => {
    setShowFallback(true);
    setError(null);
  };

  // Only use Google Places if environment supports it
  const shouldUsePlaces = envInfo.canUseGooglePlaces && !showFallback;
  
  usePlacesInput(
    shouldUsePlaces ? inputRef.current : null, 
    handlePlaceSelect,
    handlePlacesError
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    setError(null);
  };

  const handleFallbackSubmit = () => {
    if (!query.trim()) {
      setError('Por favor, digite o nome do local');
      return;
    }

    const locationData: LocationData = {
      name: query.trim(),
      address: query.trim(),
      place_id: `manual_${Date.now()}`
    };

    onLocationSelect(locationData);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">
        Local do Evento
        <span className="text-destructive ml-1">*</span>
      </Label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          id="location"
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Digite o nome do local ou endereço..."
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {/* Environment info for development */}
      {!envInfo.canUseGooglePlaces && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google Places não disponível em ambiente de desenvolvimento. Digite o local manualmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Fallback mode info */}
      {showFallback && envInfo.canUseGooglePlaces && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Autocomplete indisponível. Digite o local manualmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}