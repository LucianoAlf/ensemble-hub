import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, MapPin, Users, DollarSign, Plus, Search, MoreVertical, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";

export type EventItem = {
  id: string;
  name: string;
  type: "show" | "rehearsal" | "recording" | "meeting";
  date: string; // ISO
  venue: string;
  address?: string;
  bandName?: string;
  budget?: number;
  description?: string;
  status?: string;
};

const initialEvents: EventItem[] = [
  {
    id: "1",
    name: "Show no Blue Note",
    type: "show",
    date: new Date(Date.now() + 86400000).toISOString(),
    venue: "Blue Note",
    address: "Av. Paulista, 1000 - SP",
    bandName: "Banda XYZ",
    budget: 12000,
    status: "scheduled",
  },
  {
    id: "2",
    name: "Ensaio Geral",
    type: "rehearsal",
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    venue: "Estúdio Beat",
    address: "Rua das Artes, 45 - RJ",
    bandName: "Banda ABC",
    budget: 0,
    status: "scheduled",
  },
];

export default function Events() {
  useSEO({
    title: "Eventos | LA Music Hub",
    description: "Gerencie todos os eventos e shows das suas bandas.",
    canonical: typeof window !== "undefined" ? `${window.location.origin}/events` : undefined,
  });

  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) =>
      [e.name, e.type, e.venue, e.address, e.bandName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [events, search]);

  const handleCreate = (evt: EventItem) => {
    setEvents((prev) => [{ ...evt, id: String(Date.now()) }, ...prev]);
  };

  return (
    <>
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos & Shows</h1>
            <p className="text-muted-foreground">Organize shows, ensaios e gravações</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, tipo ou local..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">{labelForType(event.type)}</Badge>
                        {event.bandName && (
                          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {event.bandName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDateTime(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
                {typeof event.budget === "number" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>R$ {event.budget.toLocaleString("pt-BR")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <CreateEventDialog open={open} onOpenChange={setOpen} onCreate={handleCreate} />
    </>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelForType(t: EventItem["type"]) {
  switch (t) {
    case "show":
      return "Show";
    case "rehearsal":
      return "Ensaio";
    case "recording":
      return "Gravação";
    case "meeting":
      return "Reunião";
  }
}
