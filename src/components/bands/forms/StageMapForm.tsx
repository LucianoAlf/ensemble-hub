import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface StageMapData {
  nome: string;
  descricao: string;
  posicao_vocal: string;
  posicao_guitarra: string;
  posicao_baixo: string;
  posicao_bateria: string;
  posicao_teclado: string;
  posicao_amplificadores: string;
  posicao_monitores: string;
  posicao_microfones: string;
  posicoes_outros: string;
  observacoes: string;
}

interface StageMapFormProps {
  data: StageMapData;
  onChange: (data: StageMapData) => void;
}

export function StageMapForm({ data, onChange }: StageMapFormProps) {
  const updateField = (field: keyof StageMapData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Mapa</CardTitle>
          <CardDescription>Dados básicos do layout de palco</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Mapa</Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              placeholder="Ex: Layout Padrão Rock Prisma"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={data.descricao}
              onChange={(e) => updateField("descricao", e.target.value)}
              placeholder="Descrição geral do layout de palco..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posicionamento dos Instrumentos</CardTitle>
          <CardDescription>Localização de cada instrumento no palco</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="posicao_vocal">Posição Vocal</Label>
              <Input
                id="posicao_vocal"
                value={data.posicao_vocal}
                onChange={(e) => updateField("posicao_vocal", e.target.value)}
                placeholder="Ex: Centro-frente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="posicao_guitarra">Posição Guitarra</Label>
              <Input
                id="posicao_guitarra"
                value={data.posicao_guitarra}
                onChange={(e) => updateField("posicao_guitarra", e.target.value)}
                placeholder="Ex: Direita do palco"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="posicao_baixo">Posição Baixo</Label>
              <Input
                id="posicao_baixo"
                value={data.posicao_baixo}
                onChange={(e) => updateField("posicao_baixo", e.target.value)}
                placeholder="Ex: Esquerda do palco"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="posicao_bateria">Posição Bateria</Label>
              <Input
                id="posicao_bateria"
                value={data.posicao_bateria}
                onChange={(e) => updateField("posicao_bateria", e.target.value)}
                placeholder="Ex: Fundo-centro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="posicao_teclado">Posição Teclado</Label>
              <Input
                id="posicao_teclado"
                value={data.posicao_teclado}
                onChange={(e) => updateField("posicao_teclado", e.target.value)}
                placeholder="Ex: Lado direito"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="posicoes_outros">Outros Instrumentos</Label>
              <Input
                id="posicoes_outros"
                value={data.posicoes_outros}
                onChange={(e) => updateField("posicoes_outros", e.target.value)}
                placeholder="Ex: Percussão, saxophone"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipamentos e Acessórios</CardTitle>
          <CardDescription>Posicionamento de amplificadores, monitores e microfones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="posicao_amplificadores">Posição dos Amplificadores</Label>
            <Textarea
              id="posicao_amplificadores"
              value={data.posicao_amplificadores}
              onChange={(e) => updateField("posicao_amplificadores", e.target.value)}
              placeholder="Descreva onde ficam os amplificadores de guitarra, baixo, etc..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="posicao_monitores">Posição dos Monitores</Label>
            <Textarea
              id="posicao_monitores"
              value={data.posicao_monitores}
              onChange={(e) => updateField("posicao_monitores", e.target.value)}
              placeholder="Descreva o posicionamento dos monitores de palco..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="posicao_microfones">Posição dos Microfones</Label>
            <Textarea
              id="posicao_microfones"
              value={data.posicao_microfones}
              onChange={(e) => updateField("posicao_microfones", e.target.value)}
              placeholder="Descreva onde ficam os microfones (vocal, bateria, etc.)..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações do Layout</CardTitle>
          <CardDescription>Informações adicionais sobre o mapa de palco</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={data.observacoes}
              onChange={(e) => updateField("observacoes", e.target.value)}
              placeholder="Observações importantes sobre o layout, configurações especiais, etc..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}