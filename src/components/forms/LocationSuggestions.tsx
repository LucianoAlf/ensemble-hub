import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PlacePrediction } from '@/hooks/useGooglePlaces';

interface LocationSuggestionsProps {
  predictions: PlacePrediction[];
  onSelect: (prediction: PlacePrediction) => void;
  isVisible: boolean;
}

export function LocationSuggestions({ predictions, onSelect, isVisible }: LocationSuggestionsProps) {
  if (!isVisible || predictions.length === 0) return null;

  return (
    <Card className="absolute z-50 w-full max-h-60 overflow-y-auto border shadow-lg bg-background">
      {predictions.map((prediction) => (
        <Button
          key={prediction.place_id}
          variant="ghost"
          className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
          onClick={() => onSelect(prediction)}
        >
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate text-foreground">
              {prediction.structured_formatting.main_text}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {prediction.structured_formatting.secondary_text}
            </div>
          </div>
        </Button>
      ))}
    </Card>
  );
}