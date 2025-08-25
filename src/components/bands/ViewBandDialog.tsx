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
  genero: string | null;
  descricao: string | null;
  logo_url: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  spotify: string | null;
  apple_music: string | null;
  soundcloud: string | null;
  bandcamp: string | null;
  tenant_id: string;
  unidade_id: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

interface Integrante {
  id: string;
  nome: string;
  instrumento: string;
  funcao: string | null;
  telefone: string | null;
  email: string | null;
  data_entrada: string;
  data_saida: string | null;
  ativo: boolean;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  spotify: string | null;
  observacoes: string | null;
  tenant_id: string;
  banda_id: string;
  created_at: string;
  updated_at: string;
}

interface Repertorio {
  id: string;
  titulo: string;
  artista_original: string | null;
  genero: string | null;
  duracao_minutos: number | null;
  tom: string | null;
  bpm: number | null;
  tipo: string;
  dificuldade: string;
  observacoes: string | null;
  letra: string | null;
  cifra: string | null;
  arquivo_audio_url: string | null;
  ativo: boolean;
  tenant_id: string;
  banda_id: string;
  created_at: string;
  updated_at: string;
}

interface RiderTecnico {
  id: string;
  nome: string;
  descricao: string | null;
  microfones_vocal: number;
  microfones_instrumento: number;
  direct_boxes: number;
  monitores_palco: number;
  canais_mixer: number;
  tomadas_110v: number;
  tomadas_220v: number;
  extensoes_necessarias: boolean;
  cobertura_necessaria: boolean;
  iluminacao_basica: boolean;
  iluminacao_especial: string | null;
  camarim_necessario: boolean;
  estacionamento_necessario: boolean;
  seguranca_necessaria: boolean;
  altura_palco_minima: string | null;
  tamanho_palco_minimo: string | null;
  equipamentos_especiais: string | null;
  instrumentos_fornecidos: string | null;
  amplificadores: string | null;
  observacoes_gerais: string | null;
  tenant_id: string;
  banda_id: string;
  created_at: string;
  updated_at: string;
}

