// Events page - Updated to force cache refresh - Cache cleared
import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, DollarSign, Plus, Search, MoreVertical, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventEditModal } from "@/components/events/EventEditModal";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useEventModal } from "@/hooks/useEventModal";

interface DatabaseEvent {
  id: string;
  titulo: string;
  tipo: string;
  inicio: string;
  local?: string;
  endereco?: string;
  // evento_banda?: { banda?: { nome?: string } }[] | null; // Comentado temporariamente;
  orcamento?: number | null;
  descricao?: string | null;
  status?: string | null;
}

interface SupabaseQueryContext {
  client: ReturnType<typeof useSupabaseOptimized>['client'];
  signal?: AbortSignal;
}

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

// Mapeia o enum do banco (evento/ensaio/aula) para os tipos usados na UI
function mapEventType(dbType: string): EventItem["type"] {
  const typeMap: Record<string, EventItem["type"]> = {
    evento: "show",
    ensaio: "rehearsal",
    aula: "meeting",
    gravacao: "recording"
  };
  
  return typeMap[dbType] || "show";
}

// Valida e sanitiza dados do evento vindos do banco
function validateEventData(row: DatabaseEvent): EventItem {
  if (!row.id || !row.titulo || !row.inicio) {
    throw new Error('Dados do evento inválidos: campos obrigatórios ausentes');
  }
  
  // Temporarily disabled band relationships - TODO: fix schema relationships
let bandName: string | undefined;
// if (row.evento_banda && Array.isArray(row.evento_banda) && row.evento_banda.length > 0) {
//   const firstBandRelation = row.evento_banda[0];
//   if (firstBandRelation?.banda?.nome) {
//     bandName = String(firstBandRelation.banda.nome).trim();
//   }
// }
  
  return {
    id: String(row.id),
    name: String(row.titulo).trim(),
    type: mapEventType(String(row.tipo || 'evento')),
    date: String(row.inicio),
    venue: String(row.local || '').trim(),
    address: row.endereco ? String(row.endereco).trim() : undefined,
    bandName,
    budget: typeof row.orcamento === 'number' && row.orcamento > 0 ? row.orcamento : undefined,
    description: row.descricao ? String(row.descricao).trim() : undefined,
    status: row.status ? String(row.status).trim() : undefined,
  };
}

