import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DynamicFormList } from "./DynamicFormList";

export interface BandMemberData {
  nome: string;
  instrumento: string;
  funcao: string;
  telefone: string;
  email: string;
  instagram: string;
  facebook: string;
  youtube: string;
  spotify: string;
  data_entrada: string;
  observacoes: string;
}

interface BandMembersFormProps {
  members: BandMemberData[];
  onChange: (members: BandMemberData[]) => void;
}

export function BandMembersForm({ members, onChange }: BandMembersFormProps) {
  const createEmptyMember = (): BandMemberData => ({
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
  });

  const addMember = () => {
    onChange([...members, createEmptyMember()]);
  };

  const removeMember = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, data: Partial<BandMemberData>) => {
    const updatedMembers = members.map((member, i) => 
      i === index ? { ...member, ...data } : member
    );
    onChange(updatedMembers);
  };

  const renderMemberForm = (member: BandMemberData, index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`nome-${index}`}>Nome *</Label>
          <Input
            id={`nome-${index}`}
            value={member.nome}
            onChange={(e) => updateMember(index, { nome: e.target.value })}
            placeholder="Nome completo"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`instrumento-${index}`}>Instrumento *</Label>
          <Input
            id={`instrumento-${index}`}
            value={member.instrumento}
            onChange={(e) => updateMember(index, { instrumento: e.target.value })}
            placeholder="Ex: Guitarra, Baixo, Bateria"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`funcao-${index}`}>Função</Label>
          <Input
            id={`funcao-${index}`}
            value={member.funcao}
            onChange={(e) => updateMember(index, { funcao: e.target.value })}
            placeholder="Ex: Líder, Backing Vocal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`telefone-${index}`}>Telefone</Label>
          <Input
            id={`telefone-${index}`}
            value={member.telefone}
            onChange={(e) => updateMember(index, { telefone: e.target.value })}
            placeholder="(21) 99999-9999"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`email-${index}`}>Email</Label>
          <Input
            id={`email-${index}`}
            type="email"
            value={member.email}
            onChange={(e) => updateMember(index, { email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`data_entrada-${index}`}>Data de Entrada *</Label>
          <Input
            id={`data_entrada-${index}`}
            type="date"
            value={member.data_entrada}
            onChange={(e) => updateMember(index, { data_entrada: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`instagram-${index}`}>Instagram</Label>
          <Input
            id={`instagram-${index}`}
            value={member.instagram}
            onChange={(e) => updateMember(index, { instagram: e.target.value })}
            placeholder="@usuario"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`facebook-${index}`}>Facebook</Label>
          <Input
            id={`facebook-${index}`}
            value={member.facebook}
            onChange={(e) => updateMember(index, { facebook: e.target.value })}
            placeholder="facebook.com/usuario"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`youtube-${index}`}>YouTube</Label>
          <Input
            id={`youtube-${index}`}
            value={member.youtube}
            onChange={(e) => updateMember(index, { youtube: e.target.value })}
            placeholder="youtube.com/@usuario"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`spotify-${index}`}>Spotify</Label>
          <Input
            id={`spotify-${index}`}
            value={member.spotify}
            onChange={(e) => updateMember(index, { spotify: e.target.value })}
            placeholder="open.spotify.com/artist/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`observacoes-${index}`}>Observações</Label>
        <Textarea
          id={`observacoes-${index}`}
          value={member.observacoes}
          onChange={(e) => updateMember(index, { observacoes: e.target.value })}
          placeholder="Informações adicionais sobre o integrante..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <DynamicFormList
      title="Integrante"
      items={members}
      renderForm={renderMemberForm}
      onAddItem={addMember}
      onRemoveItem={removeMember}
      createEmptyItem={createEmptyMember}
      minItems={1}
      addButtonText="Adicionar Integrante"
    />
  );
}