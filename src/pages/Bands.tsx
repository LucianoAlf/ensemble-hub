import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Users, Loader2, MoreVertical } from "lucide-react";
import { CreateBandDialog } from "@/components/bands/CreateBandDialog";
import { CompleteBandDialog } from "@/components/bands/CompleteBandDialog";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useToast } from "@/hooks/use-toast";

interface Band {
  id: string;
  name: string;
  genre?: string;
  description?: string;
  logo_url?: string;
  members_count: number;
}

const Bands = () => {
  useSEO({
    title: "Bandas — LA BAND PILOT",
    description: "Gerencie bandas, gêneros, membros e logos.",
    canonical: window.location.origin + "/bands",
  });

  const [bands, setBands] = useState<Band[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'view' | 'edit'>('view');
  const [isLoading, setIsLoading] = useState(true);
  const [bandToDelete, setBandToDelete] = useState<Band | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { query: querySupabase, clearCache } = useSupabaseOptimized();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await querySupabase(
          async ({ client }) =>
            client
              .from("vw_bandas_lista")
              .select("id, nome, genero, descricao, logo_url, membros_count")
              .order("nome", { ascending: true })
              .abortSignal(controller.signal),
          {
            cache: {
              enabled: true,
              ttlMs: 60_000,
              key: "bands:list",
            },
            enableAbortSignal: true,
          }
        );

        if (!mounted) return;

        const mapped: Band[] = (res?.data || []).map((row: { id: string; nome: string; genero?: string; descricao?: string; logo_url?: string; membros_count?: number }) => ({
          id: row.id,
          name: row.nome,
          genre: row.genero || undefined,
          description: row.descricao || undefined,
          logo_url: row.logo_url || undefined,
          members_count: Number(row.membros_count || 0),
        }));
        setBands(mapped);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Erro ao carregar bandas:", err);
        toast({ title: "Erro ao carregar bandas", description: "Tente novamente mais tarde.", variant: "destructive" });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [querySupabase, toast]);

  const filtered = bands.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase()) ||
    b.genre?.toLowerCase().includes(query.toLowerCase())
  );

  const handleViewBand = (band: Band, mode: 'view' | 'edit' = 'view') => {
    setSelectedBandId(band.id);
    setSelectedMode(mode);
    setCompleteDialogOpen(true);
  };

  const handleDeleteClick = async (band: Band, e?: Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    setBandToDelete(band);
  };

  const handleDeleteConfirm = async () => {
    if (!bandToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await querySupabase(
        async ({ client }) => {
          // Primeiro tentar delete direto
          return await client
            .from('banda')
            .delete()
            .eq('id', bandToDelete.id);
        },
        {
          cache: { enabled: false, ttlMs: 0, key: `delete-band-${bandToDelete.id}` },
          enableAbortSignal: false,
        }
      );

      if (res.error) {
        // Se falhar por FK, tentar RPC delete_banda_full
        if (res.error.message.includes('foreign key') || res.error.message.includes('violates') || (res.error as any).code === '23503') {
          console.log('Delete direto falhou por FK, tentando RPC delete_banda_full...');
          
          const rpcRes = await querySupabase(
            async ({ client }) => {
              return await (client as any).rpc('delete_banda_full', {
                p_banda_id: bandToDelete.id
              });
            },
            {
              cache: { enabled: false, ttlMs: 0, key: `delete-band-rpc-${bandToDelete.id}` },
              enableAbortSignal: false,
            } as const
          );
          
          if (rpcRes.error) {
            throw new Error(rpcRes.error.message || 'Erro ao excluir banda via RPC');
          }
        } else {
          throw new Error(res.error.message || 'Erro ao excluir banda');
        }
      }

      // Atualizar estado local
      setBands((prev) => prev.filter(b => b.id !== bandToDelete.id));
      
      // Invalidar caches
      clearCache("bands:all-v2");
      clearCache("dashboard:bands-count-v1");
      
      toast({
        title: "Banda excluída",
        description: "A banda foi excluída com sucesso.",
      });
      
    } catch (error) {
      console.error('Erro ao excluir banda:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao excluir banda",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setBandToDelete(null);
    }
  };

  const handleUpdateBand = (updatedBand: { id: string; nome?: string; genero?: string; descricao?: string; logo_url?: string }) => {
    setBands(prevBands => 
      prevBands.map(band => 
        band.id === updatedBand.id ? { 
          ...band, 
          name: updatedBand.nome || band.name,
          genre: updatedBand.genero || band.genre,
          description: updatedBand.descricao || band.description
        } : band
      )
    );
  };

  return (
    <main className="container mx-auto space-y-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bandas</h1>
          <p className="text-muted-foreground">Gerencie todas as bandas e seus membros</p>
        </div>
        <Button variant="hero" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Banda
        </Button>
      </header>

      <section>
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar bandas..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando bandas...
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((band) => (
            <Card 
              key={band.id} 
              className="group cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/20 active:scale-[0.98]"
              onClick={() => handleViewBand(band)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <AvatarImage src={band.logo_url} />
                      <AvatarFallback className="group-hover:bg-primary/20 transition-colors duration-300">{band.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg transition-colors duration-300 group-hover:text-primary">{band.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">{band.genre ?? 'Geral'}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onSelect={(e) => { e?.preventDefault(); e?.stopPropagation(); handleViewBand(band, 'view'); }}
                      >
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={(e) => { e?.preventDefault(); e?.stopPropagation(); handleViewBand(band, 'edit'); }}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onSelect={(e) => handleDeleteClick(band, e)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2">{band.description ?? 'Sem descrição'}</CardDescription>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {band.members_count} membros
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              Nenhuma banda encontrada
            </div>
          )}
        </section>
      )}

      <CreateBandDialog 
        open={open} 
        onOpenChange={setOpen} 
        onBandCreated={() => {
          // Recarregar a lista de bandas após criação
          window.location.reload();
        }} 
      />
      <CompleteBandDialog 
        open={completeDialogOpen} 
        onOpenChange={setCompleteDialogOpen} 
        bandId={selectedBandId} 
        mode={selectedMode}
        onBandUpdated={handleUpdateBand} 
      />

      <AlertDialog open={!!bandToDelete} onOpenChange={() => setBandToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Banda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a banda "{bandToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Bands;
