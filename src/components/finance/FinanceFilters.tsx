import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Filter, X } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { addDays, startOfMonth, endOfMonth } from "date-fns";

export const FinanceFilters = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedBand, setSelectedBand] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Ingressos", "Patrocínio", "Merch", "Transporte", "Alimentação",
    "Locação de equipamento", "Locação de espaço", "Marketing", 
    "Equipe técnica", "ECAD/Taxas", "Outros"
  ];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
    setSelectedBand("all");
    setSelectedEvent("all");
    setSelectedCategories([]);
    setSelectedStatus("all");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedBand !== "all" || selectedEvent !== "all" || selectedCategories.length > 0 || selectedStatus !== "all" || searchQuery;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Top Row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="w-[280px]"
            />
          </div>
          
          <Select value={selectedBand} onValueChange={setSelectedBand}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as bandas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as bandas</SelectItem>
              {/* TODO: Load bands from database */}
              <SelectItem value="banda1">Banda Exemplo 1</SelectItem>
              <SelectItem value="banda2">Banda Exemplo 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {/* TODO: Load events from database */}
              <SelectItem value="evento1">Evento Exemplo 1</SelectItem>
              <SelectItem value="evento2">Evento Exemplo 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="settled">Pago/Recebido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição ou contraparte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Categorias:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};