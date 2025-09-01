import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface TechnicalRiderData {
  nome: string;
  descricao: string;
  microfones_vocal: number;
  microfones_instrumento: number;
  direct_boxes: number;
  monitores_palco: number;
  canais_mixer: number;
  amplificadores: string;
  instrumentos_fornecidos: string;
  tomadas_110v: number;
  tomadas_220v: number;
  extensoes_necessarias: boolean;
  tamanho_palco_minimo: string;
  altura_palco_minima: string;
  cobertura_necessaria: boolean;
  iluminacao_basica: boolean;
  iluminacao_especial: string;
  camarim_necessario: boolean;
  estacionamento_necessario: boolean;
  seguranca_necessaria: boolean;
  equipamentos_especiais: string;
  observacoes_gerais: string;
}

interface TechnicalRiderFormProps {
  data: TechnicalRiderData;
  onChange: (data: TechnicalRiderData) => void;
}

export function TechnicalRiderForm({ data, onChange }: TechnicalRiderFormProps) {
  const updateField = (field: keyof TechnicalRiderData, value: string | number | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados gerais do rider técnico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Rider</Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              placeholder="Ex: Rider Técnico Rock Prisma"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={data.descricao}
              onChange={(e) => updateField("descricao", e.target.value)}
              placeholder="Descrição geral dos requisitos técnicos..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipamentos de Áudio</CardTitle>
          <CardDescription>Especificações de microfones e equipamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="microfones_vocal">Microfones Vocal</Label>
              <Input
                id="microfones_vocal"
                type="number"
                min="0"
                max="20"
                value={data.microfones_vocal || ""}
                onChange={(e) => updateField("microfones_vocal", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="microfones_instrumento">Mics Instrumento</Label>
              <Input
                id="microfones_instrumento"
                type="number"
                min="0"
                max="20"
                value={data.microfones_instrumento || ""}
                onChange={(e) => updateField("microfones_instrumento", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="direct_boxes">Direct Boxes</Label>
              <Input
                id="direct_boxes"
                type="number"
                min="0"
                max="20"
                value={data.direct_boxes || ""}
                onChange={(e) => updateField("direct_boxes", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monitores_palco">Monitores</Label>
              <Input
                id="monitores_palco"
                type="number"
                min="0"
                max="20"
                value={data.monitores_palco || ""}
                onChange={(e) => updateField("monitores_palco", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="canais_mixer">Canais do Mixer</Label>
              <Input
                id="canais_mixer"
                type="number"
                min="0"
                max="64"
                value={data.canais_mixer || ""}
                onChange={(e) => updateField("canais_mixer", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amplificadores">Amplificadores</Label>
              <Input
                id="amplificadores"
                value={data.amplificadores}
                onChange={(e) => updateField("amplificadores", e.target.value)}
                placeholder="Ex: 2 combos guitarra, 1 head baixo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrumentos_fornecidos">Instrumentos Fornecidos</Label>
            <Textarea
              id="instrumentos_fornecidos"
              value={data.instrumentos_fornecidos}
              onChange={(e) => updateField("instrumentos_fornecidos", e.target.value)}
              placeholder="Descreva os instrumentos que o local deve fornecer..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requisitos Elétricos</CardTitle>
          <CardDescription>Necessidades de energia e tomadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tomadas_110v">Tomadas 127V</Label>
              <Input
                id="tomadas_110v"
                type="number"
                min="0"
                max="20"
                value={data.tomadas_110v || ""}
                onChange={(e) => updateField("tomadas_110v", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomadas_220v">Tomadas 220V</Label>
              <Input
                id="tomadas_220v"
                type="number"
                min="0"
                max="20"
                value={data.tomadas_220v || ""}
                onChange={(e) => updateField("tomadas_220v", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="extensoes_necessarias"
                checked={data.extensoes_necessarias}
                onCheckedChange={(checked) => updateField("extensoes_necessarias", !!checked)}
              />
              <Label htmlFor="extensoes_necessarias" className="text-sm">
                Extensões necessárias
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Especificações do Palco</CardTitle>
          <CardDescription>Requisitos de espaço e estrutura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tamanho_palco_minimo">Tamanho Mínimo do Palco</Label>
              <Input
                id="tamanho_palco_minimo"
                value={data.tamanho_palco_minimo}
                onChange={(e) => updateField("tamanho_palco_minimo", e.target.value)}
                placeholder="Ex: 6m x 4m"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="altura_palco_minima">Altura Mínima do Palco</Label>
              <Input
                id="altura_palco_minima"
                value={data.altura_palco_minima}
                onChange={(e) => updateField("altura_palco_minima", e.target.value)}
                placeholder="Ex: 0,8m"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iluminacao_especial">Iluminação Especial</Label>
            <Textarea
              id="iluminacao_especial"
              value={data.iluminacao_especial}
              onChange={(e) => updateField("iluminacao_especial", e.target.value)}
              placeholder="Descreva requisitos especiais de iluminação..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Necessidades Adicionais</CardTitle>
          <CardDescription>Requisitos extras para o evento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cobertura_necessaria"
                checked={data.cobertura_necessaria}
                onCheckedChange={(checked) => updateField("cobertura_necessaria", !!checked)}
              />
              <Label htmlFor="cobertura_necessaria" className="text-sm">
                Cobertura
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="iluminacao_basica"
                checked={data.iluminacao_basica}
                onCheckedChange={(checked) => updateField("iluminacao_basica", !!checked)}
              />
              <Label htmlFor="iluminacao_basica" className="text-sm">
                Iluminação Básica
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="camarim_necessario"
                checked={data.camarim_necessario}
                onCheckedChange={(checked) => updateField("camarim_necessario", !!checked)}
              />
              <Label htmlFor="camarim_necessario" className="text-sm">
                Camarim
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="estacionamento_necessario"
                checked={data.estacionamento_necessario}
                onCheckedChange={(checked) => updateField("estacionamento_necessario", !!checked)}
              />
              <Label htmlFor="estacionamento_necessario" className="text-sm">
                Estacionamento
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="seguranca_necessaria"
                checked={data.seguranca_necessaria}
                onCheckedChange={(checked) => updateField("seguranca_necessaria", !!checked)}
              />
              <Label htmlFor="seguranca_necessaria" className="text-sm">
                Segurança
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipamentos_especiais">Equipamentos Especiais</Label>
            <Textarea
              id="equipamentos_especiais"
              value={data.equipamentos_especiais}
              onChange={(e) => updateField("equipamentos_especiais", e.target.value)}
              placeholder="Descreva equipamentos especiais necessários..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
            <Textarea
              id="observacoes_gerais"
              value={data.observacoes_gerais}
              onChange={(e) => updateField("observacoes_gerais", e.target.value)}
              placeholder="Observações adicionais sobre o rider técnico..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}