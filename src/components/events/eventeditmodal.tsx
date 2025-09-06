import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { LocationAutocomplete } from "@/components/forms/LocationAutocomplete";
import { BandMultiSelect } from "@/components/forms/BandMultiSelect";
import { TimePickerField } from "@/components/forms/TimePickerField";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseOptimized } from "@/hooks/useSupabaseOptimized";
import { supabase } from "@/integrations/supabase/client";
import type { EventItem } from "@/pages/Events";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Band {
  id: string;
  nome: string;
  genero: string | null;
}

interface EventEditModalProps {
  /** ID do evento a ser editado */
  eventId: string;
  /** Modo de operação do modal */
  mode?: 'edit' | 'view';
  /** Controla se o modal está aberto */
  open: boolean;
  /** Callback chamado quando o estado de abertura muda */
  onOpenChange: (open: boolean) => void;
  /** Callback opcional chamado após atualização bem-sucedida */
  onEventUpdated?: (eventId: string) => void;
}

interface EventData {
  id: string;
  titulo: string;
  tipo: 'evento' | 'ensaio' | 'aula';
  inicio: string; // ISO timestamp
  fim?: string;
  local: string;
  endereco?: string;
  orcamento?: number;
  descricao?: string;
  bandas: Array<{ id: string; nome: string; genero: string | null }>;
}

const MAX_RETRY_ATTEMPTS = 3;

