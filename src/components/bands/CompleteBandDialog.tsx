import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { useToast } from "@/hooks/use-toast";
import { Edit, Eye, Loader2, Save, X } from "lucide-react";

// Import form components
import { BandInfoForm, type BandInfoData } from "./forms/BandInfoForm";
import { BandMembersForm, type BandMemberData } from "./forms/BandMembersForm";
import { RepertoireForm, type RepertoireSongData } from "./forms/RepertoireForm";
import { TechnicalRiderForm, type TechnicalRiderData } from "./forms/TechnicalRiderForm";
import { StageMapForm, type StageMapData } from "./forms/StageMapForm";

interface CompleteBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string | null;
  mode?: "view" | "edit";
  onBandUpdated?: (band: Band) => void;
}

interface Unidade {
  id: string;
  nome: string;
}

interface Band {
  id: string;
  nome: string;
  genero: string;
  descricao: string;
  logo_url?: string;
  unidade_id?: string;
  ativa?: boolean;
  [key: string]: unknown;
}

interface ValidationError {
  field: string;
  message: string;
}

interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

interface LoadDataResult {
  success: boolean;
  error?: string;
}

export function CompleteBandDialog({ 
  open, 
  onOpenChange, 
  bandId, 
  mode = "view",
  onBandUpdated 
}: CompleteBandDialogProps) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  
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
  
  const [members, setMembers] = useState<BandMemberData[]>([]);
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
    tomadas_110v: 0,
    tomadas_220v: 0,
    extensoes_necessarias: false,
    tamanho_palco_minimo: "",
    altura_palco_minima: "",
    iluminacao_basica: true,
    iluminacao_especial: "",
    cobertura_necessaria: false,
    camarim_necessario: false,
    estacionamento_necessario: false,
    seguranca_necessaria: false,
    instrumentos_fornecidos: "",
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
    posicoes_outros: "",
    posicao_amplificadores: "",
    posicao_monitores: "",
    posicao_microfones: "",
    observacoes: ""
  });
  
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [bandData, setBandData] = useState<Band | null>(null);
  
  const { client } = useSupabaseOptimized();
  const { toast } = useToast();

  // Validation functions
  const validateBandInfo = useCallback((data: BandInfoData): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!data.nome?.trim()) {
      errors.push({ field: 'nome', message: 'Nome da banda é obrigatório' });
    }
    
    if (!data.unidade_id) {
      errors.push({ field: 'unidade_id', message: 'Unidade é obrigatória' });
    }
    
    if (data.nome && data.nome.length > 100) {
      errors.push({ field: 'nome', message: 'Nome da banda deve ter no máximo 100 caracteres' });
    }
    
    return errors;
  }, []);

  const validateMembers = useCallback((members: BandMemberData[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (members.length === 0) {
      errors.push({ field: 'members', message: 'Pelo menos um integrante é obrigatório' });
      return errors;
    }
    
    members.forEach((member, index) => {
      if (!member.nome?.trim()) {
        errors.push({ field: `member_${index}_nome`, message: `Nome do integrante ${index + 1} é obrigatório` });
      }
      if (!member.instrumento?.trim()) {
        errors.push({ field: `member_${index}_instrumento`, message: `Instrumento do integrante ${index + 1} é obrigatório` });
      }
      if (!member.data_entrada) {
        errors.push({ field: `member_${index}_data_entrada`, message: `Data de entrada do integrante ${index + 1} é obrigatória` });
      }
    });
    
    return errors;
  }, []);

  const validateAllData = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    errors.push(...validateBandInfo(bandInfo));
    errors.push(...validateMembers(members));
    
    return errors;
  }, [bandInfo, members, validateBandInfo, validateMembers]);

  useEffect(() => {
    if (open && bandId) {
      loadBandData();
      loadUnidades();
    }
  }, [open, bandId]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const loadUnidades = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await client
        .from('unidade')
        .select('id, nome')
        .order('nome');
      
      if (error) {
        throw new Error(`Erro ao carregar unidades: ${error.message}`);
      }
      
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar unidades';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [client, toast]);

  const loadBandData = useCallback(async () => {
    if (!bandId) return;
    
    setLoading(true);
    try {
      // Load all band related data
      const [
        bandResponse,
        membersResponse,
        repertoireResponse,
        riderResponse,
        stageMapResponse
      ] = await Promise.all([
        client.from('banda').select('*').eq('id', bandId).maybeSingle(),
        client.from('banda_integrante').select('*').eq('banda_id', bandId).eq('ativo', true),
        client.from('banda_repertorio').select('*').eq('banda_id', bandId).eq('ativo', true),
        client.from('banda_rider_tecnico').select('*').eq('banda_id', bandId).maybeSingle(),
        client.from('banda_mapa_palco').select('*').eq('banda_id', bandId).maybeSingle()
      ]);

      if (bandResponse.error) throw bandResponse.error;
      if (!bandResponse.data) {
        console.warn(`Banda com ID ${bandId} não encontrada no banco de dados`);
        onOpenChange(false); // Fechar o modal
        toast({
          title: "Banda não encontrada",
          description: "A banda selecionada não existe mais no sistema.",
          variant: "destructive",
        });
        return;
      }
      
      const band = bandResponse.data;
      setBandData(band);
      
      // Set band info
      setBandInfo({
        nome: band.nome || "",
        genero: band.genero || "",
        descricao: band.descricao || "",
        unidade_id: band.unidade_id || "",
        instagram: band.instagram || "",
        facebook: band.facebook || "",
        youtube: band.youtube || "",
        spotify: band.spotify || "",
        apple_music: band.apple_music || "",
        soundcloud: band.soundcloud || "",
        bandcamp: band.bandcamp || "",
        website: band.website || ""
      });

      // Set members
      if (!membersResponse.error && membersResponse.data) {
        setMembers(membersResponse.data.map(member => ({
          nome: member.nome || "",
          instrumento: member.instrumento || "",
          funcao: member.funcao || "",
          telefone: member.telefone || "",
          email: member.email || "",
          instagram: member.instagram || "",
          facebook: member.facebook || "",
          youtube: member.youtube || "",
          spotify: member.spotify || "",
          data_entrada: member.data_entrada || new Date().toISOString().split('T')[0],
          observacoes: member.observacoes || ""
        })));
      }

      // Set repertoire
      if (!repertoireResponse.error && repertoireResponse.data) {
        setRepertoire(repertoireResponse.data.map(song => ({
          titulo: song.titulo || "",
          artista_original: song.artista_original || "",
          genero: song.genero || "",
          duracao_minutos: song.duracao_minutos || 0,
          tom: song.tom || "",
          bpm: song.bpm || 0,
          tipo: song.tipo || "cover",
          dificuldade: song.dificuldade || "medio",
          observacoes: song.observacoes || "",
          letra: song.letra || "",
          cifra: song.cifra || ""
        })));
      }

      // Set technical rider
      if (!riderResponse.error && riderResponse.data) {
        const rider = riderResponse.data;
        setTechnicalRider({
          nome: rider.nome || "Rider Técnico",
          descricao: rider.descricao || "",
          microfones_vocal: rider.microfones_vocal || 0,
          microfones_instrumento: rider.microfones_instrumento || 0,
          direct_boxes: rider.direct_boxes || 0,
          monitores_palco: rider.monitores_palco || 0,
          canais_mixer: rider.canais_mixer || 0,
          amplificadores: rider.amplificadores || "",
          tomadas_110v: rider.tomadas_110v || 0,
          tomadas_220v: rider.tomadas_220v || 0,
          extensoes_necessarias: rider.extensoes_necessarias || false,
          tamanho_palco_minimo: rider.tamanho_palco_minimo || "",
          altura_palco_minima: rider.altura_palco_minima || "",
          iluminacao_basica: rider.iluminacao_basica !== false,
          iluminacao_especial: rider.iluminacao_especial || "",
          cobertura_necessaria: rider.cobertura_necessaria || false,
          camarim_necessario: rider.camarim_necessario || false,
          estacionamento_necessario: rider.estacionamento_necessario || false,
          seguranca_necessaria: rider.seguranca_necessaria || false,
          instrumentos_fornecidos: rider.instrumentos_fornecidos || "",
          equipamentos_especiais: rider.equipamentos_especiais || "",
          observacoes_gerais: rider.observacoes_gerais || ""
        });
      }

      // Set stage map
      if (!stageMapResponse.error && stageMapResponse.data) {
        const map = stageMapResponse.data;
        setStageMap({
          nome: map.nome || "Mapa de Palco",
          descricao: map.descricao || "",
          posicao_vocal: map.posicao_vocal || "",
          posicao_guitarra: map.posicao_guitarra || "",
          posicao_baixo: map.posicao_baixo || "",
          posicao_bateria: map.posicao_bateria || "",
          posicao_teclado: map.posicao_teclado || "",
          posicoes_outros: map.posicoes_outros || "",
          posicao_amplificadores: map.posicao_amplificadores || "",
          posicao_monitores: map.posicao_monitores || "",
          posicao_microfones: map.posicao_microfones || "",
          observacoes: map.observacoes || ""
        });
      }

    } catch (error) {
      console.error('Erro ao carregar dados da banda:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados da banda';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [bandId, client, toast]);

  const handleSave = async (): Promise<void> => {
    if (!bandId) {
      toast({
        title: "Erro",
        description: "ID da banda não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all data before saving
    const validationErrors = validateAllData();
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.map(error => error.message).join(', ');
      toast({
        title: "Erro de Validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      // Get user's tenant_id
      const { data: profileData } = await client
        .from('profiles')
        .select('tenant_id')
        .eq('id', (await client.auth.getUser()).data.user?.id)
        .single();

      const tenantId = profileData?.tenant_id;
      if (!tenantId) throw new Error('Tenant ID não encontrado');

      // Update band basic info
      const { error: bandError } = await client
        .from('banda')
        .update({
          nome: bandInfo.nome,
          genero: bandInfo.genero || null,
          descricao: bandInfo.descricao || null,
          unidade_id: bandInfo.unidade_id || null,
          instagram: bandInfo.instagram || null,
          facebook: bandInfo.facebook || null,
          youtube: bandInfo.youtube || null,
          spotify: bandInfo.spotify || null,
          apple_music: bandInfo.apple_music || null,
          soundcloud: bandInfo.soundcloud || null,
          bandcamp: bandInfo.bandcamp || null,
          website: bandInfo.website || null
        })
        .eq('id', bandId);

      if (bandError) throw bandError;

      // Delete existing members and add new ones
      await client.from('banda_integrante').delete().eq('banda_id', bandId);
      
      if (members.length > 0) {
        const { error: membersError } = await client
          .from('banda_integrante')
          .insert(
            members.map(member => ({
              banda_id: bandId,
              tenant_id: tenantId,
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
            }))
          );

        if (membersError) throw membersError;
      }

      // Delete existing repertoire and add new ones
      await client.from('banda_repertorio').delete().eq('banda_id', bandId);
      
      if (repertoire.length > 0) {
        const { error: repertoireError } = await client
          .from('banda_repertorio')
          .insert(
            repertoire.map(song => ({
              banda_id: bandId,
              tenant_id: tenantId,
              titulo: song.titulo,
              artista_original: song.artista_original || null,
              genero: song.genero || null,
              duracao_minutos: song.duracao_minutos || null,
              tom: song.tom || null,
              bpm: song.bpm || null,
              tipo: song.tipo,
              dificuldade: song.dificuldade,
              observacoes: song.observacoes || null,
              letra: song.letra || null,
              cifra: song.cifra || null
            }))
          );

        if (repertoireError) throw repertoireError;
      }

      // Update or insert technical rider
      const { error: riderUpsertError } = await client
        .from('banda_rider_tecnico')
        .upsert({
          banda_id: bandId,
          tenant_id: tenantId,
          nome: technicalRider.nome,
          descricao: technicalRider.descricao || null,
          microfones_vocal: technicalRider.microfones_vocal,
          microfones_instrumento: technicalRider.microfones_instrumento,
          direct_boxes: technicalRider.direct_boxes,
          monitores_palco: technicalRider.monitores_palco,
          canais_mixer: technicalRider.canais_mixer,
          amplificadores: technicalRider.amplificadores || null,
          tomadas_110v: technicalRider.tomadas_110v,
          tomadas_220v: technicalRider.tomadas_220v,
          extensoes_necessarias: technicalRider.extensoes_necessarias,
          tamanho_palco_minimo: technicalRider.tamanho_palco_minimo || null,
          altura_palco_minima: technicalRider.altura_palco_minima || null,
          iluminacao_basica: technicalRider.iluminacao_basica,
          iluminacao_especial: technicalRider.iluminacao_especial || null,
          cobertura_necessaria: technicalRider.cobertura_necessaria,
          camarim_necessario: technicalRider.camarim_necessario,
          estacionamento_necessario: technicalRider.estacionamento_necessario,
          seguranca_necessaria: technicalRider.seguranca_necessaria,
          instrumentos_fornecidos: technicalRider.instrumentos_fornecidos || null,
          equipamentos_especiais: technicalRider.equipamentos_especiais || null,
          observacoes_gerais: technicalRider.observacoes_gerais || null
        });

      if (riderUpsertError) throw riderUpsertError;

      // Update or insert stage map
      const { error: stageMapUpsertError } = await client
        .from('banda_mapa_palco')
        .upsert({
          banda_id: bandId,
          tenant_id: tenantId,
          nome: stageMap.nome,
          descricao: stageMap.descricao || null,
          posicao_vocal: stageMap.posicao_vocal || null,
          posicao_guitarra: stageMap.posicao_guitarra || null,
          posicao_baixo: stageMap.posicao_baixo || null,
          posicao_bateria: stageMap.posicao_bateria || null,
          posicao_teclado: stageMap.posicao_teclado || null,
          posicoes_outros: stageMap.posicoes_outros || null,
          posicao_amplificadores: stageMap.posicao_amplificadores || null,
          posicao_monitores: stageMap.posicao_monitores || null,
          posicao_microfones: stageMap.posicao_microfones || null,
          observacoes: stageMap.observacoes || null
        });

      if (stageMapUpsertError) throw stageMapUpsertError;

      toast({
        title: "Sucesso",
        description: "Banda atualizada com sucesso!",
      });

      if (onBandUpdated && bandData) {
        onBandUpdated({ ...bandData, ...bandInfo });
      }

      setCurrentMode("view");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar banda';
      console.error('Erro ao salvar banda:', error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderViewMode = () => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="members">Integrantes</TabsTrigger>
          <TabsTrigger value="repertoire">Repertório</TabsTrigger>
          <TabsTrigger value="rider">Rider Técnico</TabsTrigger>
          <TabsTrigger value="stage">Mapa de Palco</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Banda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Nome</h4>
                  <p>{bandInfo.nome || "—"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Gênero</h4>
                  <p>{bandInfo.genero || "—"}</p>
                </div>
              </div>
              {bandInfo.descricao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Descrição</h4>
                  <p className="whitespace-pre-wrap">{bandInfo.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrantes da Banda</CardTitle>
              <CardDescription>{members.length} integrantes cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground">Nenhum integrante cadastrado</p>
              ) : (
                <div className="space-y-4">
                  {members.map((member, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">{member.nome}</h4>
                            <p className="text-sm text-muted-foreground">{member.instrumento}</p>
                            {member.funcao && <p className="text-sm">{member.funcao}</p>}
                          </div>
                          <div className="text-sm">
                            {member.telefone && <p>Tel: {member.telefone}</p>}
                            {member.email && <p>Email: {member.email}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repertoire" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repertório</CardTitle>
              <CardDescription>{repertoire.length} músicas cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              {repertoire.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma música cadastrada</p>
              ) : (
                <div className="space-y-4">
                  {repertoire.map((song, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">{song.titulo}</h4>
                            <p className="text-sm text-muted-foreground">{song.artista_original}</p>
                            <Badge variant="outline" className="mt-1">{song.tipo}</Badge>
                          </div>
                          <div className="text-sm">
                            {song.genero && <p>Gênero: {song.genero}</p>}
                            {song.duracao_minutos > 0 && <p>Duração: {song.duracao_minutos}min</p>}
                            {song.tom && <p>Tom: {song.tom}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rider" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rider Técnico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Microfones Vocal</h4>
                  <p>{technicalRider.microfones_vocal}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Microfones Instrumento</h4>
                  <p>{technicalRider.microfones_instrumento}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Direct Boxes</h4>
                  <p>{technicalRider.direct_boxes}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Monitores</h4>
                  <p>{technicalRider.monitores_palco}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Palco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Vocal</h4>
                  <p>{stageMap.posicao_vocal || "—"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Guitarra</h4>
                  <p>{stageMap.posicao_guitarra || "—"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Baixo</h4>
                  <p>{stageMap.posicao_baixo || "—"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Bateria</h4>
                  <p>{stageMap.posicao_bateria || "—"}</p>
                </div>
              </div>
              {stageMap.observacoes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                  <p className="whitespace-pre-wrap">{stageMap.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <Button onClick={() => setCurrentMode("edit")}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Banda
        </Button>
      </div>
    </div>
  );

  const renderEditMode = () => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="members">Integrantes</TabsTrigger>
          <TabsTrigger value="repertoire">Repertório</TabsTrigger>
          <TabsTrigger value="rider">Rider Técnico</TabsTrigger>
          <TabsTrigger value="stage">Mapa de Palco</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <BandInfoForm 
            data={bandInfo} 
            onChange={setBandInfo} 
            unidades={unidades}
          />
        </TabsContent>

        <TabsContent value="members">
          <BandMembersForm 
            members={members} 
            onChange={setMembers}
          />
        </TabsContent>

        <TabsContent value="repertoire">
          <RepertoireForm 
            songs={repertoire} 
            onChange={setRepertoire}
          />
        </TabsContent>

        <TabsContent value="rider">
          <TechnicalRiderForm 
            data={technicalRider} 
            onChange={setTechnicalRider}
          />
        </TabsContent>

        <TabsContent value="stage">
          <StageMapForm 
            data={stageMap} 
            onChange={setStageMap}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setCurrentMode("view")}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>Carregando Banda</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados da banda...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentMode === "view" ? (
              <Eye className="h-5 w-5" />
            ) : (
              <Edit className="h-5 w-5" />
            )}
            {bandInfo.nome}
            {bandData && (
              <Badge variant={bandData.ativa ? "default" : "secondary"}>
                {bandData.ativa ? "Ativa" : "Inativa"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentMode === "view" 
              ? "Visualizar informações completas da banda" 
              : "Editar informações da banda"
            }
          </DialogDescription>
        </DialogHeader>

        {currentMode === "view" ? renderViewMode() : renderEditMode()}
      </DialogContent>
    </Dialog>
  );
}