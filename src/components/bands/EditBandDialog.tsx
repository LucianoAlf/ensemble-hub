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

interface BandInfo {
  unidade: string;
  nome: string;
  genero: string;
  descricao: string;
}

interface Integrante {
  id?: string;
  nome: string;
  instrumento: string;
  funcao: string;
  telefone: string;
  email: string;
  instagram: string;
  facebook: string;
  youtube: string;
  spotify: string;
  observacoes: string;
}

interface Repertorio {
  id?: string;
  titulo: string;
  artista_original: string;
  genero: string;
  duracao_minutos: number;
  tom: string;
  bpm: number;
  tipo: string;
  dificuldade: string;
  observacoes: string;
  letra: string;
  cifra: string;
}

interface RiderTecnico {
  id?: string;
  nome: string;
  descricao: string;
  microfones_vocal: number;
  microfones_instrumento: number;
  direct_boxes: number;
  monitores_palco: number;
  canais_mixer: number;
  tomadas_220v: number;
  tomadas_110v: number;
  extensoes_necessarias: boolean;
  cobertura_necessaria: boolean;
  iluminacao_basica: boolean;
  iluminacao_especial: string;
  altura_palco_minima: string;
  tamanho_palco_minimo: string;
  equipamentos_especiais: string;
  instrumentos_fornecidos: string;
  amplificadores: string;
  camarim_necessario: boolean;
  estacionamento_necessario: boolean;
  seguranca_necessaria: boolean;
  observacoes_gerais: string;
}

