import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { Calendar, Download, FileText, Filter, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ReportConfig {
  type: 'csv' | 'pdf' | 'period';
  dateRange: DateRange | undefined;
  includeTypes: {
    receitas: boolean;
    despesas: boolean;
    caches: boolean;
  };
  groupBy: 'categoria' | 'evento' | 'banda' | 'status' | 'mes';
  filterBy: {
    eventos: string[];
    bandas: string[];
    categorias: string[];
    status: string[];
  };
}

interface ReportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: ReportConfig) => void;
  reportType: 'csv' | 'pdf' | 'period';
  isGenerating?: boolean;
}

const ReportConfigModal = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  reportType,
  isGenerating = false 
}: ReportConfigModalProps) => {
  // Estado inicial do formulário
  const [config, setConfig] = useState<ReportConfig>({
    type: reportType,
    dateRange: {
      from: addDays(new Date(), -30),
      to: new Date()
    },
    includeTypes: {
      receitas: true,
      despesas: true,
      caches: true
    },
    groupBy: 'categoria',
    filterBy: {
      eventos: [],
      bandas: [],
      categorias: [],
      status: []
    }
  });

  // Presets de período
  const periodPresets = [
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 30 dias', days: 30 },
    { label: 'Últimos 90 dias', days: 90 },
    { label: 'Último ano', days: 365 },
    { label: 'Mês atual', days: 'current-month' as const },
    { label: 'Ano atual', days: 'current-year' as const }
  ];

  const handlePresetSelect = (preset: typeof periodPresets[0]) => {
    let from: Date;
    let to = new Date();

    if (preset.days === 'current-month') {
      from = new Date(to.getFullYear(), to.getMonth(), 1);
    } else if (preset.days === 'current-year') {
      from = new Date(to.getFullYear(), 0, 1);
    } else {
      from = addDays(to, -preset.days);
    }

    setConfig(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  };

  const handleTypeToggle = (type: keyof typeof config.includeTypes) => {
    setConfig(prev => ({
      ...prev,
      includeTypes: {
        ...prev.includeTypes,
        [type]: !prev.includeTypes[type]
      }
    }));
  };

  const handleGenerate = () => {
    onGenerate(config);
  };

  const getModalTitle = () => {
    switch (reportType) {
      case 'csv': return 'Configurar Exportação CSV';
      case 'pdf': return 'Configurar Relatório PDF';
      case 'period': return 'Configurar Relatório por Período';
      default: return 'Configurar Relatório';
    }
  };

  const getModalDescription = () => {
    switch (reportType) {
      case 'csv': return 'Configure os dados que deseja exportar em formato CSV';
      case 'pdf': return 'Configure o relatório PDF com gráficos e análises';
      case 'period': return 'Configure um relatório personalizado por período';
      default: return 'Configure as opções do seu relatório';
    }
  };

  const getButtonIcon = () => {
    switch (reportType) {
      case 'csv': return <Download className="h-4 w-4 mr-2" />;
      case 'pdf': return <FileText className="h-4 w-4 mr-2" />;
      case 'period': return <Calendar className="h-4 w-4 mr-2" />;
      default: return <Filter className="h-4 w-4 mr-2" />;
    }
  };

  const getButtonText = () => {
    switch (reportType) {
      case 'csv': return 'Exportar CSV';
      case 'pdf': return 'Gerar PDF';
      case 'period': return 'Gerar Relatório';
      default: return 'Gerar';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getButtonIcon()}
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Período */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Período do Relatório</Label>
                
                {/* Presets de Período */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {periodPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className="justify-start"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                {/* Seletor de Data Personalizado */}
                <div className="space-y-2">
                  <Label>Período Personalizado</Label>
                  <DatePickerWithRange
                    date={config.dateRange}
                    onDateChange={(dateRange) => setConfig(prev => ({ ...prev, dateRange }))}
                  />
                  {config.dateRange?.from && config.dateRange?.to && (
                    <p className="text-sm text-muted-foreground">
                      {format(config.dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                      {format(config.dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Transação */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Tipos de Transação</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="receitas"
                      checked={config.includeTypes.receitas}
                      onCheckedChange={() => handleTypeToggle('receitas')}
                    />
                    <Label htmlFor="receitas" className="text-sm font-medium">
                      Receitas
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="despesas"
                      checked={config.includeTypes.despesas}
                      onCheckedChange={() => handleTypeToggle('despesas')}
                    />
                    <Label htmlFor="despesas" className="text-sm font-medium">
                      Despesas
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caches"
                      checked={config.includeTypes.caches}
                      onCheckedChange={() => handleTypeToggle('caches')}
                    />
                    <Label htmlFor="caches" className="text-sm font-medium">
                      Cachês
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agrupamento */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Agrupar Por</Label>
                <Select
                  value={config.groupBy}
                  onValueChange={(value: typeof config.groupBy) => 
                    setConfig(prev => ({ ...prev, groupBy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione como agrupar os dados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categoria">Categoria</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="banda">Banda</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="mes">Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resumo da Configuração */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Resumo da Configuração:</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Período:</strong>{' '}
                    {config.dateRange?.from && config.dateRange?.to
                      ? `${format(config.dateRange.from, 'dd/MM/yyyy')} até ${format(config.dateRange.to, 'dd/MM/yyyy')}`
                      : 'Não selecionado'
                    }
                  </p>
                  <p>
                    <strong>Tipos:</strong>{' '}
                    {Object.entries(config.includeTypes)
                      .filter(([_, included]) => included)
                      .map(([type]) => type.charAt(0).toUpperCase() + type.slice(1))
                      .join(', ') || 'Nenhum selecionado'
                    }
                  </p>
                  <p>
                    <strong>Agrupamento:</strong> {config.groupBy.charAt(0).toUpperCase() + config.groupBy.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !config.dateRange?.from || !config.dateRange?.to}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              getButtonIcon()
            )}
            {isGenerating ? 'Gerando...' : getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportConfigModal;
