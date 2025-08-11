import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BandForm {
  name: string;
  genre?: string;
  description?: string;
}

export default function CreateBandDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (band: { id: string; name: string; genre?: string; description?: string; members_count: number; }) => void;
}) {
  const [form, setForm] = useState<BandForm>({ name: "", genre: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onCreate({ id: Math.random().toString(36).slice(2), name: form.name, genre: form.genre, description: form.description, members_count: 1 });
      setLoading(false);
      onOpenChange(false);
      setForm({ name: "", genre: "", description: "" });
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nova Banda</DialogTitle>
            <DialogDescription>Cadastre uma nova banda para gerenciar membros e eventos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Rock Prisma" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Gênero</Label>
            <Input id="genre" value={form.genre} onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))} placeholder="Ex: Rock" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Breve descrição" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="hero" disabled={loading}>{loading ? 'Salvando...' : 'Criar Banda'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
