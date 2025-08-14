import React, { useState, useEffect } from "react";
import { Check, X, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Band {
  id: string;
  nome: string;
  genero: string | null;
}

interface BandMultiSelectProps {
  selectedBands: Band[];
  onBandsChange: (bands: Band[]) => void;
  disabled?: boolean;
}

export function BandMultiSelect({
  selectedBands,
  onBandsChange,
  disabled = false,
}: BandMultiSelectProps) {
  const [bands, setBands] = useState<Band[]>([]);
  const [filteredBands, setFilteredBands] = useState<Band[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBands();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = bands.filter(
        (band) =>
          band.nome.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !selectedBands.some((selected) => selected.id === band.id)
      );
      setFilteredBands(filtered);
    } else {
      setFilteredBands(
        bands.filter((band) => !selectedBands.some((selected) => selected.id === band.id))
      );
    }
  }, [searchQuery, bands, selectedBands]);

  const loadBands = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("banda")
        .select("id, nome, genero")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      setBands(data || []);
    } catch (error) {
      console.error("Error loading bands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBandSelect = (band: Band) => {
    const newSelectedBands = [...selectedBands, band];
    onBandsChange(newSelectedBands);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleBandRemove = (bandId: string) => {
    const newSelectedBands = selectedBands.filter((band) => band.id !== bandId);
    onBandsChange(newSelectedBands);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="bands">Bandas Participantes</Label>
      
      {/* Selected bands display */}
      {selectedBands.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedBands.map((band) => (
            <Badge key={band.id} variant="secondary" className="px-2 py-1">
              <Music className="mr-1 h-3 w-3" />
              {band.nome}
              {band.genero && (
                <span className="ml-1 text-xs opacity-70">({band.genero})</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 hover:bg-transparent"
                onClick={() => handleBandRemove(band.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          id="bands"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar bandas..."
          disabled={disabled || isLoading}
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

      {/* Suggestions dropdown */}
      {showSuggestions && filteredBands.length > 0 && (
        <Card className="absolute z-50 w-full max-h-48 overflow-y-auto border shadow-lg">
          {filteredBands.slice(0, 10).map((band) => (
            <Button
              key={band.id}
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 hover:bg-muted"
              onClick={() => handleBandSelect(band)}
            >
              <Music className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{band.nome}</div>
                {band.genero && (
                  <div className="text-sm text-muted-foreground">{band.genero}</div>
                )}
              </div>
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ))}
        </Card>
      )}

      {/* No bands message */}
      {showSuggestions && filteredBands.length === 0 && searchQuery && (
        <Card className="absolute z-50 w-full border shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            Nenhuma banda encontrada para "{searchQuery}"
          </p>
        </Card>
      )}
    </div>
  );
}