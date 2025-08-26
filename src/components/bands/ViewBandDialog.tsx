import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Users, Calendar } from "lucide-react";

interface ViewBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string | null;
  onEdit?: (band: Banda) => void;
}

interface Banda {
  id: string;
  nome: string;
  genero?: string;
  descricao?: string;
  logo_url?: string;
  created_at: string;
  ativa: boolean;
  members_count?: number;
}

export function ViewBandDialog({ open, onOpenChange, bandId, onEdit }: ViewBandDialogProps) {
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
        .from('vw_bandas_lista')
        .select('*')
        .eq('id', bandId)
        .maybeSingle();
      
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membros
                  </h4>
                  <p>{band.members_count || 0}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Criada em
                  </h4>
                  <p>{new Date(band.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {onEdit && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => onEdit(band)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Banda
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}