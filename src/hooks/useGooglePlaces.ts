import { useState, useEffect, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { getEnvironmentInfo } from '@/lib/environmentUtils';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface LocationData {
  name: string;
  address: string;
  place_id: string;
}

export function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);

  const env = getEnvironmentInfo();

  useEffect(() => {
    if (!env.canUseGooglePlaces) {
      console.log('Google Places disabled for this environment');
      return;
    }

    const initializeGooglePlaces = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
          console.warn('Google Places API key not found');
          return;
        }

        // Validate API key format
        if (!apiKey.startsWith('AIza')) {
          console.warn('Invalid Google Places API key format');
          return;
        }

        await loadGoogleMaps(apiKey);
        
        const { AutocompleteService, PlacesService } = await (window as any).google.maps.importLibrary('places');
        
        setAutocompleteService(new AutocompleteService());
        setPlacesService(new PlacesService(document.createElement('div')));
        setIsLoaded(true);
        console.log('Google Places initialized successfully');
      } catch (error) {
        console.error('Failed to load Google Places:', error);
        // Don't set isLoaded to true if there's an error
      }
    };

    initializeGooglePlaces();
  }, [env.canUseGooglePlaces]);

  const searchPlaces = useCallback(async (query: string) => {
    if (!isLoaded || !autocompleteService || query.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input: query,
      componentRestrictions: { country: 'br' },
      types: ['establishment', 'geocode'],
    };

    autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
      setIsLoading(false);
      
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
        setPredictions(predictions.slice(0, 5));
      } else {
        setPredictions([]);
      }
    });
  }, [isLoaded, autocompleteService]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<LocationData | null> => {
    if (!placesService) return null;

    return new Promise((resolve) => {
      const request = {
        placeId,
        fields: ['name', 'formatted_address', 'place_id'],
      };

      placesService.getDetails(request, (place: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            name: place.name || '',
            address: place.formatted_address || '',
            place_id: place.place_id || placeId,
          });
        } else {
          resolve(null);
        }
      });
    });
  }, [placesService]);

  return {
    isLoaded,
    isLoading,
    predictions,
    searchPlaces,
    getPlaceDetails,
    canUseGooglePlaces: env.canUseGooglePlaces,
  };
}