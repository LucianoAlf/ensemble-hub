import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicFormList } from "./DynamicFormList";

export interface RepertoireSongData {
  titulo: string;
  artista_original: string;
  genero: string;
  duracao_minutos: number | null;
  tom: string;
  bpm: number | null;
  tipo: string;
  dificuldade: string;
  observacoes: string;
  letra: string;
  cifra: string;
}

interface RepertoireFormProps {
  songs: RepertoireSongData[];
  onChange: (songs: RepertoireSongData[]) => void;
}

export function RepertoireForm({ songs, onChange }: RepertoireFormProps) {
  const createEmptySong = (): RepertoireSongData => ({
    titulo: "",
    artista_original: "",
    genero: "",
    duracao_minutos: null,
    tom: "",
    bpm: null,
    tipo: "cover",
    dificuldade: "medio",
    observacoes: "",
    letra: "",
    cifra: ""
  });

  const addSong = () => {
    onChange([...songs, createEmptySong()]);
  };

  const removeSong = (index: number) => {
    onChange(songs.filter((_, i) => i !== index));
  };

  const updateSong = (index: number, data: Partial<RepertoireSongData>) => {
    const updatedSongs = songs.map((song, i) => 
      i === index ? { ...song, ...data } : song
    );
    onChange(updatedSongs);
  };

  const renderSongForm = (song: RepertoireSongData, index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`titulo-${index}`}>Título *</Label>
          <Input
            id={`titulo-${index}`}
            value={song.titulo}
            onChange={(e) => updateSong(index, { titulo: e.target.value })}
            placeholder="Nome da música"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`artista_original-${index}`}>Artista Original</Label>
          <Input
            id={`artista_original-${index}`}
            value={song.artista_original}
            onChange={(e) => updateSong(index, { artista_original: e.target.value })}
            placeholder="Nome do artista/banda original"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`genero-${index}`}>Gênero</Label>
          <Input
            id={`genero-${index}`}
            value={song.genero}
            onChange={(e) => updateSong(index, { genero: e.target.value })}
            placeholder="Rock, Pop, etc."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`duracao-${index}`}>Duração (min)</Label>
          <Input
            id={`duracao-${index}`}
            type="number"
            min="1"
            max="30"
            value={song.duracao_minutos || ""}
            onChange={(e) => updateSong(index, { duracao_minutos: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="4"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`tom-${index}`}>Tom</Label>
          <Input
            id={`tom-${index}`}
            value={song.tom}
            onChange={(e) => updateSong(index, { tom: e.target.value })}
            placeholder="C, Dm, G7"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`bpm-${index}`}>BPM</Label>
          <Input
            id={`bpm-${index}`}
            type="number"
            min="30"
            max="300"
            value={song.bpm || ""}
            onChange={(e) => updateSong(index, { bpm: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="120"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`tipo-${index}`}>Tipo</Label>
          <Select value={song.tipo} onValueChange={(value) => updateSong(index, { tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="versao">Versão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`dificuldade-${index}`}>Dificuldade</Label>
          <Select value={song.dificuldade} onValueChange={(value) => updateSong(index, { dificuldade: value })}>
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
        <Label htmlFor={`observacoes-${index}`}>Observações</Label>
        <Textarea
          id={`observacoes-${index}`}
          value={song.observacoes}
          onChange={(e) => updateSong(index, { observacoes: e.target.value })}
          placeholder="Notas sobre arranjos, mudanças, etc."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`letra-${index}`}>Letra</Label>
          <Textarea
            id={`letra-${index}`}
            value={song.letra}
            onChange={(e) => updateSong(index, { letra: e.target.value })}
            placeholder="Letra completa da música..."
            rows={6}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`cifra-${index}`}>Cifra</Label>
          <Textarea
            id={`cifra-${index}`}
            value={song.cifra}
            onChange={(e) => updateSong(index, { cifra: e.target.value })}
            placeholder="Cifras e acordes..."
            rows={6}
          />
        </div>
      </div>
    </div>
  );

  return (
    <DynamicFormList
      title="Música"
      items={songs}
      renderForm={renderSongForm}
      onAddItem={addSong}
      onRemoveItem={removeSong}
      createEmptyItem={createEmptySong}
      minItems={0}
      addButtonText="Adicionar Música"
    />
  );
}