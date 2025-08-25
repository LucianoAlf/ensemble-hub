import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useToast } from "@/hooks/use-toast";

interface EditBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  band: any | null;
  onBandUpdated: (band: any) => void;
}

interface BandInfo {
  nome: string;
  genero: string;
  descricao: string;
}

export function EditBandDialog({ open, onOpenChange, band, onBandUpdated }: EditBandDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bandInfo, setBandInfo] = useState<BandInfo>({ nome: "", genero: "", descricao: "" });
  const { supabase } = useSupabaseOptimized();
  const { toast } = useToast();

  useEffect(() => {
    if (band && open) {
      setBandInfo({
        nome: band.nome || "",
        genero: band.genero || "",
        descricao: band.descricao || ""
      });
    }
  }, [band, open]);

  const handleSubmit = async () => {
    if (!bandInfo.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da banda é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!band?.id) {
      toast({
        title: "Erro", 
        description: "ID da banda não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banda')
        .update({
          nome: bandInfo.nome,
          genero: bandInfo.genero || null,
          descricao: bandInfo.descricao || null
        })
        .eq('id', band.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Banda atualizada com sucesso!",
      });
      
      onBandUpdated(data);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar banda:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar banda",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Banda</DialogTitle>
          <DialogDescription>
            Edite as informações básicas da banda
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Banda</CardTitle>
            <CardDescription>Dados básicos da banda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Banda *</Label>
              <Input
                id="nome"
                value={bandInfo.nome}
                onChange={(e) => setBandInfo({...bandInfo, nome: e.target.value})}
                placeholder="Ex: Rock Prisma"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="genero">Gênero</Label>
              <Input
                id="genero"
                value={bandInfo.genero}
                onChange={(e) => setBandInfo({...bandInfo, genero: e.target.value})}
                placeholder="Ex: Rock, Pop, Jazz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={bandInfo.descricao}
                onChange={(e) => setBandInfo({...bandInfo, descricao: e.target.value})}
                placeholder="Descrição da banda, estilo musical, história..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}