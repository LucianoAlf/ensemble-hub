import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { toast } from "sonner";
import { BandInfoForm, type BandInfoData } from "./forms/BandInfoForm";
import { BandMembersForm, type BandMemberData } from "./forms/BandMembersForm";
import { RepertoireForm, type RepertoireSongData } from "./forms/RepertoireForm";
import { TechnicalRiderForm, type TechnicalRiderData } from "./forms/TechnicalRiderForm";
import { StageMapForm, type StageMapData } from "./forms/StageMapForm";

interface BandData {
  id: string;
  nome: string;
  genero: string | null;
  descricao: string | null;
  unidade_id: string;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  spotify: string | null;
  apple_music: string | null;
  soundcloud: string | null;
  bandcamp: string | null;
  website: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBandCreated: (band: BandData) => void;
}

interface Unidade {
  id: string;
  nome: string;
}

type TabType = "info" | "members" | "repertoire" | "rider" | "stagemap";

export function CreateBandDialog({ open, onOpenChange, onBandCreated }: CreateBandDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>("info");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const { supabase: client } = useSupabaseOptimized();

  // Form data states
  const [bandInfo, setBandInfo] = useState<BandInfoData>({
    nome: "",
    genero: "",
    descricao: "",
    unidade_id: "",
    instagram: "",
    facebook: "",
    youtube: "",
    spotify: "",
    apple_music: "",
    soundcloud: "",
    bandcamp: "",
    website: ""
  });

  const [members, setMembers] = useState<BandMemberData[]>([{
    nome: "",
    instrumento: "",
    funcao: "",
    telefone: "",
    email: "",
    instagram: "",
    facebook: "",
    youtube: "",
    spotify: "",
    data_entrada: new Date().toISOString().split('T')[0],
    observacoes: ""
  }]);

  const [repertoire, setRepertoire] = useState<RepertoireSongData[]>([]);

  const [technicalRider, setTechnicalRider] = useState<TechnicalRiderData>({
    nome: "Rider Técnico",
    descricao: "",
    microfones_vocal: 0,
    microfones_instrumento: 0,
    direct_boxes: 0,
    monitores_palco: 0,
    canais_mixer: 0,
    amplificadores: "",
    instrumentos_fornecidos: "",
    tomadas_110v: 0,
    tomadas_220v: 0,
    extensoes_necessarias: false,
    tamanho_palco_minimo: "",
    altura_palco_minima: "",
    cobertura_necessaria: false,
    iluminacao_basica: true,
    iluminacao_especial: "",
    camarim_necessario: false,
    estacionamento_necessario: false,
    seguranca_necessaria: false,
    equipamentos_especiais: "",
    observacoes_gerais: ""
  });

  const [stageMap, setStageMap] = useState<StageMapData>({
    nome: "Mapa de Palco",
    descricao: "",
    posicao_vocal: "",
    posicao_guitarra: "",
    posicao_baixo: "",
    posicao_bateria: "",
    posicao_teclado: "",
    posicao_amplificadores: "",
    posicao_monitores: "",
    posicao_microfones: "",
    posicoes_outros: "",
    observacoes: ""
  });

  const loadUnidades = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await client
        .from('unidade')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast.error("Erro ao carregar unidades");
    }
  };

  // Load unidades on dialog open
  useEffect(() => {
    if (open && client) {
      loadUnidades();
    }
  }, [open, client, loadUnidades]);

  const validateCurrentTab = (showToast: boolean = true): boolean => {
    switch (currentTab) {
      case "info":
        if (!bandInfo.nome.trim()) {
          if (showToast) toast.error("Nome da banda é obrigatório");
          return false;
        }
        if (!bandInfo.unidade_id) {
          if (showToast) toast.error("Selecione uma unidade");
          return false;
        }
        return true;
      
      case "members":
        if (members.length === 0) {
          if (showToast) toast.error("Adicione pelo menos um integrante");
          return false;
        }
        for (const member of members) {
          if (!member.nome.trim() || !member.instrumento.trim() || !member.data_entrada) {
            if (showToast) toast.error("Preencha os campos obrigatórios dos integrantes (nome, instrumento, data de entrada)");
            return false;
          }
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentTab()) return;
    
    const tabs: TabType[] = ["info", "members", "repertoire", "rider", "stagemap"];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const tabs: TabType[] = ["info", "members", "repertoire", "rider", "stagemap"];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentTab()) return;

    if (!client) {
      console.error('Supabase client não está disponível');
      toast.error("Erro de conexão com o banco de dados");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Iniciando criação de banda com dados completos');

      // Verificar se usuário tem tenant_id
      const { data: session } = await client.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuário não autenticado');
      }

      const userId = session.session.user.id;
      console.log('Usuário autenticado:', userId);

      // Get user's tenant_id
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single();

      if (profileError || !profileData?.tenant_id) {
        throw new Error('Usuário não possui tenant_id configurado');
      }

      const tenantId = profileData.tenant_id;

      // Transação para criar banda e dados relacionados
      const { data: bandData, error: bandError } = await client
        .from('banda')
        .insert({
          tenant_id: tenantId,
          unidade_id: bandInfo.unidade_id || null,
          nome: bandInfo.nome,
          genero: bandInfo.genero || null,
          descricao: bandInfo.descricao || null,
          instagram: bandInfo.instagram || null,
          facebook: bandInfo.facebook || null,
          youtube: bandInfo.youtube || null,
          spotify: bandInfo.spotify || null,
          apple_music: bandInfo.apple_music || null,
          soundcloud: bandInfo.soundcloud || null,
          bandcamp: bandInfo.bandcamp || null,
          website: bandInfo.website || null
        })
        .select()
        .single();

      if (bandError) throw bandError;
      
      const bandId = bandData.id;
      console.log('Banda criada:', bandId);

      // Criar integrantes
      if (members.length > 0) {
        const membersData = members.map(member => ({
          tenant_id: tenantId,
          banda_id: bandId,
          nome: member.nome,
          instrumento: member.instrumento,
          funcao: member.funcao || null,
          telefone: member.telefone || null,
          email: member.email || null,
          instagram: member.instagram || null,
          facebook: member.facebook || null,
          youtube: member.youtube || null,
          spotify: member.spotify || null,
          data_entrada: member.data_entrada,
          observacoes: member.observacoes || null
        }));

        const { error: membersError } = await client
          .from('banda_integrante')
          .insert(membersData);

        if (membersError) throw membersError;
        console.log('Integrantes criados');
      }

      // Criar repertório
      if (repertoire.length > 0) {
        const repertoireData = repertoire.map(song => ({
          tenant_id: tenantId,
          banda_id: bandId,
          titulo: song.titulo,
          artista_original: song.artista_original || null,
          genero: song.genero || null,
          duracao_minutos: song.duracao_minutos,
          tom: song.tom || null,
          bpm: song.bpm,
          tipo: song.tipo,
          dificuldade: song.dificuldade,
          observacoes: song.observacoes || null,
          letra: song.letra || null,
          cifra: song.cifra || null
        }));

        const { error: repertoireError } = await client
          .from('banda_repertorio')
          .insert(repertoireData);

        if (repertoireError) throw repertoireError;
        console.log('Repertório criado');
      }

      // Criar rider técnico se tiver dados relevantes
      const hasRiderData = technicalRider.nome !== "Rider Técnico" || 
                          technicalRider.descricao ||
                          technicalRider.microfones_vocal > 0 ||
                          technicalRider.microfones_instrumento > 0 ||
                          technicalRider.direct_boxes > 0 ||
                          technicalRider.monitores_palco > 0;

      if (hasRiderData) {
        const { error: riderError } = await client
          .from('banda_rider_tecnico')
          .insert({
            tenant_id: tenantId,
            banda_id: bandId,
            nome: technicalRider.nome,
            descricao: technicalRider.descricao || null,
            microfones_vocal: technicalRider.microfones_vocal,
            microfones_instrumento: technicalRider.microfones_instrumento,
            direct_boxes: technicalRider.direct_boxes,
            monitores_palco: technicalRider.monitores_palco,
            canais_mixer: technicalRider.canais_mixer,
            amplificadores: technicalRider.amplificadores || null,
            instrumentos_fornecidos: technicalRider.instrumentos_fornecidos || null,
            tomadas_110v: technicalRider.tomadas_110v,
            tomadas_220v: technicalRider.tomadas_220v,
            extensoes_necessarias: technicalRider.extensoes_necessarias,
            tamanho_palco_minimo: technicalRider.tamanho_palco_minimo || null,
            altura_palco_minima: technicalRider.altura_palco_minima || null,
            cobertura_necessaria: technicalRider.cobertura_necessaria,
            iluminacao_basica: technicalRider.iluminacao_basica,
            iluminacao_especial: technicalRider.iluminacao_especial || null,
            camarim_necessario: technicalRider.camarim_necessario,
            estacionamento_necessario: technicalRider.estacionamento_necessario,
            seguranca_necessaria: technicalRider.seguranca_necessaria,
            equipamentos_especiais: technicalRider.equipamentos_especiais || null,
            observacoes_gerais: technicalRider.observacoes_gerais || null
          });

        if (riderError) throw riderError;
        console.log('Rider técnico criado');
      }

      // Criar mapa de palco se tiver dados relevantes
      const hasStageMapData = stageMap.nome !== "Mapa de Palco" ||
                             stageMap.descricao ||
                             stageMap.posicao_vocal ||
                             stageMap.posicao_guitarra ||
                             stageMap.posicao_baixo ||
                             stageMap.posicao_bateria;

      if (hasStageMapData) {
        const { error: stageMapError } = await client
          .from('banda_mapa_palco')
          .insert({
            tenant_id: tenantId,
            banda_id: bandId,
            nome: stageMap.nome,
            descricao: stageMap.descricao || null,
            posicao_vocal: stageMap.posicao_vocal || null,
            posicao_guitarra: stageMap.posicao_guitarra || null,
            posicao_baixo: stageMap.posicao_baixo || null,
            posicao_bateria: stageMap.posicao_bateria || null,
            posicao_teclado: stageMap.posicao_teclado || null,
            posicao_amplificadores: stageMap.posicao_amplificadores || null,
            posicao_monitores: stageMap.posicao_monitores || null,
            posicao_microfones: stageMap.posicao_microfones || null,
            posicoes_outros: stageMap.posicoes_outros || null,
            observacoes: stageMap.observacoes || null
          });

        if (stageMapError) throw stageMapError;
        console.log('Mapa de palco criado');
      }

      // Adicionar criador como membro da banda
      const { error: memberError } = await client
        .from('banda_membro')
        .insert({
          banda_id: bandId,
          user_id: userId,
          papel: 'criador'
        });

      if (memberError) throw memberError;

      console.log('Banda criada com sucesso completo');
      toast.success("Banda criada com sucesso!");
      onBandCreated({ ...bandData, members_count: 1 });
      onOpenChange(false);
      
      // Reset all forms
      resetForms();
    } catch (error: unknown) {
      console.error('Erro detalhado ao criar banda:', error);
      
      let errorMessage = "Erro ao criar banda";
      if (error instanceof Error) {
        if (error.message.includes('tenant_id')) {
          errorMessage = "Erro de configuração do usuário. Entre em contato com o suporte.";
        } else if (error.message.includes('permission')) {
          errorMessage = "Você não tem permissão para criar bandas.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setBandInfo({
      nome: "",
      genero: "",
      descricao: "",
      unidade_id: "",
      instagram: "",
      facebook: "",
      youtube: "",
      spotify: "",
      apple_music: "",
      soundcloud: "",
      bandcamp: "",
      website: ""
    });
    setMembers([{
      nome: "",
      instrumento: "",
      funcao: "",
      telefone: "",
      email: "",
      instagram: "",
      facebook: "",
      youtube: "",
      spotify: "",
      data_entrada: new Date().toISOString().split('T')[0],
      observacoes: ""
    }]);
    setRepertoire([]);
    setTechnicalRider({
      nome: "Rider Técnico",
      descricao: "",
      microfones_vocal: 0,
      microfones_instrumento: 0,
      direct_boxes: 0,
      monitores_palco: 0,
      canais_mixer: 0,
      amplificadores: "",
      instrumentos_fornecidos: "",
      tomadas_110v: 0,
      tomadas_220v: 0,
      extensoes_necessarias: false,
      tamanho_palco_minimo: "",
      altura_palco_minima: "",
      cobertura_necessaria: false,
      iluminacao_basica: true,
      iluminacao_especial: "",
      camarim_necessario: false,
      estacionamento_necessario: false,
      seguranca_necessaria: false,
      equipamentos_especiais: "",
      observacoes_gerais: ""
    });
    setStageMap({
      nome: "Mapa de Palco",
      descricao: "",
      posicao_vocal: "",
      posicao_guitarra: "",
      posicao_baixo: "",
      posicao_bateria: "",
      posicao_teclado: "",
      posicao_amplificadores: "",
      posicao_monitores: "",
      posicao_microfones: "",
      posicoes_outros: "",
      observacoes: ""
    });
    setCurrentTab("info");
  };

  const getTabBadge = (tab: TabType) => {
    switch (tab) {
      case "info":
        return bandInfo.nome ? "✓" : "!";
      case "members":
        return members.length > 0 && members.every(m => m.nome && m.instrumento && m.data_entrada) ? "✓" : "!";
      case "repertoire":
        return repertoire.length > 0 ? `${repertoire.length}` : "0";
      case "rider": {
        const hasRiderData = technicalRider.microfones_vocal > 0 || 
                            technicalRider.microfones_instrumento > 0 || 
                            technicalRider.descricao;
        return hasRiderData ? "✓" : "○";
      }
      case "stagemap": {
        const hasMapData = stageMap.posicao_vocal || stageMap.posicao_guitarra || stageMap.descricao;
        return hasMapData ? "✓" : "○";
      }
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nova Banda - Cadastro Completo</DialogTitle>
          <DialogDescription>
            Cadastre uma nova banda com todas as informações profissionais
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as TabType)} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <span>Banda</span>
              <Badge variant={getTabBadge("info") === "✓" ? "default" : "secondary"} className="text-xs">
                {getTabBadge("info")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <span>Integrantes</span>
              <Badge variant={getTabBadge("members") === "✓" ? "default" : "secondary"} className="text-xs">
                {getTabBadge("members")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="repertoire" className="flex items-center gap-2">
              <span>Repertório</span>
              <Badge variant="outline" className="text-xs">
                {getTabBadge("repertoire")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rider" className="flex items-center gap-2">
              <span>Rider</span>
              <Badge variant={getTabBadge("rider") === "✓" ? "default" : "outline"} className="text-xs">
                {getTabBadge("rider")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="stagemap" className="flex items-center gap-2">
              <span>Palco</span>
              <Badge variant={getTabBadge("stagemap") === "✓" ? "default" : "outline"} className="text-xs">
                {getTabBadge("stagemap")}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="info" className="space-y-6">
              <BandInfoForm 
                data={bandInfo} 
                onChange={setBandInfo} 
                unidades={unidades}
              />
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <BandMembersForm 
                members={members} 
                onChange={setMembers}
              />
            </TabsContent>

            <TabsContent value="repertoire" className="space-y-6">
              <RepertoireForm 
                songs={repertoire} 
                onChange={setRepertoire}
              />
            </TabsContent>

            <TabsContent value="rider" className="space-y-6">
              <TechnicalRiderForm 
                data={technicalRider} 
                onChange={setTechnicalRider}
              />
            </TabsContent>

            <TabsContent value="stagemap" className="space-y-6">
              <StageMapForm 
                data={stageMap} 
                onChange={setStageMap}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            
            {currentTab !== "info" && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handlePrevious}
              >
                Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentTab !== "stagemap" ? (
              <Button 
                type="button" 
                onClick={handleNext}
                disabled={!validateCurrentTab(false)}
              >
                Próximo
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isLoading || !validateCurrentTab(false)}
              >
                {isLoading ? "Salvando..." : "Criar Banda"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}