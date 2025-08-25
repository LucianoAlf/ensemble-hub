import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { toast } from "sonner";

interface CreateBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBandCreated: (band: any) => void;
}

interface BandInfo {
  nome: string;
  genero: string;
  descricao: string;
}

export function CreateBandDialog({ open, onOpenChange, onBandCreated }: CreateBandDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bandInfo, setBandInfo] = useState<BandInfo>({ nome: "", genero: "", descricao: "" });
  const { supabase: client } = useSupabaseOptimized();

  const handleSubmit = async () => {
    if (!bandInfo.nome.trim()) {
      toast.error("Nome da banda é obrigatório");
      return;
    }

    if (!client) {
      console.error('Supabase client não está disponível');
      toast.error("Erro de conexão com o banco de dados");
      return;
    }

    setIsLoading(true);
    try {
      // Criar banda via função RPC para preencher tenant_id automaticamente
      const { data: rpcData, error: bandError } = await client.rpc('create_banda', {
        p_nome: bandInfo.nome,
        p_genero: bandInfo.genero || null,
        p_descricao: bandInfo.descricao || null,
        p_logo_url: null
      });

      if (bandError) throw bandError;

      const bandData = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!bandData || !bandData.id) {
        throw new Error('Falha ao criar banda: resposta inválida do servidor');
      }

      toast.success("Banda criada com sucesso!");
      onBandCreated(bandData);
      onOpenChange(false);
      
      // Reset form
      setBandInfo({
        nome: "",
        genero: "",
        descricao: ""
      });
    } catch (error: any) {
      console.error('Erro ao criar banda:', error);
      toast.error(error.message || "Erro ao criar banda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Banda</DialogTitle>
          <DialogDescription>
            Cadastre uma nova banda com as informações básicas
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
            {isLoading ? "Salvando..." : "Criar Banda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}