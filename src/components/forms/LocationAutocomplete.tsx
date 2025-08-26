import React, { useState, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGooglePlaces, type LocationData } from "@/hooks/useGooglePlaces";
import { useDebounce } from "@/hooks/useDebounce";
import { LocationSuggestions } from "./LocationSuggestions";
import { getEnvironmentInfo } from "@/lib/environmentUtils";

interface Props {
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
}: Props) {
  const [query, setQuery] = useState(initialLocation);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded, isLoading, predictions, searchPlaces, getPlaceDetails, canUseGooglePlaces } = useGooglePlaces();
  const debouncedQuery = useDebounce(query, 300);
  const env = getEnvironmentInfo();

  React.useEffect(() => {
    if (debouncedQuery && canUseGooglePlaces) {
      searchPlaces(debouncedQuery);
    }
  }, [debouncedQuery, searchPlaces, canUseGooglePlaces]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
  };

  const handlePredictionSelect = async (prediction: any) => {
    const locationData = await getPlaceDetails(prediction.place_id);
    
    if (locationData) {
      setQuery(locationData.name);
      setShowSuggestions(false);
      onLocationSelect(locationData);
    }
  };

  const handleInputFocus = () => {
    if (predictions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const getPlaceholder = () => {
    if (!canUseGooglePlaces) {
      return env.isSandbox 
        ? "Abra o site publicado para usar o Google Places"
        : "Digite o nome do local...";
    }
    return isLoaded ? "Digite o nome do local..." : "Carregando Google Places...";
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">
        Local do Evento <span className="text-destructive ml-1">*</span>
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="location"
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={getPlaceholder()}
          disabled={disabled || (!isLoaded && canUseGooglePlaces)}
          className="pl-9 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      <LocationSuggestions
        predictions={predictions}
        onSelect={handlePredictionSelect}
        isVisible={showSuggestions && canUseGooglePlaces}
      />
      
      {!canUseGooglePlaces && env.isSandbox && (
        <p className="text-sm text-muted-foreground">
          💡 O Google Places funciona no site publicado
        </p>
      )}
    </div>
  );
}