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
      console.log('Iniciando criação de banda com dados:', {
        nome: bandInfo.nome,
        genero: bandInfo.genero,
        descricao: bandInfo.descricao
      });

      // Verificar se usuário tem tenant_id
      const { data: session } = await client.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Usuário autenticado:', session.session.user.id);

      // Criar banda via função RPC para preencher tenant_id automaticamente
      const { data: rpcData, error: bandError } = await client.rpc('create_banda', {
        p_nome: bandInfo.nome,
        p_genero: bandInfo.genero || null,
        p_descricao: bandInfo.descricao || null,
        p_logo_url: null
      });

      console.log('Resposta RPC create_banda:', { data: rpcData, error: bandError });

      if (bandError) {
        console.error('Erro RPC detalhado:', {
          message: bandError.message,
          details: bandError.details,
          hint: bandError.hint,
          code: bandError.code
        });
        throw bandError;
      }

      const bandData = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      console.log('Dados da banda processados:', bandData);

      if (!bandData || !bandData.id) {
        throw new Error('Falha ao criar banda: resposta inválida do servidor');
      }

      console.log('Banda criada com sucesso:', bandData);
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
      console.error('Erro detalhado ao criar banda:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = "Erro ao criar banda";
      if (error.message?.includes('tenant_id')) {
        errorMessage = "Erro de configuração do usuário. Entre em contato com o suporte.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Você não tem permissão para criar bandas.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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