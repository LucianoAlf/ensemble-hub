import React, { useState, useRef, useEffect } from "react";
import { MapPin, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePlacesInput } from "@/hooks/usePlacesInput";

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Domain protection - redirect if in preview/sandbox
  useEffect(() => {
    const CANON = 'https://ensemble-hub.lovable.app';
    if (window.self !== window.top || /lovable\.dev|^id-preview--|^preview--/.test(location.host)) {
      window.top!.location.replace(CANON + location.pathname + location.search + location.hash);
      return;
    }
  }, []);

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

  usePlacesInput(inputRef.current, handlePlaceSelect);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setError(null);
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