export function EventEditModal({
  eventId,
  mode = 'edit',
  open,
  onOpenChange,
  onEventUpdated,
}: EventEditModalProps) {
  // Estados principais
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'evento' as 'evento' | 'ensaio' | 'aula',
    inicio: '',
    fim: '',
    local: '',
    endereco: '',
    orcamento: '',
    descricao: '',
    bandas: [] as Array<{ id: string; nome: string; genero: string | null }>
  });

  // Ref para controle de AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { toast } = useToast();
  const { query, mutate, clearCache } = useSupabaseOptimized();

  // Função para carregar dados do evento
  const loadEventData = useCallback(async () => {
    if (!eventId || !open) return;

    setIsLoadingData(true);
    setError(null);

    try {
      // Buscar dados reais do evento no banco
      const { data: evento, error: eventoError } = await supabase
        .from('evento')
        .select(`
          id,
          titulo,
          tipo,
          inicio,
          fim,
          local,
          endereco,
          orcamento,
          descricao
        `)
        .eq('id', eventId)
        .single();

      if (eventoError) {
        throw new Error(`Erro ao buscar evento: ${eventoError.message}`);
      }

      if (!evento) {
        throw new Error('Evento não encontrado');
      }

      // Buscar bandas associadas ao evento
      const { data: eventoBandas, error: bandasError } = await supabase
        .from('evento_banda')
        .select(`
          banda_id,
          banda!fk_evento_banda_banda (
            id,
            nome,
            genero
          )
        `)
        .eq('evento_id', eventId);

      if (bandasError) {
        console.warn('Erro ao buscar bandas do evento:', bandasError);
      }

      // Processar bandas corretamente
      const bandas: Band[] = eventoBandas?.map(eb => ({
        id: (eb.banda as any).id,
        nome: (eb.banda as any).nome,
        genero: (eb.banda as any).genero
      })) || [];

      console.log('Bandas carregadas do banco:', bandas);

      const eventData: EventData = {
        id: evento.id,
        titulo: evento.titulo,
        tipo: evento.tipo as 'evento' | 'ensaio' | 'aula',
        inicio: evento.inicio,
        fim: evento.fim,
        local: evento.local,
        endereco: evento.endereco,
        orcamento: evento.orcamento ? Number(evento.orcamento) : undefined,
        descricao: evento.descricao,
        bandas: bandas
      };

      setEventData(eventData);
      setFormData({
        titulo: eventData.titulo,
        tipo: eventData.tipo,
        inicio: eventData.inicio,
        fim: eventData.fim || '',
        local: eventData.local,
        endereco: eventData.endereco || '',
        orcamento: eventData.orcamento?.toString() || '',
        descricao: eventData.descricao || '',
        bandas: eventData.bandas
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do evento');
      console.error('Erro ao carregar evento:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [eventId, open]);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && eventId) {
      loadEventData();
    }
  }, [open, eventId, loadEventData]);

  // Função para salvar evento
  const handleSave = useCallback(async () => {
    if (!eventData) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validar campos obrigatórios
      if (!formData.titulo || !formData.inicio || !formData.local) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Preparar dados para salvamento
      const updateData = {
        p_evento_id: eventId,
        p_titulo: formData.titulo,
        p_tipo: formData.tipo,
        p_inicio: formData.inicio,
        p_local: formData.local,
        p_fim: formData.fim || null,
        p_endereco: formData.endereco || null,
        p_orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        p_observacoes: formData.descricao || null,
        p_banda_ids: formData.bandas.map(banda => banda.id)
      };

      console.log('Salvando evento com dados:', updateData);
      console.log('Bandas sendo enviadas:', updateData.p_banda_ids);
      console.log('FormData.bandas completo:', formData.bandas);

      // Chamar função do backend
      const { data, error } = await supabase.rpc('update_evento_full', updateData);

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Evento salvo com sucesso:', data);
      
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!",
      });

      onEventUpdated?.(eventId);
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao salvar evento';
      setError(errorMessage);
      console.error('Erro ao salvar evento:', err);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [eventData, eventId, formData, onEventUpdated, onOpenChange, toast, supabase]);

  // Função para retry
  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      setRetryCount(prev => prev + 1);
      setIsRetrying(true);
      setTimeout(() => {
        setIsRetrying(false);
        loadEventData();
      }, 1000 * retryCount);
    }
  }, [retryCount, loadEventData]);

  // Renderização condicional baseada no estado
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' ? 'Visualizar Evento' : 'Editar Evento'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' 
              ? 'Visualize os detalhes do evento'
              : 'Edite as informações do evento'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {retryCount < MAX_RETRY_ATTEMPTS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="ml-2"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    'Tentar Novamente'
                  )}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isLoadingData ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  disabled={mode === 'view' || isSaving}
                  placeholder="Nome do evento"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: 'evento' | 'ensaio' | 'aula') => setFormData(prev => ({ ...prev, tipo: value }))}
                  disabled={mode === 'view' || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evento">Show</SelectItem>
                    <SelectItem value="ensaio">Ensaio</SelectItem>
                    <SelectItem value="aula">Aula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <DatePickerField
                  label="Data de Início *"
                  value={formData.inicio ? new Date(formData.inicio) : undefined}
                  onChange={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, inicio: date.toISOString() }));
                    }
                  }}
                  disabled={mode === 'view' || isSaving}
                  required
                />
              </div>
              <div>
                <TimePickerField
                  label="Horário de Início"
                  value={formData.inicio ? new Date(formData.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  onChange={(time) => {
                    if (formData.inicio) {
                      const date = new Date(formData.inicio);
                      const [hours, minutes] = time.split(':');
                      date.setHours(parseInt(hours), parseInt(minutes));
                      setFormData(prev => ({ ...prev, inicio: date.toISOString() }));
                    }
                  }}
                  disabled={mode === 'view' || isSaving}
                />
              </div>
            </div>

            <div>
              <Label>Local *</Label>
              <LocationAutocomplete
              onLocationSelect={(location) => {
                setFormData(prev => ({
                  ...prev,
                  local: location.name,
                  endereco: location.address
                }));
              }}
              initialLocation={formData.local}
              initialAddress={formData.endereco}
              disabled={mode === 'view' || isSaving}
            />
            </div>

            <div>
              <Label>Bandas</Label>
              <BandMultiSelect
               selectedBands={formData.bandas}
               onBandsChange={(bands) => setFormData(prev => ({ ...prev, bandas: bands }))}
               disabled={mode === 'view' || isSaving}
             />
            </div>

            <div>
              <Label htmlFor="orcamento">Orçamento</Label>
              <Input
                id="orcamento"
                type="number"
                value={formData.orcamento}
                onChange={(e) => setFormData(prev => ({ ...prev, orcamento: e.target.value }))}
                disabled={mode === 'view' || isSaving}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                disabled={mode === 'view' || isSaving}
                placeholder="Descrição do evento"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {mode === 'view' ? 'Fechar' : 'Cancelar'}
          </Button>
          {mode === 'edit' && (
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoadingData}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}