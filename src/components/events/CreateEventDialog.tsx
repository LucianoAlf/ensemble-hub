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
import type { EventItem } from "@/pages/Events";

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
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>("20:00");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [bandName, setBandName] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setName("");
    setType("show");
    setDate(new Date().toISOString().slice(0, 10));
    setTime("20:00");
    setVenue("");
    setAddress("");
    setBandName("");
    setBudget("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [h, m] = time.split(":").map((n) => parseInt(n));
    const d = new Date(date);
    d.setHours(h, m, 0, 0);

    const evt: EventItem = {
      id: "temp",
      name,
      type,
      date: d.toISOString(),
      venue,
      address: address || undefined,
      bandName: bandName || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      description: description || undefined,
      status: "scheduled",
    };

    onCreate(evt);
    onOpenChange(false);
    reset();
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
              <Label>Nome</Label>
              <Input placeholder="Show no Blue Note" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v: EventItem["type"]) => setType(v)}>
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

            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Local</Label>
              <Input placeholder="Nome do local" value={venue} onChange={(e) => setVenue(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input placeholder="Rua, número, bairro, cidade" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Banda</Label>
              <Input placeholder="Nome da banda" value={bandName} onChange={(e) => setBandName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Orçamento</Label>
              <Input type="number" placeholder="0.00" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Informações adicionais sobre o evento..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Evento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
