import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { Search, Filter, X, Calendar, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth, subDays } from "date-fns";

interface ImprovedFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

interface FilterState {
  dateRange: DateRange | undefined;
  selectedBand: string;
  selectedEvent: string;
  selectedCategories: string[];
  selectedStatus: string;
  searchQuery: string;
  periodPreset: string;
}

const ImprovedFilters = ({ onFiltersChange }: ImprovedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<string>("current-month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedBand, setSelectedBand] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Shows", "Aulas", "Equipamentos", "Transporte", 
    "Marketing", "Cachês", "Serviços", "Outros"
  ];

  const periodPresets = [
    { value: "last-30", label: "Últimos 30 dias" },
    { value: "last-90", label: "Últimos 90 dias" },
    { value: "last-365", label: "Últimos 365 dias" },
    { value: "current-month", label: "Mês atual" },
    { value: "custom", label: "Período customizado" }
  ];

  const handlePeriodPresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const today = new Date();
    
    switch (preset) {
      case "last-30":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "last-90":
        setDateRange({ from: subDays(today, 90), to: today });
        break;
      case "last-365":
        setDateRange({ from: subDays(today, 365), to: today });
        break;
      case "current-month":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "custom":
        // Mantém o range atual para customização
        break;
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setPeriodPreset("current-month");
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
    setSelectedBand("all");
    setSelectedEvent("all");
    setSelectedCategories([]);
    setSelectedStatus("all");
    setSearchQuery("");
    setIsOpen(false);
  };

  const hasActiveFilters = selectedBand !== "all" || selectedEvent !== "all" || 
    selectedCategories.length > 0 || selectedStatus !== "all" || searchQuery ||
    periodPreset !== "current-month";

  const activeFiltersCount = [
    selectedBand !== "all",
    selectedEvent !== "all", 
    selectedCategories.length > 0,
    selectedStatus !== "all",
    periodPreset !== "current-month"
  ].filter(Boolean).length;

  // Notificar mudanças nos filtros
  const currentFilters: FilterState = {
    dateRange,
    selectedBand,
    selectedEvent,
    selectedCategories,
    selectedStatus,
    searchQuery,
    periodPreset
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca Principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por descrição, valor ou beneficiário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 relative">
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-6" align="end" side="bottom" sideOffset={8}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtros Avançados</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-muted-foreground">
                    <X className="h-4 w-4" />
                    Limpar Tudo
                  </Button>
                )}
              </div>

              {/* Seletor de Período */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Período</label>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={periodPreset} onValueChange={handlePeriodPresetChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodPresets.map(preset => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {periodPreset === "custom" && (
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  )}
                </div>
              </div>

              {/* Status e Banda */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="settled">Liquidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Banda</label>
                  <Select value={selectedBand} onValueChange={setSelectedBand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as bandas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as bandas</SelectItem>
                      <SelectItem value="banda1">Banda Teste</SelectItem>
                      <SelectItem value="banda2">Originals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Evento */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Evento</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    <SelectItem value="evento1">Show Rock in Rio</SelectItem>
                    <SelectItem value="evento2">Apresentação Teatro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categorias */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Categorias</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                      {selectedCategories.includes(category) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ações do Footer */}
              <div className="flex justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {hasActiveFilters ? `${activeFiltersCount} filtro(s) ativo(s)` : "Nenhum filtro aplicado"}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    Fechar
                  </Button>
                  <Button size="sm" onClick={() => {
                    onFiltersChange?.(currentFilters);
                    setIsOpen(false);
                  }}>
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Indicadores de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {periodPreset !== "current-month" && (
            <Badge variant="secondary" className="gap-1">
              {periodPresets.find(p => p.value === periodPreset)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                setPeriodPreset("current-month");
                handlePeriodPresetChange("current-month");
              }} />
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {selectedStatus}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStatus("all")} />
            </Badge>
          )}
          {selectedBand !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Banda: {selectedBand}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedBand("all")} />
            </Badge>
          )}
          {selectedEvent !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Evento: {selectedEvent}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedEvent("all")} />
            </Badge>
          )}
          {selectedCategories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(category)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImprovedFilters;
