import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ViewBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string | null;
}

interface Banda {
  id: string;
  nome: string;
  genero?: string;
  descricao?: string;
  created_at: string;
  ativa: boolean;
}

export function ViewBandDialog({ open, onOpenChange, bandId }: ViewBandDialogProps) {
  const [band, setBand] = useState<Banda | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { supabase } = useSupabaseOptimized();
  const { toast } = useToast();

  useEffect(() => {
    if (open && bandId) {
      loadBandData();
    }
  }, [open, bandId]);

  const loadBandData = async () => {
    if (!bandId) return;
    
    setLoading(true);
    try {
      const { data: bandData, error: bandError } = await supabase
        .from('banda')
        .select('*')
        .eq('id', bandId)
        .single();
      
      if (bandError) throw bandError;
      setBand(bandData);
      
    } catch (error) {
      console.error('Erro ao carregar dados da banda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da banda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados da banda...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!band) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Não foi possível carregar os dados da banda.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {band.nome}
            <Badge variant={band.ativa ? "default" : "secondary"}>
              {band.ativa ? "Ativa" : "Inativa"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualizar informações da banda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Nome</h4>
                <p>{band.nome}</p>
              </div>
              
              {band.genero && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Gênero</h4>
                  <p>{band.genero}</p>
                </div>
              )}
              
              {band.descricao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Descrição</h4>
                  <p className="whitespace-pre-wrap">{band.descricao}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Data de Criação</h4>
                <p>{new Date(band.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}