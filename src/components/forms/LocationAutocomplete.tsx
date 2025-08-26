import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";


interface LocationData { 
  name: string; 
  address: string; 
  place_id: string; 
}

interface Props {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: string;
  initialAddress?: string;
  disabled?: boolean;
}

const isPreview = /lovable\.dev|^id-preview--|^preview--/.test(location.host);

export function LocationAutocomplete({
  onLocationSelect,
  initialLocation = "",
  initialAddress = "",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPreview) return; // evita erro no sandbox/preview (key bloqueia)
    const KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string;

    let ac: any = null;
    let sub: any = null;

    (async () => {
      await loadGoogleMaps(KEY);
      const { Autocomplete, Place } =
        (await ((window as any).google.maps as any).importLibrary("places")) as any;

      if (!inputRef.current) return;

      ac = new Autocomplete(inputRef.current, {
        fields: ["place_id", "name", "formatted_address", "geometry"],
        componentRestrictions: { country: "br" },
      });

      sub = ac.addListener("place_changed", async () => {
        const base = ac!.getPlace();
        if (!base?.place_id) return;

        // Se o autocomplete não trouxe tudo, completa com Place().fetchFields()
        if (!base.formatted_address || !base.geometry) {
          const p = new ((window as any).google.maps.places as any).Place({ id: base.place_id });
          await p.fetchFields({ fields: ["name","formatted_address","geometry"] });
          onLocationSelect({
            name: p.displayName || p.name || base.name || "",
            address: p.formattedAddress || base.formatted_address || "",
            place_id: base.place_id,
          });
          return;
        }

        onLocationSelect({
          name: base.name || "",
          address: base.formatted_address || "",
          place_id: base.place_id,
        });
      });
    })();

    return () => {
      sub?.remove();
      if (ac) ((window as any).google.maps.event as any).clearInstanceListeners(ac);
    };
  }, [onLocationSelect]);

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">Local do Evento <span className="text-destructive ml-1">*</span></Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="location"
          ref={inputRef}
          defaultValue={initialLocation}
          placeholder={isPreview ? "Abra o site publicado para usar o Google Places" : "Digite o nome do local..."}
          disabled={disabled || isPreview}
          className="pl-9"
        />
      </div>
    </div>
  );
}