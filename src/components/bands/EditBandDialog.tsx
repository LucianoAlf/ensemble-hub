import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
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

interface BandForm {
  name: string;
  genre?: string;
  description?: string;
}

interface BandInfo {
  unidade: string;
  nome: string;
  genero: string;
  influencias: string;
  instagram: string;
  youtube: string;
  spotify: string;
  descricao: string;
  anotacoes: string;
}

interface Integrante {
  id?: string;
  nome: string;
  instrumento: string;
  funcao: string;
  curso: string;
  telefone: string;
  email: string;
  responsavel: boolean;
  instagram: string;
  data_entrada: string;
  descricao: string;
  anotacoes: string;
}

interface Repertorio {
  id?: string;
  titulo: string;
  artista_original: string;
  genero: string;
  duracao: string;
  tom: string;
  bpm: string;
  tipo: string;
  dificuldade: string;
  observacoes: string;
  letra: string;
}

interface RiderTecnico {
  id?: string;
  microfones: string;
  cabos: string;
  amplificadores: string;
  direct_box: string;
  monitores: string;
  canais_mixer: string;
  instrumentos: string;
  tomadas: string;
  palco: string;
  iluminacao: string;
  camarim: string;
  estacionamento: string;
  observacoes: string;
}

interface MapaPalco {
  id?: string;
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

interface Unidade { id: string; nome: string }

export default function EditBandDialog({
  open,
  onOpenChange,
  band,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  band: Band | null;
  onUpdate: (updatedBand: Band) => void;
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [bandInfo, setBandInfo] = useState<BandInfo>({
    unidade: "",
    nome: "",
    genero: "",
    influencias: "",
    instagram: "",
    youtube: "",
    spotify: "",
    descricao: "",
    anotacoes: ""
  });
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [riderTecnico, setRiderTecnico] = useState<RiderTecnico>({
    microfones: "",
    cabos: "",
    amplificadores: "",
    direct_box: "",
    monitores: "",
    canais_mixer: "",
    instrumentos: "",
    tomadas: "",
    palco: "",
    iluminacao: "",
    camarim: "",
    estacionamento: "",
    observacoes: ""
  });
  const [mapaPalco, setMapaPalco] = useState<MapaPalco>({
    posicao_vocal: "",
    posicao_guitarra: "",
    posicao_baixo: "",
    posicao_bateria: "",
    posicao_teclado: "",
    posicao_outros: "",
    posicao_amplificadores: "",
    posicao_monitores: "",
    observacoes: ""
  });
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const { mutate, supabase } = useSupabaseOptimized();
  const { toast } = useToast();

  useEffect(() => {
    if (band && open) {
      loadBandData();
    }
  }, [band, open]);

  // Carregar unidades para o Select quando o diálogo abrir
  useEffect(() => {
    if (!open) return;
    const loadUnidades = async () => {
      const { data, error } = await supabase
        .from('unidade')
        .select('id, nome')
        .order('nome', { ascending: true });
      if (error) {
        toast({ title: 'Erro ao carregar unidades', variant: 'destructive' });
        return;
      }
      setUnidades(data || []);
    };
    loadUnidades();
  }, [open]);

  const loadBandData = async () => {
    if (!band) return;
    setLoading(true);
    try {
      // Carregar info da banda
      const { data: bandData } = await supabase.from('banda').select('*').eq('id', band.id).single();
      if (bandData) {
        setBandInfo((prev) => ({
          ...prev,
          nome: bandData.nome || "",
          genero: bandData.genero || "",
          descricao: bandData.descricao || "",
          unidade: bandData.unidade_id || "",
        }));
      }

      // Carregar integrantes
      const { data: intData } = await supabase.from('banda_integrante').select('*').eq('banda_id', band.id);
      setIntegrantes(intData || []);

      // Carregar repertórios
      const { data: repData } = await supabase.from('banda_repertorio').select('*').eq('banda_id', band.id);
      setRepertorios(repData || []);

      // Carregar rider
      const { data: riderData } = await supabase.from('banda_rider_tecnico').select('*').eq('banda_id', band.id).single();
      if (riderData) setRiderTecnico(riderData);

      // Carregar mapa
      const { data: mapaData } = await supabase.from('banda_mapa_palco').select('*').eq('banda_id', band.id).single();
      if (mapaData) setMapaPalco(mapaData);
    } catch (err) {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Funções para integrantes
  const addIntegrante = () => {
    setIntegrantes([...integrantes, {
      nome: "",
      instrumento: "",
      funcao: "",
      curso: "",
      telefone: "",
      email: "",
      responsavel: false,
      instagram: "",
      data_entrada: "",
      descricao: "",
      anotacoes: ""
    }]);
  };

  const removeIntegrante = async (index: number, id?: string) => {
    if (id) {
      await supabase.from('banda_integrante').delete().eq('id', id);
    }
    setIntegrantes(integrantes.filter((_, i) => i !== index));
  };

  const updateIntegrante = (index: number, field: keyof Integrante, value: any) => {
    const updated = [...integrantes];
    updated[index] = { ...updated[index], [field]: value };
    setIntegrantes(updated);
  };

  // Funções para repertórios
  const addRepertorio = () => {
    setRepertorios([...repertorios, {
      titulo: "",
      artista_original: "",
      genero: "",
      duracao: "",
      tom: "",
      bpm: "",
      tipo: "",
      dificuldade: "",
      observacoes: "",
      letra: ""
    }]);
  };

  const removeRepertorio = async (index: number, id?: string) => {
    if (id) {
      await supabase.from('banda_repertorio').delete().eq('id', id);
    }
    setRepertorios(repertorios.filter((_, i) => i !== index));
  };

  const updateRepertorio = (index: number, field: keyof Repertorio, value: string) => {
    const updated = [...repertorios];
    updated[index] = { ...updated[index], [field]: value };
    setRepertorios(updated);
  };

  const handleSubmit = async () => {
    if (!band) return;
    // Validação
    if (!bandInfo.nome.trim()) {
      toast({ title: "Erro de validação", description: "O nome da banda é obrigatório.", variant: "destructive" });
      setActiveTab("info");
      return;
    }
    if (integrantes.length === 0) {
      toast({ title: "Erro de validação", description: "Pelo menos um integrante é obrigatório.", variant: "destructive" });
      setActiveTab("integrantes");
      return;
    }
    for (const int of integrantes) {
      if (!int.nome.trim()) {
        toast({ title: "Erro de validação", description: "Nome do integrante é obrigatório.", variant: "destructive" });
        setActiveTab("integrantes");
        return;
      }
    }
    for (const rep of repertorios) {
      if (!rep.titulo.trim()) {
        toast({ title: "Erro de validação", description: "Título da música é obrigatório.", variant: "destructive" });
        setActiveTab("repertorio");
        return;
      }
    }
    // Outras validações semelhantes para rider e mapa se necessário
    setLoading(true);
    try {
      // Atualizar banda
      await supabase.from('banda').update({ nome: bandInfo.nome, genero: bandInfo.genero, descricao: bandInfo.descricao }).eq('id', band.id);
      if (bandInfo.unidade) {
        await supabase.from('banda').update({ unidade_id: bandInfo.unidade }).eq('id', band.id);
      } else {
        await supabase.from('banda').update({ unidade_id: null }).eq('id', band.id);
      }
      // Atualizar/Inserir integrantes
      for (const int of integrantes) {
        if (int.id) {
          await supabase.from('banda_integrante').update(int).eq('id', int.id);
        } else {
          await supabase.from('banda_integrante').insert({ ...int, banda_id: band.id });
        }
      }

      // Atualizar/Inserir repertórios
      for (const rep of repertorios) {
        if (rep.id) {
          await supabase.from('banda_repertorio').update(rep).eq('id', rep.id);
        } else {
          await supabase.from('banda_repertorio').insert({ ...rep, banda_id: band.id });
        }
      }

      // Atualizar rider
      if (riderTecnico.id) {
        await supabase.from('banda_rider_tecnico').update(riderTecnico).eq('id', riderTecnico.id);
      } else {
        await supabase.from('banda_rider_tecnico').insert({ ...riderTecnico, banda_id: band.id });
      }

      // Atualizar mapa
      if (mapaPalco.id) {
        await supabase.from('banda_mapa_palco').update(mapaPalco).eq('id', mapaPalco.id);
      } else {
        await supabase.from('banda_mapa_palco').insert({ ...mapaPalco, banda_id: band.id });
      }

      toast({ title: "Banda atualizada com sucesso!" });
      onUpdate({ ...band, name: bandInfo.nome, genre: bandInfo.genero, description: bandInfo.descricao });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Banda</DialogTitle>
          <DialogDescription>Atualize as informações da banda.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="integrantes">Integrantes</TabsTrigger>
            <TabsTrigger value="repertorio">Repertório</TabsTrigger>
            <TabsTrigger value="rider">Rider Técnico</TabsTrigger>
            <TabsTrigger value="mapa">Mapa de Palco</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Banda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unidade">Unidade</Label>
                    <Select value={bandInfo.unidade} onValueChange={(v) => setBandInfo({ ...bandInfo, unidade: v })}>
                      <SelectTrigger id="unidade" disabled={unidades.length === 0}>
                        <SelectValue placeholder={unidades.length === 0 ? 'Nenhuma unidade cadastrada' : 'Selecione uma unidade'} />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={bandInfo.nome} onChange={(e) => setBandInfo({...bandInfo, nome: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="genero">Gênero</Label>
                    <Input id="genero" value={bandInfo.genero} onChange={(e) => setBandInfo({...bandInfo, genero: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="influencias">Influências</Label>
                    <Input id="influencias" value={bandInfo.influencias} onChange={(e) => setBandInfo({...bandInfo, influencias: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" value={bandInfo.instagram} onChange={(e) => setBandInfo({...bandInfo, instagram: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input id="youtube" value={bandInfo.youtube} onChange={(e) => setBandInfo({...bandInfo, youtube: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="spotify">Spotify</Label>
                    <Input id="spotify" value={bandInfo.spotify} onChange={(e) => setBandInfo({...bandInfo, spotify: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" value={bandInfo.descricao} onChange={(e) => setBandInfo({...bandInfo, descricao: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="anotacoes">Anotações</Label>
                  <Textarea id="anotacoes" value={bandInfo.anotacoes} onChange={(e) => setBandInfo({...bandInfo, anotacoes: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="integrantes">
            <Card>
              <CardHeader>
                <CardTitle>Integrantes</CardTitle>
                <Button onClick={addIntegrante} className="ml-auto"><Plus className="mr-2 h-4 w-4" /> Adicionar Integrante</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {integrantes.map((integrante, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Integrante {index + 1}</h3>
                      <Button variant="destructive" size="sm" onClick={() => removeIntegrante(index, integrante.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`int-nome-${index}`}>Nome</Label>
                        <Input id={`int-nome-${index}`} value={integrante.nome} onChange={(e) => updateIntegrante(index, 'nome', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-instrumento-${index}`}>Instrumento</Label>
                        <Input id={`int-instrumento-${index}`} value={integrante.instrumento} onChange={(e) => updateIntegrante(index, 'instrumento', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-funcao-${index}`}>Função</Label>
                        <Input id={`int-funcao-${index}`} value={integrante.funcao} onChange={(e) => updateIntegrante(index, 'funcao', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-curso-${index}`}>Curso</Label>
                        <Input id={`int-curso-${index}`} value={integrante.curso} onChange={(e) => updateIntegrante(index, 'curso', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-telefone-${index}`}>Telefone</Label>
                        <Input id={`int-telefone-${index}`} value={integrante.telefone} onChange={(e) => updateIntegrante(index, 'telefone', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-email-${index}`}>Email</Label>
                        <Input id={`int-email-${index}`} value={integrante.email} onChange={(e) => updateIntegrante(index, 'email', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-instagram-${index}`}>Instagram</Label>
                        <Input id={`int-instagram-${index}`} value={integrante.instagram} onChange={(e) => updateIntegrante(index, 'instagram', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`int-data-entrada-${index}`}>Data de Entrada</Label>
                        <Input id={`int-data-entrada-${index}`} type="date" value={integrante.data_entrada} onChange={(e) => updateIntegrante(index, 'data_entrada', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor={`int-descricao-${index}`}>Descrição</Label>
                      <Textarea id={`int-descricao-${index}`} value={integrante.descricao} onChange={(e) => updateIntegrante(index, 'descricao', e.target.value)} />
                    </div>
                    <div className="mt-4">
                      <Label htmlFor={`int-anotacoes-${index}`}>Anotações</Label>
                      <Textarea id={`int-anotacoes-${index}`} value={integrante.anotacoes} onChange={(e) => updateIntegrante(index, 'anotacoes', e.target.value)} />
                    </div>
                    <div className="mt-4">
                      <Label>Responsável</Label>
                      <Select value={integrante.responsavel ? 'true' : 'false'} onValueChange={(v) => updateIntegrante(index, 'responsavel', v === 'true')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="repertorio">
            <Card>
              <CardHeader>
                <CardTitle>Repertório</CardTitle>
                <Button onClick={addRepertorio} className="ml-auto"><Plus className="mr-2 h-4 w-4" /> Adicionar Música</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {repertorios.map((repertorio, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Música {index + 1}</h3>
                      <Button variant="destructive" size="sm" onClick={() => removeRepertorio(index, repertorio.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`rep-titulo-${index}`}>Título</Label>
                        <Input id={`rep-titulo-${index}`} value={repertorio.titulo} onChange={(e) => updateRepertorio(index, 'titulo', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-artista-${index}`}>Artista Original</Label>
                        <Input id={`rep-artista-${index}`} value={repertorio.artista_original} onChange={(e) => updateRepertorio(index, 'artista_original', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-genero-${index}`}>Gênero</Label>
                        <Input id={`rep-genero-${index}`} value={repertorio.genero} onChange={(e) => updateRepertorio(index, 'genero', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-duracao-${index}`}>Duração</Label>
                        <Input id={`rep-duracao-${index}`} value={repertorio.duracao} onChange={(e) => updateRepertorio(index, 'duracao', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-tom-${index}`}>Tom</Label>
                        <Input id={`rep-tom-${index}`} value={repertorio.tom} onChange={(e) => updateRepertorio(index, 'tom', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-bpm-${index}`}>BPM</Label>
                        <Input id={`rep-bpm-${index}`} value={repertorio.bpm} onChange={(e) => updateRepertorio(index, 'bpm', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-tipo-${index}`}>Tipo</Label>
                        <Input id={`rep-tipo-${index}`} value={repertorio.tipo} onChange={(e) => updateRepertorio(index, 'tipo', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-dificuldade-${index}`}>Dificuldade</Label>
                        <Input id={`rep-dificuldade-${index}`} value={repertorio.dificuldade} onChange={(e) => updateRepertorio(index, 'dificuldade', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor={`rep-observacoes-${index}`}>Observações</Label>
                      <Textarea id={`rep-observacoes-${index}`} value={repertorio.observacoes} onChange={(e) => updateRepertorio(index, 'observacoes', e.target.value)} />
                    </div>
                    <div className="mt-4">
                      <Label htmlFor={`rep-letra-${index}`}>Letra</Label>
                      <Textarea id={`rep-letra-${index}`} value={repertorio.letra} onChange={(e) => updateRepertorio(index, 'letra', e.target.value)} />
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="rider">
            <Card>
              <CardHeader>
                <CardTitle>Rider Técnico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="microfones">Microfones</Label>
                    <Input id="microfones" value={riderTecnico.microfones} onChange={(e) => setRiderTecnico({ ...riderTecnico, microfones: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="cabos">Cabos</Label>
                    <Input id="cabos" value={riderTecnico.cabos} onChange={(e) => setRiderTecnico({ ...riderTecnico, cabos: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="amplificadores">Amplificadores</Label>
                    <Input id="amplificadores" value={riderTecnico.amplificadores} onChange={(e) => setRiderTecnico({ ...riderTecnico, amplificadores: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="direct_box">Direct Box</Label>
                    <Input id="direct_box" value={riderTecnico.direct_box} onChange={(e) => setRiderTecnico({ ...riderTecnico, direct_box: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="monitores">Monitores</Label>
                    <Input id="monitores" value={riderTecnico.monitores} onChange={(e) => setRiderTecnico({ ...riderTecnico, monitores: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="canais_mixer">Canais Mixer</Label>
                    <Input id="canais_mixer" value={riderTecnico.canais_mixer} onChange={(e) => setRiderTecnico({ ...riderTecnico, canais_mixer: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="instrumentos">Instrumentos</Label>
                    <Input id="instrumentos" value={riderTecnico.instrumentos} onChange={(e) => setRiderTecnico({ ...riderTecnico, instrumentos: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="tomadas">Tomadas</Label>
                    <Input id="tomadas" value={riderTecnico.tomadas} onChange={(e) => setRiderTecnico({ ...riderTecnico, tomadas: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="palco">Palco</Label>
                    <Input id="palco" value={riderTecnico.palco} onChange={(e) => setRiderTecnico({ ...riderTecnico, palco: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="iluminacao">Iluminação</Label>
                    <Input id="iluminacao" value={riderTecnico.iluminacao} onChange={(e) => setRiderTecnico({ ...riderTecnico, iluminacao: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="camarim">Camarim</Label>
                    <Input id="camarim" value={riderTecnico.camarim} onChange={(e) => setRiderTecnico({ ...riderTecnico, camarim: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="estacionamento">Estacionamento</Label>
                    <Input id="estacionamento" value={riderTecnico.estacionamento} onChange={(e) => setRiderTecnico({ ...riderTecnico, estacionamento: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" value={riderTecnico.observacoes} onChange={(e) => setRiderTecnico({ ...riderTecnico, observacoes: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mapa">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Palco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="posicao_vocal">Posição Vocal</Label>
                    <Input id="posicao_vocal" value={mapaPalco.posicao_vocal} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_vocal: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_guitarra">Posição Guitarra</Label>
                    <Input id="posicao_guitarra" value={mapaPalco.posicao_guitarra} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_guitarra: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_baixo">Posição Baixo</Label>
                    <Input id="posicao_baixo" value={mapaPalco.posicao_baixo} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_baixo: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_bateria">Posição Bateria</Label>
                    <Input id="posicao_bateria" value={mapaPalco.posicao_bateria} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_bateria: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_teclado">Posição Teclado</Label>
                    <Input id="posicao_teclado" value={mapaPalco.posicao_teclado} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_teclado: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_outros">Posição Outros</Label>
                    <Input id="posicao_outros" value={mapaPalco.posicao_outros} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_outros: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_amplificadores">Posição Amplificadores</Label>
                    <Input id="posicao_amplificadores" value={mapaPalco.posicao_amplificadores} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_amplificadores: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_monitores">Posição Monitores</Label>
                    <Input id="posicao_monitores" value={mapaPalco.posicao_monitores} onChange={(e) => setMapaPalco({ ...mapaPalco, posicao_monitores: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" value={mapaPalco.observacoes} onChange={(e) => setMapaPalco({ ...mapaPalco, observacoes: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Removido o useEffect que estava fora do componente indevidamente