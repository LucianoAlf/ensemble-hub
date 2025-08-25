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
import { toast } from "sonner";

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
  telefone: string;
  email: string;
  instagram: string;
  facebook: string;
  youtube: string;
  spotify: string;
  observacoes: string;
}

interface Repertorio {
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

interface Unidade {
  id: string;
  nome: string;
}

export function CreateBandDialog({ open, onOpenChange, onBandCreated }: CreateBandDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [bandInfo, setBandInfo] = useState<BandInfo>({ unidade: "", nome: "", genero: "", descricao: "" });
  const [integrantes, setIntegrantes] = useState<Integrante[]>([{
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
  const [repertorio, setRepertorio] = useState<Repertorio[]>([{
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
  }, [open, client]);

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
    setRepertorio([...repertorio, {
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

  const removeRepertorio = (index: number) => {
    if (repertorio.length > 1) {
      setRepertorio(repertorio.filter((_, i) => i !== index));
    }
  };

  const updateRepertorio = (index: number, field: keyof Repertorio, value: any) => {
    const updated = [...repertorio];
    updated[index] = { ...updated[index], [field]: value };
    setRepertorio(updated);
  };

  const handleSubmit = async () => {
    if (!bandInfo.nome.trim()) {
      toast.error("Nome da banda é obrigatório");
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

      const bandaId = bandData.id;

      // Obter tenant_id do usuário
      const { data: profile } = await client
        .from('profiles')
        .select('tenant_id')
        .single();

      if (!profile?.tenant_id) {
        throw new Error('Tenant ID não encontrado');
      }

      const tenantId = profile.tenant_id;

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
          .map(i => ({
            banda_id: bandaId,
            tenant_id: tenantId,
            nome: i.nome,
            email: i.email || null,
            telefone: i.telefone || null,
            instrumento: i.instrumento || "Não especificado",
            funcao: i.funcao || null,
            instagram: i.instagram || null,
            facebook: i.facebook || null,
            youtube: i.youtube || null,
            spotify: i.spotify || null,
            observacoes: i.observacoes || null,
            data_entrada: new Date().toISOString().split('T')[0]
          }));

        const { error: integrantesError } = await client
          .from('banda_integrante')
          .insert(integrantesData);

        if (integrantesError) throw integrantesError;
      }

      // Inserir repertório
      if (repertorio.some(r => r.titulo.trim())) {
        const repertorioData = repertorio
          .filter(r => r.titulo.trim())
          .map(r => ({
            banda_id: bandaId,
            tenant_id: tenantId,
            titulo: r.titulo,
            artista_original: r.artista_original || null,
            genero: r.genero || null,
            duracao_minutos: r.duracao_minutos || null,
            tom: r.tom || null,
            bpm: r.bpm || null,
            dificuldade: r.dificuldade || "medio",
            tipo: r.tipo || "cover",
            letra: r.letra || null,
            cifra: r.cifra || null,
            observacoes: r.observacoes || null
          }));

        const { error: repertorioError } = await client
          .from('banda_repertorio')
          .insert(repertorioData);

        if (repertorioError) throw repertorioError;
      }

      // Inserir rider técnico
      const riderData = {
        banda_id: bandaId,
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

      const { error: riderError } = await client
        .from('banda_rider_tecnico')
        .insert(riderData);

      if (riderError) throw riderError;

      // Inserir mapa de palco
      const mapaData = {
        banda_id: bandaId,
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

      const { error: mapaError } = await client
        .from('banda_mapa_palco')
        .insert(mapaData);

      if (mapaError) throw mapaError;

      toast.success("Banda criada com sucesso!");
      onBandCreated(bandData);
      onOpenChange(false);

      // Reset form
      setBandInfo({ unidade: "", nome: "", genero: "", descricao: "" });
      setIntegrantes([{
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
      setRepertorio([{
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
      setRiderTecnico({
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
      setMapaPalco({
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
                <CardDescription>Dados básicos da banda</CardDescription>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Input
                          value={integrante.funcao}
                          onChange={(e) => updateIntegrante(index, 'funcao', e.target.value)}
                          placeholder="Ex: Líder, Backing Vocal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={integrante.telefone}
                          onChange={(e) => updateIntegrante(index, 'telefone', e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={integrante.email}
                          onChange={(e) => updateIntegrante(index, 'email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input
                          value={integrante.instagram}
                          onChange={(e) => updateIntegrante(index, 'instagram', e.target.value)}
                          placeholder="@usuario"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={integrante.observacoes}
                        onChange={(e) => updateIntegrante(index, 'observacoes', e.target.value)}
                        placeholder="Experiência musical, especialidades..."
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
                {repertorio.map((musica, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Música {index + 1}</h4>
                      {repertorio.length > 1 && (
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
                          value={musica.titulo}
                          onChange={(e) => updateRepertorio(index, 'titulo', e.target.value)}
                          placeholder="Nome da música"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Artista Original</Label>
                        <Input
                          value={musica.artista_original}
                          onChange={(e) => updateRepertorio(index, 'artista_original', e.target.value)}
                          placeholder="Artista/banda original"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Gênero</Label>
                        <Input
                          value={musica.genero}
                          onChange={(e) => updateRepertorio(index, 'genero', e.target.value)}
                          placeholder="Rock, Pop, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração (min)</Label>
                        <Input
                          type="number"
                          value={musica.duracao_minutos}
                          onChange={(e) => updateRepertorio(index, 'duracao_minutos', parseInt(e.target.value) || 0)}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tom</Label>
                        <Input
                          value={musica.tom}
                          onChange={(e) => updateRepertorio(index, 'tom', e.target.value)}
                          placeholder="C, Am, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>BPM</Label>
                        <Input
                          type="number"
                          value={musica.bpm}
                          onChange={(e) => updateRepertorio(index, 'bpm', parseInt(e.target.value) || 0)}
                          placeholder="120"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={musica.tipo} onValueChange={(value) => updateRepertorio(index, 'tipo', value)}>
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
                        <Select value={musica.dificuldade} onValueChange={(value) => updateRepertorio(index, 'dificuldade', value)}>
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
                      <Label>Letra</Label>
                      <Textarea
                        value={musica.letra}
                        onChange={(e) => updateRepertorio(index, 'letra', e.target.value)}
                        placeholder="Letra da música..."
                        rows={3}
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
                    <Label htmlFor="microfones_vocal">Microfones Vocal</Label>
                    <Input
                      id="microfones_vocal"
                      type="number"
                      value={riderTecnico.microfones_vocal}
                      onChange={(e) => setRiderTecnico({...riderTecnico, microfones_vocal: parseInt(e.target.value) || 0})}
                      placeholder="Quantidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="microfones_instrumento">Microfones Instrumento</Label>
                    <Input
                      id="microfones_instrumento"
                      type="number"
                      value={riderTecnico.microfones_instrumento}
                      onChange={(e) => setRiderTecnico({...riderTecnico, microfones_instrumento: parseInt(e.target.value) || 0})}
                      placeholder="Quantidade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="direct_boxes">Direct Boxes</Label>
                    <Input
                      id="direct_boxes"
                      type="number"
                      value={riderTecnico.direct_boxes}
                      onChange={(e) => setRiderTecnico({...riderTecnico, direct_boxes: parseInt(e.target.value) || 0})}
                      placeholder="Quantidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monitores_palco">Monitores de Palco</Label>
                    <Input
                      id="monitores_palco"
                      type="number"
                      value={riderTecnico.monitores_palco}
                      onChange={(e) => setRiderTecnico({...riderTecnico, monitores_palco: parseInt(e.target.value) || 0})}
                      placeholder="Quantidade"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
                  <Textarea
                    id="observacoes_gerais"
                    value={riderTecnico.observacoes_gerais}
                    onChange={(e) => setRiderTecnico({...riderTecnico, observacoes_gerais: e.target.value})}
                    placeholder="Observações sobre equipamentos e necessidades técnicas"
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
            {isLoading ? "Criando..." : "Criar Banda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}