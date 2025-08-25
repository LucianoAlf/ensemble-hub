import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { toast } from "sonner";

console.log('CreateBandDialog component loaded');

interface CreateBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBandCreated: (band: any) => void;
}

interface BandInfo {
  unidade: string;
  nome: string;
  genero: string;
  descricao: string;
}

interface Integrante {
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

interface Unidade {
  id: string;
  nome: string;
}

export function CreateBandDialog({ open, onOpenChange, onBandCreated }: CreateBandDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [bandInfo, setBandInfo] = useState<BandInfo>({ unidade: "", nome: "", genero: "", descricao: "" });
  const [integrantes, setIntegrantes] = useState<Integrante[]>([{ nome: "", instrumento: "", funcao: "", curso: "", telefone: "", email: "", responsavel: false, instagram: "", data_entrada: "", descricao: "", anotacoes: "" }]);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([{ titulo: "", artista_original: "", genero: "", duracao: "", tom: "", bpm: "", tipo: "", dificuldade: "", observacoes: "", letra: "" }]);
  const [riderTecnico, setRiderTecnico] = useState<RiderTecnico>({ microfones: "", cabos: "", amplificadores: "", direct_box: "", monitores: "", canais_mixer: "", instrumentos: "", tomadas: "", palco: "", iluminacao: "", camarim: "", estacionamento: "", observacoes: "" });
  const [mapaPalco, setMapaPalco] = useState<MapaPalco>({ posicao_vocal: "", posicao_guitarra: "", posicao_baixo: "", posicao_bateria: "", posicao_teclado: "", posicao_outros: "", posicao_amplificadores: "", posicao_monitores: "", observacoes: "" });
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const { supabase: client, mutate } = useSupabaseOptimized();
  // Carregar unidades ao abrir o diálogo
  useEffect(() => {
    const loadUnidades = async () => {
      try {
        const { data, error } = await client.from('unidade').select('id, nome').order('nome');
        if (error) throw error;
        setUnidades(data || []);
      } catch (err) {
        console.error('Erro ao carregar unidades', err);
      }
    };
    if (open) loadUnidades();
  }, [open]);
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

  const removeIntegrante = (index: number) => {
    if (integrantes.length > 1) {
      setIntegrantes(integrantes.filter((_, i) => i !== index));
    }
  };

  const updateIntegrante = (index: number, field: keyof Integrante, value: any) => {
    const updated = [...integrantes];
    updated[index] = { ...updated[index], [field]: value };
    setIntegrantes(updated);
  };

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

  const removeRepertorio = (index: number) => {
    if (repertorios.length > 1) {
      setRepertorios(repertorios.filter((_, i) => i !== index));
    }
  };

  const updateRepertorio = (index: number, field: keyof Repertorio, value: string) => {
    const updated = [...repertorios];
    updated[index] = { ...updated[index], [field]: value };
    setRepertorios(updated);
  };

  const handleSubmit = async () => {
    if (!bandInfo.nome.trim()) {
      toast.error("Nome da banda é obrigatório");
      return;
    }

    const client = supabase;
    
    if (!client) {
      console.error('Supabase client não está disponível');
      toast.error("Erro de conexão com o banco de dados");
      return;
    }

    setIsLoading(true);
    try {
      // Criar banda
      // Criar banda via função RPC para preencher tenant_id automaticamente e evitar problemas de UUID
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

      const bandaId = bandData.id;

      // Se uma unidade foi selecionada, associar à banda
      if (bandInfo.unidade) {
        const { error: unidadeUpdateError } = await client
          .from('banda')
          .update({ unidade_id: bandInfo.unidade })
          .eq('id', bandaId);
        if (unidadeUpdateError) throw unidadeUpdateError;
      }

      // Inserir integrantes
      if (integrantes.some(i => i.nome.trim())) {
        const integrantesData = integrantes
          .filter(i => i.nome.trim())
          .map(i => ({ ...i, banda_id: bandaId }));
        
        const { error: integrantesError } = await client
          .from('banda_integrante')
          .insert(integrantesData);
        
        if (integrantesError) throw integrantesError;
      }

      // Inserir repertórios
      if (repertorios.some(r => r.titulo.trim())) {
        const repertoriosData = repertorios
          .filter(r => r.titulo.trim())
          .map(r => ({ ...r, banda_id: bandaId }));
        
        const { error: repertoriosError } = await client
          .from('banda_repertorio')
          .insert(repertoriosData);
        
        if (repertoriosError) throw repertoriosError;
      }

      // Inserir rider técnico
      const { error: riderError } = await client
        .from('banda_rider_tecnico')
        .insert({ ...riderTecnico, banda_id: bandaId });
      
      if (riderError) throw riderError;

      // Inserir mapa de palco
      const { error: mapaError } = await client
        .from('banda_mapa_palco')
        .insert({ ...mapaPalco, banda_id: bandaId });
      
      if (mapaError) throw mapaError;

      toast.success("Banda criada com sucesso!");
      onBandCreated(bandData);
      onOpenChange(false);
      
      // Reset form
      setBandInfo({
        unidade: "",
        nome: "",
        genero: "",
        descricao: ""
      });
      setIntegrantes([{
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
      setRepertorios([{
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
      setRiderTecnico({
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
      setMapaPalco({
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
      setActiveTab("info");
    } catch (error: any) {
      console.error('Erro ao criar banda:', error);
      toast.error(error.message || "Erro ao criar banda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Banda</DialogTitle>
          <DialogDescription>
            Cadastre uma nova banda com todas as informações necessárias
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="integrantes">Integrantes</TabsTrigger>
            <TabsTrigger value="repertorio">Repertório</TabsTrigger>
            <TabsTrigger value="rider">Rider Técnico</TabsTrigger>
            <TabsTrigger value="mapa">Mapa de Palco</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Banda</CardTitle>
                <CardDescription>Dados básicos e redes sociais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade (opcional)</Label>
                    <Select
                      value={bandInfo.unidade}
                      onValueChange={(value) => setBandInfo({ ...bandInfo, unidade: value })}
                    >
                      <SelectTrigger id="unidade" disabled={unidades.length === 0}>
                        <SelectValue placeholder={unidades.length === 0 ? "Nenhuma unidade cadastrada" : "Selecione uma unidade"} />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {unidades.length === 0 && (
                      <p className="text-xs text-muted-foreground">Cadastre unidades para habilitar a seleção.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Banda *</Label>
                    <Input
                      id="nome"
                      value={bandInfo.nome}
                      onChange={(e) => setBandInfo({...bandInfo, nome: e.target.value})}
                      placeholder="Ex: Rock Prisma"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genero">Gênero</Label>
                    <Input
                      id="genero"
                      value={bandInfo.genero}
                      onChange={(e) => setBandInfo({...bandInfo, genero: e.target.value})}
                      placeholder="Ex: Rock, Pop, Jazz"
                    />
                  </div>
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
          </TabsContent>

          <TabsContent value="integrantes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrantes da Banda</CardTitle>
                <CardDescription>Adicione os membros da banda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrantes.map((integrante, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Integrante {index + 1}</h4>
                      {integrantes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIntegrante(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={integrante.nome}
                          onChange={(e) => updateIntegrante(index, 'nome', e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instrumento</Label>
                        <Input
                          value={integrante.instrumento}
                          onChange={(e) => updateIntegrante(index, 'instrumento', e.target.value)}
                          placeholder="Ex: Guitarra, Vocal, Bateria"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Input
                          value={integrante.funcao}
                          onChange={(e) => updateIntegrante(index, 'funcao', e.target.value)}
                          placeholder="Ex: Líder, Backing Vocal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Curso</Label>
                        <Input
                          value={integrante.curso}
                          onChange={(e) => updateIntegrante(index, 'curso', e.target.value)}
                          placeholder="Curso na instituição"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Entrada</Label>
                        <Input
                          type="date"
                          value={integrante.data_entrada}
                          onChange={(e) => updateIntegrante(index, 'data_entrada', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={integrante.telefone}
                          onChange={(e) => updateIntegrante(index, 'telefone', e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={integrante.email}
                          onChange={(e) => updateIntegrante(index, 'email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input
                          value={integrante.instagram}
                          onChange={(e) => updateIntegrante(index, 'instagram', e.target.value)}
                          placeholder="@usuario"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`responsavel-${index}`}
                          checked={integrante.responsavel}
                          onChange={(e) => updateIntegrante(index, 'responsavel', e.target.checked)}
                        />
                        <Label htmlFor={`responsavel-${index}`}>Responsável pela banda</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={integrante.descricao}
                        onChange={(e) => updateIntegrante(index, 'descricao', e.target.value)}
                        placeholder="Experiência musical, especialidades..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Anotações</Label>
                      <Textarea
                        value={integrante.anotacoes}
                        onChange={(e) => updateIntegrante(index, 'anotacoes', e.target.value)}
                        placeholder="Observações internas"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="outline" onClick={addIntegrante} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Integrante
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repertorio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Repertório</CardTitle>
                <CardDescription>Músicas do repertório da banda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {repertorios.map((repertorio, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Música {index + 1}</h4>
                      {repertorios.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRepertorio(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input
                          value={repertorio.titulo}
                          onChange={(e) => updateRepertorio(index, 'titulo', e.target.value)}
                          placeholder="Nome da música"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Artista Original</Label>
                        <Input
                          value={repertorio.artista_original}
                          onChange={(e) => updateRepertorio(index, 'artista_original', e.target.value)}
                          placeholder="Artista/banda original"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Gênero</Label>
                        <Input
                          value={repertorio.genero}
                          onChange={(e) => updateRepertorio(index, 'genero', e.target.value)}
                          placeholder="Rock, Pop, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração</Label>
                        <Input
                          value={repertorio.duracao}
                          onChange={(e) => updateRepertorio(index, 'duracao', e.target.value)}
                          placeholder="3:45"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tom</Label>
                        <Input
                          value={repertorio.tom}
                          onChange={(e) => updateRepertorio(index, 'tom', e.target.value)}
                          placeholder="C, Am, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>BPM</Label>
                        <Input
                          value={repertorio.bpm}
                          onChange={(e) => updateRepertorio(index, 'bpm', e.target.value)}
                          placeholder="120"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={repertorio.tipo} onValueChange={(value) => updateRepertorio(index, 'tipo', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">Original</SelectItem>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="instrumental">Instrumental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Dificuldade</Label>
                        <Select value={repertorio.dificuldade} onValueChange={(value) => updateRepertorio(index, 'dificuldade', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a dificuldade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facil">Fácil</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="dificil">Difícil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={repertorio.observacoes}
                        onChange={(e) => updateRepertorio(index, 'observacoes', e.target.value)}
                        placeholder="Observações sobre a música, arranjo, etc."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Letra</Label>
                      <Textarea
                        value={repertorio.letra}
                        onChange={(e) => updateRepertorio(index, 'letra', e.target.value)}
                        placeholder="Letra da música..."
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="outline" onClick={addRepertorio} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Música
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rider" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rider Técnico</CardTitle>
                <CardDescription>Equipamentos e necessidades técnicas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="microfones">Microfones</Label>
                    <Textarea
                      id="microfones"
                      value={riderTecnico.microfones}
                      onChange={(e) => setRiderTecnico({...riderTecnico, microfones: e.target.value})}
                      placeholder="Quantidade e tipos de microfones necessários"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cabos">Cabos</Label>
                    <Textarea
                      id="cabos"
                      value={riderTecnico.cabos}
                      onChange={(e) => setRiderTecnico({...riderTecnico, cabos: e.target.value})}
                      placeholder="Cabos necessários (P10, XLR, etc.)"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amplificadores">Amplificadores</Label>
                    <Textarea
                      id="amplificadores"
                      value={riderTecnico.amplificadores}
                      onChange={(e) => setRiderTecnico({...riderTecnico, amplificadores: e.target.value})}
                      placeholder="Amplificadores necessários"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direct_box">Direct Box</Label>
                    <Textarea
                      id="direct_box"
                      value={riderTecnico.direct_box}
                      onChange={(e) => setRiderTecnico({...riderTecnico, direct_box: e.target.value})}
                      placeholder="Direct boxes necessários"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monitores">Monitores</Label>
                    <Textarea
                      id="monitores"
                      value={riderTecnico.monitores}
                      onChange={(e) => setRiderTecnico({...riderTecnico, monitores: e.target.value})}
                      placeholder="Monitores de palco necessários"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="canais_mixer">Canais do Mixer</Label>
                    <Textarea
                      id="canais_mixer"
                      value={riderTecnico.canais_mixer}
                      onChange={(e) => setRiderTecnico({...riderTecnico, canais_mixer: e.target.value})}
                      placeholder="Quantidade de canais necessários"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instrumentos">Instrumentos</Label>
                    <Textarea
                      id="instrumentos"
                      value={riderTecnico.instrumentos}
                      onChange={(e) => setRiderTecnico({...riderTecnico, instrumentos: e.target.value})}
                      placeholder="Instrumentos que a banda traz/precisa"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tomadas">Tomadas</Label>
                    <Textarea
                      id="tomadas"
                      value={riderTecnico.tomadas}
                      onChange={(e) => setRiderTecnico({...riderTecnico, tomadas: e.target.value})}
                      placeholder="Quantidade de tomadas necessárias"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="palco">Palco</Label>
                    <Textarea
                      id="palco"
                      value={riderTecnico.palco}
                      onChange={(e) => setRiderTecnico({...riderTecnico, palco: e.target.value})}
                      placeholder="Dimensões e características do palco"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iluminacao">Iluminação</Label>
                    <Textarea
                      id="iluminacao"
                      value={riderTecnico.iluminacao}
                      onChange={(e) => setRiderTecnico({...riderTecnico, iluminacao: e.target.value})}
                      placeholder="Necessidades de iluminação"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="camarim">Camarim</Label>
                    <Textarea
                      id="camarim"
                      value={riderTecnico.camarim}
                      onChange={(e) => setRiderTecnico({...riderTecnico, camarim: e.target.value})}
                      placeholder="Necessidades do camarim"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estacionamento">Estacionamento</Label>
                    <Textarea
                      id="estacionamento"
                      value={riderTecnico.estacionamento}
                      onChange={(e) => setRiderTecnico({...riderTecnico, estacionamento: e.target.value})}
                      placeholder="Necessidades de estacionamento"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes_rider">Observações</Label>
                  <Textarea
                    id="observacoes_rider"
                    value={riderTecnico.observacoes}
                    onChange={(e) => setRiderTecnico({...riderTecnico, observacoes: e.target.value})}
                    placeholder="Observações gerais sobre o rider técnico"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Palco</CardTitle>
                <CardDescription>Posicionamento dos instrumentos e equipamentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="posicao_vocal">Posição Vocal</Label>
                    <Input
                      id="posicao_vocal"
                      value={mapaPalco.posicao_vocal}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_vocal: e.target.value})}
                      placeholder="Ex: Centro frente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="posicao_guitarra">Posição Guitarra</Label>
                    <Input
                      id="posicao_guitarra"
                      value={mapaPalco.posicao_guitarra}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_guitarra: e.target.value})}
                      placeholder="Ex: Direita do palco"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="posicao_baixo">Posição Baixo</Label>
                    <Input
                      id="posicao_baixo"
                      value={mapaPalco.posicao_baixo}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_baixo: e.target.value})}
                      placeholder="Ex: Esquerda do palco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="posicao_bateria">Posição Bateria</Label>
                    <Input
                      id="posicao_bateria"
                      value={mapaPalco.posicao_bateria}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_bateria: e.target.value})}
                      placeholder="Ex: Fundo centro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="posicao_teclado">Posição Teclado</Label>
                    <Input
                      id="posicao_teclado"
                      value={mapaPalco.posicao_teclado}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_teclado: e.target.value})}
                      placeholder="Ex: Direita fundo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="posicao_outros">Outros Instrumentos</Label>
                    <Input
                      id="posicao_outros"
                      value={mapaPalco.posicao_outros}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_outros: e.target.value})}
                      placeholder="Posição de outros instrumentos"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="posicao_amplificadores">Posição Amplificadores</Label>
                    <Input
                      id="posicao_amplificadores"
                      value={mapaPalco.posicao_amplificadores}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_amplificadores: e.target.value})}
                      placeholder="Posicionamento dos amplificadores"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="posicao_monitores">Posição Monitores</Label>
                    <Input
                      id="posicao_monitores"
                      value={mapaPalco.posicao_monitores}
                      onChange={(e) => setMapaPalco({...mapaPalco, posicao_monitores: e.target.value})}
                      placeholder="Posicionamento dos monitores"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes_mapa">Observações</Label>
                  <Textarea
                    id="observacoes_mapa"
                    value={mapaPalco.observacoes}
                    onChange={(e) => setMapaPalco({...mapaPalco, observacoes: e.target.value})}
                    placeholder="Observações sobre o mapa de palco, necessidades especiais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