interface MapaPalco {
  id: string;
  nome: string;
  descricao: string | null;
  posicao_vocal: string | null;
  posicao_guitarra: string | null;
  posicao_baixo: string | null;
  posicao_bateria: string | null;
  posicao_teclado: string | null;
  posicoes_outros: string | null;
  posicao_amplificadores: string | null;
  posicao_monitores: string | null;
  posicao_microfones: string | null;
  layout_json: any;
  observacoes: string | null;
  tenant_id: string;
  banda_id: string;
  created_at: string;
  updated_at: string;
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
                {band.genero && (
                  <div>
                    <label className="text-sm font-medium">Gênero</label>
                    <p className="text-sm text-muted-foreground">{band.genero}</p>
                  </div>
                )}
                {band.descricao && (
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{band.descricao}</p>
                  </div>
                )}
                {band.website && (
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <a 
                      href={band.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {band.website}
                    </a>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Redes Sociais</label>
                  <div className="grid grid-cols-2 gap-2">
                    {band.instagram && (
                      <a 
                        href={band.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Instagram
                      </a>
                    )}
                    {band.facebook && (
                      <a 
                        href={band.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Facebook
                      </a>
                    )}
                    {band.youtube && (
                      <a 
                        href={band.youtube} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        YouTube
                      </a>
                    )}
                    {band.spotify && (
                      <a 
                        href={band.spotify} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Spotify
                      </a>
                    )}
                    {band.apple_music && (
                      <a 
                        href={band.apple_music} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Apple Music
                      </a>
                    )}
                    {band.soundcloud && (
                      <a 
                        href={band.soundcloud} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        SoundCloud
                      </a>
                    )}
                    {band.bandcamp && (
                      <a 
                        href={band.bandcamp} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Bandcamp
                      </a>
                    )}
                  </div>
                </div>
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
                        {integrante.telefone && (
                          <div>
                            <label className="font-medium">Telefone:</label>
                            <p className="text-muted-foreground">{integrante.telefone}</p>
                          </div>
                        )}
                        {integrante.email && (
                          <div>
                            <label className="font-medium">Email:</label>
                            <p className="text-muted-foreground">{integrante.email}</p>
                          </div>
                        )}
                        <div>
                          <label className="font-medium">Data de Entrada:</label>
                          <p className="text-muted-foreground">{formatDate(integrante.data_entrada)}</p>
                        </div>
                        {integrante.data_saida && (
                          <div>
                            <label className="font-medium">Data de Saída:</label>
                            <p className="text-muted-foreground">{formatDate(integrante.data_saida)}</p>
                          </div>
                        )}
                        <div>
                          <label className="font-medium">Status:</label>
                          <p className="text-muted-foreground">{integrante.ativo ? 'Ativo' : 'Inativo'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium">Redes Sociais:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {integrante.instagram && (
                            <a 
                              href={integrante.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Instagram
                            </a>
                          )}
                          {integrante.facebook && (
                            <a 
                              href={integrante.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Facebook
                            </a>
                          )}
                          {integrante.youtube && (
                            <a 
                              href={integrante.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              YouTube
                            </a>
                          )}
                          {integrante.spotify && (
                            <a 
                              href={integrante.spotify} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Spotify
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {integrante.observacoes && (
                        <div>
                          <label className="font-medium">Observações:</label>
                          <p className="text-sm text-muted-foreground">{integrante.observacoes}</p>
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
                        {musica.duracao_minutos && (
                          <div>
                            <label className="font-medium">Duração:</label>
                            <p className="text-muted-foreground">{formatDuration(musica.duracao_minutos)}</p>
                          </div>
                        )}
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
                <div className="grid gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Equipamentos de Áudio</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Microfones Vocal</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.microfones_vocal || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Microfones Instrumento</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.microfones_instrumento || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Direct Boxes</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.direct_boxes || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Monitores de Palco</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.monitores_palco || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Canais do Mixer</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.canais_mixer || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Energia</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Tomadas 110V</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.tomadas_110v || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tomadas 220V</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.tomadas_220v || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Extensões Necessárias</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.extensoes_necessarias ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Estrutura</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Cobertura Necessária</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.cobertura_necessaria ? 'Sim' : 'Não'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Iluminação Básica</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.iluminacao_basica ? 'Sim' : 'Não'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Camarim Necessário</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.camarim_necessario ? 'Sim' : 'Não'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Estacionamento Necessário</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.estacionamento_necessario ? 'Sim' : 'Não'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Segurança Necessária</label>
                        <p className="text-sm text-muted-foreground">{riderTecnico.seguranca_necessaria ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                  </div>

                  {(riderTecnico.altura_palco_minima || riderTecnico.tamanho_palco_minimo) && (
                    <div>
                      <h4 className="font-semibold mb-3">Especificações do Palco</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {riderTecnico.altura_palco_minima && (
                          <div>
                            <label className="text-sm font-medium">Altura Mínima do Palco</label>
                            <p className="text-sm text-muted-foreground">{riderTecnico.altura_palco_minima}</p>
                          </div>
                        )}
                        {riderTecnico.tamanho_palco_minimo && (
                          <div>
                            <label className="text-sm font-medium">Tamanho Mínimo do Palco</label>
                            <p className="text-sm text-muted-foreground">{riderTecnico.tamanho_palco_minimo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(riderTecnico.equipamentos_especiais || riderTecnico.instrumentos_fornecidos || riderTecnico.amplificadores) && (
                    <div>
                      <h4 className="font-semibold mb-3">Equipamentos</h4>
                      <div className="space-y-3">
                        {riderTecnico.equipamentos_especiais && (
                          <div>
                            <label className="text-sm font-medium">Equipamentos Especiais</label>
                            <p className="text-sm text-muted-foreground">{riderTecnico.equipamentos_especiais}</p>
                          </div>
                        )}
                        {riderTecnico.instrumentos_fornecidos && (
                          <div>
                            <label className="text-sm font-medium">Instrumentos Fornecidos</label>
                            <p className="text-sm text-muted-foreground">{riderTecnico.instrumentos_fornecidos}</p>
                          </div>
                        )}
                        {riderTecnico.amplificadores && (
                          <div>
                            <label className="text-sm font-medium">Amplificadores</label>
                            <p className="text-sm text-muted-foreground">{riderTecnico.amplificadores}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(riderTecnico.iluminacao_especial || riderTecnico.observacoes_gerais) && (
                    <div>
                      <h4 className="font-semibold mb-3">Observações</h4>
                      <div className="space-y-3">
                        {riderTecnico.iluminacao_especial && (
                          <div>
                            <label className="text-sm font-medium">Iluminação Especial</label>
                            <p className="text-sm text-muted-foreground">{riderTecnico.iluminacao_especial}</p>
                          </div>
                        )}
                        {riderTecnico.observacoes_gerais && (
                          <div>
                            <label className="text-sm font-medium">Observações Gerais</label>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{riderTecnico.observacoes_gerais}</p>
                          </div>
                        )}
                      </div>
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
                        <p className="text-muted-foreground">{mapaPalco.posicoes_outros || 'Não especificado'}</p>
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