import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

declare global {
  interface Window {
    google?: any;
  }
}

declare namespace google.maps {
  interface MapsEventListener {
    remove(): void;
  }

  namespace places {
    class Autocomplete {
      constructor(input: HTMLInputElement, opts?: any);
      addListener(eventName: string, handler: () => void): MapsEventListener;
      getPlace(): any;
    }
    
    class Place {
      constructor(options: { id: string });
      fetchFields(request: { fields: string[] }): Promise<void>;
    }

    interface PlaceResult {
      place_id?: string;
      name?: string;
      formatted_address?: string;
      geometry?: any;
    }

    interface PlacesLibrary {
      Autocomplete: typeof Autocomplete;
      Place: typeof Place;
    }
  }

  namespace event {
    function clearInstanceListeners(instance: any): void;
  }
}

export function usePlacesInput(
  inputEl: HTMLInputElement | null,
  onSelect: (place: google.maps.places.PlaceResult) => void
) {
  const subscriptionRef = useRef<google.maps.MapsEventListener | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!inputEl) return;

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
          console.error('❌ VITE_GOOGLE_PLACES_API_KEY não encontrada');
          return;
        }

        await loadGoogleMaps(apiKey);
        
        const { Autocomplete, Place } = 
          (await (window.google.maps as any).importLibrary('places')) as google.maps.places.PlacesLibrary;

        if (!mounted) return;

        autocompleteRef.current = new Autocomplete(inputEl, {
          fields: ['place_id', 'name', 'formatted_address', 'geometry'],
          componentRestrictions: { country: 'br' },
          types: ['establishment']
        });

        subscriptionRef.current = autocompleteRef.current.addListener('place_changed', async () => {
          const basePlace = autocompleteRef.current!.getPlace();
          
          if (!basePlace?.place_id) return;

          // Se já tem todos os dados necessários, retorna direto
          if (basePlace.formatted_address && basePlace.geometry) {
            onSelect(basePlace);
            return;
          }

          // Caso contrário, busca dados completos usando Place API
          try {
            const place = new Place({ id: basePlace.place_id });
            await place.fetchFields({
              fields: ['name', 'formatted_address', 'geometry', 'address_components']
            });
            onSelect(place as unknown as google.maps.places.PlaceResult);
          } catch (error) {
            console.error('Erro ao buscar detalhes do local:', error);
            // Fallback para dados básicos
            onSelect(basePlace);
          }
        });

      } catch (error) {
        console.error('❌ Erro ao inicializar Places Input:', error);
      }
    })();

    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [inputEl, onSelect]);
}