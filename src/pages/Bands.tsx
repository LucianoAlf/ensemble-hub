import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Users } from "lucide-react";
import CreateBandDialog from "@/components/bands/CreateBandDialog";

interface Band {
  id: string;
  name: string;
  genre?: string;
  description?: string;
  logo_url?: string;
  members_count: number;
}

const initialBands: Band[] = [
  { id: "1", name: "Banda Aurora", genre: "Pop", description: "Som moderno com influências eletrônicas.", members_count: 5 },
  { id: "2", name: "Trio Jazz Nova", genre: "Jazz", description: "Improvisos e grooves clássicos.", members_count: 3 },
  { id: "3", name: "Rock Prisma", genre: "Rock", description: "Guitarras pesadas e refrões marcantes.", members_count: 4 },
];

const Bands = () => {
  useSEO({
    title: "Bandas — LA Music Hub",
    description: "Gerencie bandas, gêneros, membros e logos.",
    canonical: window.location.origin + "/bands",
  });

  const [bands, setBands] = useState<Band[]>(initialBands);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = bands.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase()) ||
    b.genre?.toLowerCase().includes(query.toLowerCase())
  );

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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((band) => (
          <Card key={band.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={band.logo_url} />
                    <AvatarFallback>{band.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{band.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">{band.genre ?? 'Geral'}</Badge>
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
      </section>

      <CreateBandDialog open={open} onOpenChange={setOpen} onCreate={(b) => setBands([b, ...bands])} />
    </main>
  );
};

export default Bands;