// Remove initialEvents and rely on backend
export default function Events() {
  useSEO({
    title: "Eventos | LA Music Hub",
    description: "Gerencie todos os eventos e shows das suas bandas.",
    canonical: typeof window !== "undefined" ? `${window.location.origin}/events` : undefined,
  });

  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { query: querySupabase, clearCache } = useSupabaseOptimized();
  const { open: openEventModal, isOpen, eventId, mode, close } = useEventModal();

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await querySupabase(
            async ({ client, signal }: SupabaseQueryContext) => {
              const query = client
                .from("evento")
                .select(`
                  id, titulo, tipo, inicio, local, endereco, orcamento, descricao, status
                `)
                .gte("inicio", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
                .order("inicio", { ascending: true });
              
              if (signal) {
                query.abortSignal(signal);
              }
              
              return query;
            },
            {
              cache: { enabled: true, ttlMs: 300000, key: "events:all-v2" },
              enableAbortSignal: true,
            } as const
          );

      if (res.error) {
        throw new Error(res.error.message || 'Erro ao carregar eventos');
      }

      if (!res.data || !Array.isArray(res.data)) {
        throw new Error('Dados de eventos inválidos recebidos do servidor');
      }

      const validatedEvents: EventItem[] = [];
      const errors: string[] = [];
      
      res.data.forEach((row: DatabaseEvent, index: number) => {
        try {
          const validatedEvent = validateEventData(row);
          validatedEvents.push(validatedEvent);
        } catch (validationError) {
          console.warn(`Erro ao validar evento ${index}:`, validationError);
          errors.push(`Evento ${index + 1}: ${validationError instanceof Error ? validationError.message : 'Erro desconhecido'}`);
        }
      });
      
      setEvents(validatedEvents);
      
      if (errors.length > 0) {
        console.warn('Alguns eventos foram ignorados devido a erros de validação:', errors);
        toast({
          title: "Aviso",
          description: `${errors.length} evento(s) foram ignorados devido a dados inválidos.`,
          variant: "default",
        });
      }
      
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Ignore abort errors
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar eventos';
      console.error("Erro ao carregar eventos:", err);
      setError(errorMessage);
      toast({ 
        title: "Erro ao carregar eventos", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  }, [querySupabase, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) =>
      [e.name, e.type, e.venue, e.address, e.bandName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [events, search]);

  const handleCreate = useCallback(async (evt: EventItem) => {
    try {
      // Validate the new event
      if (!evt.id || !evt.name || !evt.date) {
        throw new Error('Dados do evento inválidos');
      }
      
      setEvents((prev) => [evt, ...prev]);
      
      // Invalidar cache e recarregar eventos para garantir consistência
      clearCache("events:all-v2");
      await loadEvents();
      
      toast({
        title: "Evento criado",
        description: `O evento "${evt.name}" foi criado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao criar evento",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadEvents, toast, clearCache]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      setIsDeleting(true);
      
      const res = await querySupabase(
        async ({ client }) => {
          // Primeiro tentar delete direto
          return await client
            .from('evento')
            .delete()
            .eq('id', eventId);
        },
        {
          cache: { enabled: false, ttlMs: 0, key: `delete-event-${eventId}` },
          enableAbortSignal: false,
        }
      );

      if (res.error) {
        // Se falhar por FK, tentar RPC delete_evento_full
        if (res.error.message.includes('foreign key') || res.error.message.includes('violates')) {
          console.log('Delete direto falhou por FK, tentando RPC delete_evento_full...');
          
          const rpcRes = await querySupabase(
            async ({ client }) => {
              return await client.rpc('delete_evento_full' as const, {
                p_evento_id: eventId
              });
            },
            {
              cache: { enabled: false, ttlMs: 0, key: `delete-event-rpc-${eventId}` },
              enableAbortSignal: false,
            } as const
          );
          
          if (rpcRes.error) {
            throw new Error(rpcRes.error.message || 'Erro ao excluir evento via RPC');
          }
        } else {
          throw new Error(res.error.message || 'Erro ao excluir evento');
        }
      }

      // Atualizar estado local
      setEvents((prev) => prev.filter(e => e.id !== eventId));
      
      // Invalidar caches
      clearCache("events:all-v2");
      clearCache("dashboard:upcoming-events-v1");
      
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      });
      
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao excluir evento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  }, [querySupabase, clearCache, toast]);

  const handleDeleteClick = useCallback((event: EventItem, e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Events: Abrindo dialog de exclusão para evento:', event.id);
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  }, []);

  const handleEventModalOpen = useCallback((eventId: string, source: 'dashboard' | 'events', mode: 'view' | 'edit', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Events: Abrindo modal para evento:', eventId, 'modo:', mode);
    openEventModal(eventId, source, mode);
  }, [openEventModal]);

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

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center mb-4">{error}</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={loadEvents}
                disabled={isLoading}
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando eventos...
            </div>
          </div>
        ) : (
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onSelect={(e) => { e?.preventDefault(); e?.stopPropagation(); handleEventModalOpen(event.id, 'events', 'view'); }}
                        >
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={(e) => { e?.preventDefault(); e?.stopPropagation(); handleEventModalOpen(event.id, 'events', 'edit'); }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onSelect={(e) => handleDeleteClick(event, e)}
                        >
                          Excluir
                        </DropdownMenuItem>
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
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Nenhum evento encontrado
              </div>
            )}
          </section>
        )}
      </main>

      <CreateEventDialog open={open} onOpenChange={setOpen} onCreate={handleCreate} />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{eventToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eventToDelete && deleteEvent(eventToDelete.id)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventEditModal
        eventId={eventId || ''}
        mode={mode || 'edit'}
        open={isOpen}
        onOpenChange={close}
        onEventUpdated={() => loadEvents()}
      />
    </>
  );
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'Data inválida';
    }
    
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

function labelForType(t: EventItem["type"]): string {
  const labels: Record<EventItem["type"], string> = {
    show: "Show",
    rehearsal: "Ensaio",
    recording: "Gravação",
    meeting: "Reunião",
  };
  
  return labels[t] || "Evento";
}
