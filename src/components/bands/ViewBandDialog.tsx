import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Music, Users, Mic, MapPin } from "lucide-react";

interface ViewBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string | null;
}

interface Banda {
  id: string;
  nome: string;
  genero: string;
  influencias: string;
  instagram: string;
  descricao: string;
  anotacoes: string;
  unidade: string;
  created_at: string;
}

interface Integrante {
  id: string;
  nome: string;
  instrumento: string;
  funcao: string;
  curso_la: string;
  telefone: string;
  email: string;
  responsavel: string;
  redes_sociais: string;
  data_entrada: string;
  descricao: string;
  anotacoes: string;
}

interface Repertorio {
  id: string;
  titulo: string;
  artista_original: string;
  genero: string;
  duracao: number;
  tom: string;
  bpm: number;
  tipo: string;
  dificuldade: string;
  observacoes: string;
  letra: string;
}

interface RiderTecnico {
  id: string;
  microfones: string;
  cabos: string;
  amplificadores: string;
  direct_box: string;
  monitores: string;
  canais_mixer: string;
  instrumentos: string;
  tomadas_127v: string;
  tomadas_220v: string;
  palco: string;
  iluminacao: string;
  camarim: string;
  estacionamento: string;
  observacoes: string;
}

interface MapaPalco {
  id: string;
  posicao_vocal: string;
  posicao_guitarra: string;
  posicao_baixo: string;
  posicao_bateria: string;
  posicao_teclado: string;
  posicao_outros: string;
  posicao_amplificadores: string;
  posicao_monitores: string;
  observacoes: string;
}

