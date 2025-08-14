import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { LocationAutocomplete } from "@/components/forms/LocationAutocomplete";
import { BandMultiSelect } from "@/components/forms/BandMultiSelect";
import { TimePickerField } from "@/components/forms/TimePickerField";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { EventItem } from "@/pages/Events";

interface Band {
  id: string;
  nome: string;
  genero: string | null;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (evt: EventItem) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<EventItem["type"]>("show");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("20:00");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [selectedBands, setSelectedBands] = useState<Band[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const reset = () => {
    setName("");
    setType("show");
    setSelectedDate(undefined);
    setTime("20:00");
    setVenue("");
    setAddress("");
    setSelectedBands([]);
    setBudget("");
    setDescription("");
  };

  const handleLocationSelect = (location: { name: string; address: string; place_id: string }) => {
    setVenue(location.name);
    setAddress(location.address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !selectedDate || !time || !venue) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Combine date and time
      const eventDateTime = new Date(selectedDate);
      const [hours, minutes] = time.split(':').map(Number);
      eventDateTime.setHours(hours, minutes);

      const { data, error } = await supabase.rpc('create_evento', {
        p_titulo: name,
        p_tipo: type,
        p_inicio: eventDateTime.toISOString(),
        p_local: venue,
        p_endereco: address,
        p_banda_ids: selectedBands.map(band => band.id),
        p_orcamento: budget ? parseFloat(budget) : null,
        p_descricao: description || null,
      });

      if (error) throw error;

      toast({
        title: "Evento criado!",
        description: "O evento foi criado com sucesso.",
      });

      // Create EventItem for the callback
      const evt: EventItem = {
        id: data[0]?.id || "temp",
        name,
        type,
        date: eventDateTime.toISOString(),
        venue,
        address: address || undefined,
        bandName: selectedBands.map(b => b.nome).join(', ') || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        description: description || undefined,
        status: "scheduled",
      };
      
      onCreate(evt);
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Erro ao criar evento",
        description: "Ocorreu um erro ao criar o evento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
          <DialogDescription>Cadastre um novo evento ao calendário.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Nome do Evento
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input 
                placeholder="Show no Blue Note" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={isLoading}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={type} 
                onValueChange={(v: EventItem["type"]) => setType(v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">Show</SelectItem>
                  <SelectItem value="rehearsal">Ensaio</SelectItem>
                  <SelectItem value="recording">Gravação</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DatePickerField
              label="Data do Evento"
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Selecione uma data"
              disabled={isLoading}
              required
            />

            <TimePickerField
              label="Horário"
              value={time}
              onChange={setTime}
              placeholder="Selecione um horário"
              disabled={isLoading}
              required
            />
          </div>

          <LocationAutocomplete
            onLocationSelect={handleLocationSelect}
            initialLocation={venue}
            initialAddress={address}
            disabled={isLoading}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <BandMultiSelect
              selectedBands={selectedBands}
              onBandsChange={setSelectedBands}
              disabled={isLoading}
            />

            <div className="space-y-2">
              <Label>Orçamento (R$)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value)} 
                disabled={isLoading}
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              placeholder="Informações adicionais sobre o evento..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              disabled={isLoading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