interface MapaPalco {
  id?: string;
  nome: string;
  descricao: string;
  posicao_vocal: string;
  posicao_guitarra: string;
  posicao_baixo: string;
  posicao_bateria: string;
  posicao_teclado: string;
  posicao_microfones: string;
  posicao_monitores: string;
  posicao_amplificadores: string;
  posicoes_outros: string;
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
    descricao: ""
  });
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [riderTecnico, setRiderTecnico] = useState<RiderTecnico>({
    nome: "Rider Técnico",
    descricao: "",
    microfones_vocal: 0,
    microfones_instrumento: 0,
    direct_boxes: 0,
    monitores_palco: 0,
    canais_mixer: 0,
    tomadas_220v: 0,
    tomadas_110v: 0,
    extensoes_necessarias: false,
    cobertura_necessaria: false,
    iluminacao_basica: true,
    iluminacao_especial: "",
    altura_palco_minima: "",
    tamanho_palco_minimo: "",
    equipamentos_especiais: "",
    instrumentos_fornecidos: "",
    amplificadores: "",
    camarim_necessario: false,
    estacionamento_necessario: false,
    seguranca_necessaria: false,
    observacoes_gerais: ""
  });
  const [mapaPalco, setMapaPalco] = useState<MapaPalco>({
    nome: "Mapa de Palco",
    descricao: "",
    posicao_vocal: "",
    posicao_guitarra: "",
    posicao_baixo: "",
    posicao_bateria: "",
    posicao_teclado: "",
    posicao_microfones: "",
    posicao_monitores: "",
    posicao_amplificadores: "",
    posicoes_outros: "",
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
  }, [open, supabase, toast]);

  const loadBandData = async () => {
    if (!band) return;
    setLoading(true);
    try {
      // Carregar info da banda
      const { data: bandData } = await supabase.from('banda').select('*').eq('id', band.id).single();
      if (bandData) {
        setBandInfo({
          nome: bandData.nome || "",
          genero: bandData.genero || "",
          descricao: bandData.descricao || "",
          unidade: bandData.unidade_id || "",
        });
      }

      // Carregar integrantes - mapping data properly to interface
      const { data: intData } = await supabase.from('banda_integrante').select('*').eq('banda_id', band.id);
      const mappedIntegrantes: Integrante[] = (intData || []).map(item => ({
        id: item.id,
        nome: item.nome,
        instrumento: item.instrumento,
        funcao: item.funcao || "",
        telefone: item.telefone || "",
        email: item.email || "",
        instagram: item.instagram || "",
        facebook: item.facebook || "",
        youtube: item.youtube || "",
        spotify: item.spotify || "",
        observacoes: item.observacoes || ""
      }));
      setIntegrantes(mappedIntegrantes);

      // Carregar repertórios - mapping data properly to interface  
      const { data: repData } = await supabase.from('banda_repertorio').select('*').eq('banda_id', band.id);
      const mappedRepertorios: Repertorio[] = (repData || []).map(item => ({
        id: item.id,
        titulo: item.titulo,
        artista_original: item.artista_original || "",
        genero: item.genero || "",
        duracao_minutos: item.duracao_minutos || 0,
        tom: item.tom || "",
        bpm: item.bpm || 0,
        tipo: item.tipo || "cover",
        dificuldade: item.dificuldade || "medio",
        observacoes: item.observacoes || "",
        letra: item.letra || "",
        cifra: item.cifra || ""
      }));
      setRepertorios(mappedRepertorios);

      // Carregar rider
      const { data: riderData } = await supabase.from('banda_rider_tecnico').select('*').eq('banda_id', band.id).single();
      if (riderData) {
        setRiderTecnico({
          id: riderData.id,
          nome: riderData.nome || "Rider Técnico",
          descricao: riderData.descricao || "",
          microfones_vocal: riderData.microfones_vocal || 0,
          microfones_instrumento: riderData.microfones_instrumento || 0,
          direct_boxes: riderData.direct_boxes || 0,
          monitores_palco: riderData.monitores_palco || 0,
          canais_mixer: riderData.canais_mixer || 0,
          tomadas_220v: riderData.tomadas_220v || 0,
          tomadas_110v: riderData.tomadas_110v || 0,
          extensoes_necessarias: riderData.extensoes_necessarias || false,
          cobertura_necessaria: riderData.cobertura_necessaria || false,
          iluminacao_basica: riderData.iluminacao_basica || true,
          iluminacao_especial: riderData.iluminacao_especial || "",
          altura_palco_minima: riderData.altura_palco_minima || "",
          tamanho_palco_minimo: riderData.tamanho_palco_minimo || "",
          equipamentos_especiais: riderData.equipamentos_especiais || "",
          instrumentos_fornecidos: riderData.instrumentos_fornecidos || "",
          amplificadores: riderData.amplificadores || "",
          camarim_necessario: riderData.camarim_necessario || false,
          estacionamento_necessario: riderData.estacionamento_necessario || false,
          seguranca_necessaria: riderData.seguranca_necessaria || false,
          observacoes_gerais: riderData.observacoes_gerais || ""
        });
      }

      // Carregar mapa
      const { data: mapaData } = await supabase.from('banda_mapa_palco').select('*').eq('banda_id', band.id).single();
      if (mapaData) {
        setMapaPalco({
          id: mapaData.id,
          nome: mapaData.nome || "Mapa de Palco",
          descricao: mapaData.descricao || "",
          posicao_vocal: mapaData.posicao_vocal || "",
          posicao_guitarra: mapaData.posicao_guitarra || "",
          posicao_baixo: mapaData.posicao_baixo || "",
          posicao_bateria: mapaData.posicao_bateria || "",
          posicao_teclado: mapaData.posicao_teclado || "",
          posicao_microfones: mapaData.posicao_microfones || "",
          posicao_monitores: mapaData.posicao_monitores || "",
          posicao_amplificadores: mapaData.posicao_amplificadores || "",
          posicoes_outros: mapaData.posicoes_outros || "",
          observacoes: mapaData.observacoes || ""
        });
      }
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
      telefone: "",
      email: "",
      instagram: "",
      facebook: "",
      youtube: "",
      spotify: "",
      observacoes: ""
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
      duracao_minutos: 0,
      tom: "",
      bpm: 0,
      tipo: "cover",
      dificuldade: "medio",
      observacoes: "",
      letra: "",
      cifra: ""
    }]);
  };

  const removeRepertorio = async (index: number, id?: string) => {
    if (id) {
      await supabase.from('banda_repertorio').delete().eq('id', id);
    }
    setRepertorios(repertorios.filter((_, i) => i !== index));
  };

  const updateRepertorio = (index: number, field: keyof Repertorio, value: any) => {
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

    setLoading(true);
    try {
      // Get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .single();

      if (!profile?.tenant_id) {
        throw new Error('Tenant ID não encontrado');
      }

      const tenantId = profile.tenant_id;

      // Atualizar banda
      await supabase.from('banda').update({ 
        nome: bandInfo.nome, 
        genero: bandInfo.genero, 
        descricao: bandInfo.descricao,
        unidade_id: bandInfo.unidade || null
      }).eq('id', band.id);

      // Atualizar/Inserir integrantes
      for (const int of integrantes) {
        const integranteData = {
          banda_id: band.id,
          tenant_id: tenantId,
          nome: int.nome,
          instrumento: int.instrumento || "Não especificado",
          funcao: int.funcao || null,
          telefone: int.telefone || null,
          email: int.email || null,
          instagram: int.instagram || null,
          facebook: int.facebook || null,
          youtube: int.youtube || null,
          spotify: int.spotify || null,
          observacoes: int.observacoes || null,
          data_entrada: new Date().toISOString().split('T')[0]
        };

        if (int.id) {
          await supabase.from('banda_integrante').update(integranteData).eq('id', int.id);
        } else {
          await supabase.from('banda_integrante').insert(integranteData);
        }
      }

      // Atualizar/Inserir repertórios
      for (const rep of repertorios) {
        const repertorioData = {
          banda_id: band.id,
          tenant_id: tenantId,
          titulo: rep.titulo,
          artista_original: rep.artista_original || null,
          genero: rep.genero || null,
          duracao_minutos: rep.duracao_minutos || null,
          tom: rep.tom || null,
          bpm: rep.bpm || null,
          dificuldade: rep.dificuldade || "medio",
          tipo: rep.tipo || "cover",
          letra: rep.letra || null,
          cifra: rep.cifra || null,
          observacoes: rep.observacoes || null
        };

        if (rep.id) {
          await supabase.from('banda_repertorio').update(repertorioData).eq('id', rep.id);
        } else {
          await supabase.from('banda_repertorio').insert(repertorioData);
        }
      }

      // Atualizar rider
      const riderData = {
        banda_id: band.id,
        tenant_id: tenantId,
        nome: riderTecnico.nome,
        descricao: riderTecnico.descricao || null,
        microfones_vocal: riderTecnico.microfones_vocal,
        microfones_instrumento: riderTecnico.microfones_instrumento,
        direct_boxes: riderTecnico.direct_boxes,
        monitores_palco: riderTecnico.monitores_palco,
        canais_mixer: riderTecnico.canais_mixer,
        tomadas_220v: riderTecnico.tomadas_220v,
        tomadas_110v: riderTecnico.tomadas_110v,
        extensoes_necessarias: riderTecnico.extensoes_necessarias,
        cobertura_necessaria: riderTecnico.cobertura_necessaria,
        iluminacao_basica: riderTecnico.iluminacao_basica,
        iluminacao_especial: riderTecnico.iluminacao_especial || null,
        altura_palco_minima: riderTecnico.altura_palco_minima || null,
        tamanho_palco_minimo: riderTecnico.tamanho_palco_minimo || null,
        equipamentos_especiais: riderTecnico.equipamentos_especiais || null,
        instrumentos_fornecidos: riderTecnico.instrumentos_fornecidos || null,
        amplificadores: riderTecnico.amplificadores || null,
        camarim_necessario: riderTecnico.camarim_necessario,
        estacionamento_necessario: riderTecnico.estacionamento_necessario,
        seguranca_necessaria: riderTecnico.seguranca_necessaria,
        observacoes_gerais: riderTecnico.observacoes_gerais || null
      };

      if (riderTecnico.id) {
        await supabase.from('banda_rider_tecnico').update(riderData).eq('id', riderTecnico.id);
      } else {
        await supabase.from('banda_rider_tecnico').insert(riderData);
      }

      // Atualizar mapa
      const mapaData = {
        banda_id: band.id,
        tenant_id: tenantId,
        nome: mapaPalco.nome,
        descricao: mapaPalco.descricao || null,
        posicao_vocal: mapaPalco.posicao_vocal || null,
        posicao_guitarra: mapaPalco.posicao_guitarra || null,
        posicao_baixo: mapaPalco.posicao_baixo || null,
        posicao_bateria: mapaPalco.posicao_bateria || null,
        posicao_teclado: mapaPalco.posicao_teclado || null,
        posicao_microfones: mapaPalco.posicao_microfones || null,
        posicao_monitores: mapaPalco.posicao_monitores || null,
        posicao_amplificadores: mapaPalco.posicao_amplificadores || null,
        posicoes_outros: mapaPalco.posicoes_outros || null,
        observacoes: mapaPalco.observacoes || null
      };

      if (mapaPalco.id) {
        await supabase.from('banda_mapa_palco').update(mapaData).eq('id', mapaPalco.id);
      } else {
        await supabase.from('banda_mapa_palco').insert(mapaData);
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
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" value={bandInfo.descricao} onChange={(e) => setBandInfo({...bandInfo, descricao: e.target.value})} />
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
                        <Label htmlFor={`rep-duracao-${index}`}>Duração (min)</Label>
                        <Input id={`rep-duracao-${index}`} type="number" value={repertorio.duracao_minutos} onChange={(e) => updateRepertorio(index, 'duracao_minutos', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label htmlFor={`rep-bpm-${index}`}>BPM</Label>
                        <Input id={`rep-bpm-${index}`} type="number" value={repertorio.bpm} onChange={(e) => updateRepertorio(index, 'bpm', parseInt(e.target.value) || 0)} />
                      </div>
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
                    <Label htmlFor="microfones_vocal">Microfones Vocal</Label>
                    <Input id="microfones_vocal" type="number" value={riderTecnico.microfones_vocal} onChange={(e) => setRiderTecnico({...riderTecnico, microfones_vocal: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <Label htmlFor="monitores_palco">Monitores de Palco</Label>
                    <Input id="monitores_palco" type="number" value={riderTecnico.monitores_palco} onChange={(e) => setRiderTecnico({...riderTecnico, monitores_palco: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
                  <Textarea id="observacoes_gerais" value={riderTecnico.observacoes_gerais} onChange={(e) => setRiderTecnico({...riderTecnico, observacoes_gerais: e.target.value})} />
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
                    <Input id="posicao_vocal" value={mapaPalco.posicao_vocal} onChange={(e) => setMapaPalco({...mapaPalco, posicao_vocal: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="posicao_guitarra">Posição Guitarra</Label>
                    <Input id="posicao_guitarra" value={mapaPalco.posicao_guitarra} onChange={(e) => setMapaPalco({...mapaPalco, posicao_guitarra: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="observacoes_mapa">Observações</Label>
                  <Textarea id="observacoes_mapa" value={mapaPalco.observacoes} onChange={(e) => setMapaPalco({...mapaPalco, observacoes: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}