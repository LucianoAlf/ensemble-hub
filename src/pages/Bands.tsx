import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Users, Loader2 } from "lucide-react";
import { CreateBandDialog } from "@/components/bands/CreateBandDialog";
import { EditBandDialog } from "@/components/bands/EditBandDialog";
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
    title: "Bandas — LA Music Hub",
    description: "Gerencie bandas, gêneros, membros e logos.",
    canonical: window.location.origin + "/bands",
  });

  const [bands, setBands] = useState<Band[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { query: querySupabase } = useSupabaseOptimized();
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

        const mapped: Band[] = (res?.data || []).map((row: any) => ({
          id: row.id,
          name: row.nome,
          genre: row.genero || undefined,
          description: row.descricao || undefined,
          logo_url: row.logo_url || undefined,
          members_count: Number(row.membros_count || 0),
        }));
        setBands(mapped);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
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

  const handleEditBand = (band: Band) => {
    setSelectedBand(band);
    setEditOpen(true);
  };

  const handleUpdateBand = (updatedBand: Band) => {
    setBands(prevBands => 
      prevBands.map(band => 
        band.id === updatedBand.id ? updatedBand : band
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
              onClick={() => handleEditBand(band)}
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
      <EditBandDialog 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        band={selectedBand} 
        onBandUpdated={handleUpdateBand} 
      />
    </main>
  );
};

export default Bands;