export function ViewBandDialog({ open, onOpenChange, bandId }: ViewBandDialogProps) {
  const [band, setBand] = useState<Banda | null>(null);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [repertorio, setRepertorio] = useState<Repertorio[]>([]);
  const [riderTecnico, setRiderTecnico] = useState<RiderTecnico | null>(null);
  const [mapaPalco, setMapaPalco] = useState<MapaPalco | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { supabase } = useSupabaseOptimized();
  const { toast } = useToast();

  useEffect(() => {
    if (open && bandId) {
      loadBandData();
    }
  }, [open, bandId]);

  const loadBandData = async () => {
    if (!bandId || !supabase) return;

    setLoading(true);
    try {
      // Load band info
      const { data: bandData, error: bandError } = await supabase
        .from('banda')
        .select('*')
        .eq('id', bandId)
        .single();

      if (bandError) throw bandError;
      setBand(bandData);

      // Load integrantes
      const { data: integrantesData, error: integrantesError } = await supabase
        .from('banda_integrante')
        .select('*')
        .eq('banda_id', bandId);

      if (integrantesError) throw integrantesError;
      setIntegrantes(integrantesData || []);

      // Load repertorio
      const { data: repertorioData, error: repertorioError } = await supabase
        .from('banda_repertorio')
        .select('*')
        .eq('banda_id', bandId);

      if (repertorioError) throw repertorioError;
      setRepertorio(repertorioData || []);

      // Load rider técnico
      const { data: riderData, error: riderError } = await supabase
        .from('banda_rider_tecnico')
        .select('*')
        .eq('banda_id', bandId)
        .single();

      if (riderError && riderError.code !== 'PGRST116') throw riderError;
      setRiderTecnico(riderData || null);

      // Load mapa de palco
      const { data: mapaData, error: mapaError } = await supabase
        .from('banda_mapa_palco')
        .select('*')
        .eq('banda_id', bandId)
        .single();

      if (mapaError && mapaError.code !== 'PGRST116') throw mapaError;
      setMapaPalco(mapaData || null);

    } catch (error) {
      console.error('Error loading band data:', error);
      toast({
        title: "Erro ao carregar dados da banda",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!band) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Music className="h-6 w-6" />
            {band.nome}
          </DialogTitle>
          <DialogDescription>
            Visualização completa das informações da banda
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="members">Integrantes</TabsTrigger>
              <TabsTrigger value="repertoire">Repertório</TabsTrigger>
              <TabsTrigger value="rider">Rider Técnico</TabsTrigger>
              <TabsTrigger value="stage">Mapa de Palco</TabsTrigger>
            </TabsList>

            {/* Aba 1 - Informações da Banda */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Unidade</label>
                  <p className="text-sm text-muted-foreground">{band.unidade}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Gênero</label>
                  <p className="text-sm text-muted-foreground">{band.genero}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Influências</label>
                  <p className="text-sm text-muted-foreground">{band.influencias}</p>
                </div>
                {band.instagram && (
                  <div>
                    <label className="text-sm font-medium">Instagram</label>
                    <a 
                      href={band.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {band.instagram}
                    </a>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{band.descricao}</p>
                </div>
                {band.anotacoes && (
                  <div>
                    <label className="text-sm font-medium">Anotações</label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{band.anotacoes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba 2 - Integrantes */}
            <TabsContent value="members" className="space-y-4">
              {integrantes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum integrante cadastrado</p>
              ) : (
                <div className="space-y-4">
                  {integrantes.map((integrante) => (
                    <div key={integrante.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {integrante.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{integrante.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {integrante.instrumento} - {integrante.funcao}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Curso LA:</label>
                          <p className="text-muted-foreground">{integrante.curso_la}</p>
                        </div>
                        <div>
                          <label className="font-medium">Telefone:</label>
                          <p className="text-muted-foreground">{integrante.telefone}</p>
                        </div>
                        <div>
                          <label className="font-medium">Email:</label>
                          <p className="text-muted-foreground">{integrante.email}</p>
                        </div>
                        <div>
                          <label className="font-medium">Responsável:</label>
                          <p className="text-muted-foreground">{integrante.responsavel}</p>
                        </div>
                        <div>
                          <label className="font-medium">Data de Entrada:</label>
                          <p className="text-muted-foreground">{formatDate(integrante.data_entrada)}</p>
                        </div>
                        {integrante.redes_sociais && (
                          <div>
                            <label className="font-medium">Redes Sociais:</label>
                            <p className="text-muted-foreground">{integrante.redes_sociais}</p>
                          </div>
                        )}
                      </div>
                      
                      {integrante.descricao && (
                        <div>
                          <label className="font-medium">Descrição:</label>
                          <p className="text-sm text-muted-foreground">{integrante.descricao}</p>
                        </div>
                      )}
                      
                      {integrante.anotacoes && (
                        <div>
                          <label className="font-medium">Anotações:</label>
                          <p className="text-sm text-muted-foreground">{integrante.anotacoes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Aba 3 - Repertório */}
            <TabsContent value="repertoire" className="space-y-4">
              {repertorio.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma música cadastrada</p>
              ) : (
                <div className="space-y-4">
                  {repertorio.map((musica) => (
                    <div key={musica.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{musica.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{musica.artista_original}</p>
                        </div>
                        <Badge variant="outline">{musica.genero}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="font-medium">Duração:</label>
                          <p className="text-muted-foreground">{formatDuration(musica.duracao)}</p>
                        </div>
                        <div>
                          <label className="font-medium">Tom:</label>
                          <p className="text-muted-foreground">{musica.tom}</p>
                        </div>
                        <div>
                          <label className="font-medium">BPM:</label>
                          <p className="text-muted-foreground">{musica.bpm}</p>
                        </div>
                        <div>
                          <label className="font-medium">Tipo:</label>
                          <p className="text-muted-foreground">{musica.tipo}</p>
                        </div>
                        <div>
                          <label className="font-medium">Dificuldade:</label>
                          <p className="text-muted-foreground">{musica.dificuldade}</p>
                        </div>
                      </div>
                      
                      {musica.observacoes && (
                        <div className="mt-3">
                          <label className="font-medium">Observações:</label>
                          <p className="text-sm text-muted-foreground">{musica.observacoes}</p>
                        </div>
                      )}
                      
                      {musica.letra && (
                        <div className="mt-3">
                          <label className="font-medium">Letra:</label>
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                            {musica.letra}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Aba 4 - Rider Técnico */}
            <TabsContent value="rider" className="space-y-4">
              {!riderTecnico ? (
                <p className="text-sm text-muted-foreground">Nenhum rider técnico cadastrado</p>
              ) : (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Microfones</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.microfones || 'Não especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cabos</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.cabos || 'Não especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Amplificadores</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.amplificadores || 'Não especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Direct Box</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.direct_box || 'Não especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Monitores</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.monitores || 'Não especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Canais do Mixer</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.canais_mixer || 'Não especificado'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Instrumentos</label>
                    <p className="text-sm text-muted-foreground">{riderTecnico.instrumentos || 'Não especificado'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tomadas 127V</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.tomadas_127v || 'Não especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tomadas 220V</label>
                      <p className="text-sm text-muted-foreground">{riderTecnico.tomadas_220v || 'Não especificado'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Palco</label>
                    <p className="text-sm text-muted-foreground">{riderTecnico.palco || 'Não especificado'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Iluminação</label>
                    <p className="text-sm text-muted-foreground">{riderTecnico.iluminacao || 'Não especificado'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Camarim</label>
                    <p className="text-sm text-muted-foreground">{riderTecnico.camarim || 'Não especificado'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Estacionamento</label>
                    <p className="text-sm text-muted-foreground">{riderTecnico.estacionamento || 'Não especificado'}</p>
                  </div>
                  
                  {riderTecnico.observacoes && (
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{riderTecnico.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Aba 5 - Mapa de Palco */}
            <TabsContent value="stage" className="space-y-4">
              {!mapaPalco ? (
                <p className="text-sm text-muted-foreground">Nenhum mapa de palco cadastrado</p>
              ) : (
                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Layout do Palco
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium">Posição Vocal</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_vocal || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Guitarra</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_guitarra || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Baixo</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_baixo || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Bateria</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_bateria || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Teclado</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_teclado || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Outros</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_outros || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Amplificadores</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_amplificadores || 'Não especificado'}</p>
                      </div>
                      <div>
                        <label className="font-medium">Posição Monitores</label>
                        <p className="text-muted-foreground">{mapaPalco.posicao_monitores || 'Não especificado'}</p>
                      </div>
                    </div>
                    
                    {mapaPalco.observacoes && (
                      <div className="mt-4">
                        <label className="font-medium">Observações Importantes</label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mapaPalco.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}