import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface BandInfoData {
  nome: string;
  genero: string;
  descricao: string;
  unidade_id: string;
  instagram: string;
  facebook: string;
  youtube: string;
  spotify: string;
  apple_music: string;
  soundcloud: string;
  bandcamp: string;
  website: string;
}

interface BandInfoFormProps {
  data: BandInfoData;
  onChange: (data: BandInfoData) => void;
  unidades: Array<{ id: string; nome: string }>;
}

export function BandInfoForm({ data, onChange, unidades }: BandInfoFormProps) {
  const updateField = (field: keyof BandInfoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados principais da banda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Banda *</Label>
              <Input
                id="nome"
                value={data.nome}
                onChange={(e) => updateField("nome", e.target.value)}
                placeholder="Ex: Rock Prisma"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade *</Label>
              <Select value={data.unidade_id} onValueChange={(value) => updateField("unidade_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genero">Gênero Musical</Label>
            <Input
              id="genero"
              value={data.genero}
              onChange={(e) => updateField("genero", e.target.value)}
              placeholder="Ex: Rock, Pop, Jazz, MPB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={data.descricao}
              onChange={(e) => updateField("descricao", e.target.value)}
              placeholder="Descrição da banda, estilo musical, história..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais e Links</CardTitle>
          <CardDescription>Links para perfis e plataformas musicais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={data.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                placeholder="@bandaexemplo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={data.facebook}
                onChange={(e) => updateField("facebook", e.target.value)}
                placeholder="facebook.com/bandaexemplo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={data.youtube}
                onChange={(e) => updateField("youtube", e.target.value)}
                placeholder="youtube.com/@bandaexemplo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spotify">Spotify</Label>
              <Input
                id="spotify"
                value={data.spotify}
                onChange={(e) => updateField("spotify", e.target.value)}
                placeholder="open.spotify.com/artist/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apple_music">Apple Music</Label>
              <Input
                id="apple_music"
                value={data.apple_music}
                onChange={(e) => updateField("apple_music", e.target.value)}
                placeholder="music.apple.com/artist/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="soundcloud">SoundCloud</Label>
              <Input
                id="soundcloud"
                value={data.soundcloud}
                onChange={(e) => updateField("soundcloud", e.target.value)}
                placeholder="soundcloud.com/bandaexemplo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bandcamp">Bandcamp</Label>
              <Input
                id="bandcamp"
                value={data.bandcamp}
                onChange={(e) => updateField("bandcamp", e.target.value)}
                placeholder="bandaexemplo.bandcamp.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={data.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="www.bandaexemplo.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}