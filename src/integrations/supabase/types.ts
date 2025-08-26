export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      banda: {
        Row: {
          apple_music: string | null
          ativa: boolean | null
          bandcamp: string | null
          created_at: string | null
          descricao: string | null
          facebook: string | null
          genero: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nome: string
          soundcloud: string | null
          spotify: string | null
          tenant_id: string
          unidade_id: string | null
          updated_at: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          apple_music?: string | null
          ativa?: boolean | null
          bandcamp?: string | null
          created_at?: string | null
          descricao?: string | null
          facebook?: string | null
          genero?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome: string
          soundcloud?: string | null
          spotify?: string | null
          tenant_id: string
          unidade_id?: string | null
          updated_at?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          apple_music?: string | null
          ativa?: boolean | null
          bandcamp?: string | null
          created_at?: string | null
          descricao?: string | null
          facebook?: string | null
          genero?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome?: string
          soundcloud?: string | null
          spotify?: string | null
          tenant_id?: string
          unidade_id?: string | null
          updated_at?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_banda_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_integrante: {
        Row: {
          ativo: boolean | null
          banda_id: string
          created_at: string | null
          data_entrada: string
          data_saida: string | null
          email: string | null
          facebook: string | null
          funcao: string | null
          id: string
          instagram: string | null
          instrumento: string
          nome: string
          observacoes: string | null
          spotify: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string | null
          youtube: string | null
        }
        Insert: {
          ativo?: boolean | null
          banda_id: string
          created_at?: string | null
          data_entrada?: string
          data_saida?: string | null
          email?: string | null
          facebook?: string | null
          funcao?: string | null
          id?: string
          instagram?: string | null
          instrumento: string
          nome: string
          observacoes?: string | null
          spotify?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string | null
          youtube?: string | null
        }
        Update: {
          ativo?: boolean | null
          banda_id?: string
          created_at?: string | null
          data_entrada?: string
          data_saida?: string | null
          email?: string | null
          facebook?: string | null
          funcao?: string | null
          id?: string
          instagram?: string | null
          instrumento?: string
          nome?: string
          observacoes?: string | null
          spotify?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banda_integrante_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_integrante_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_integrante_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_integrante_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_mapa_palco: {
        Row: {
          banda_id: string
          created_at: string | null
          descricao: string | null
          id: string
          layout_json: Json | null
          nome: string
          observacoes: string | null
          posicao_amplificadores: string | null
          posicao_baixo: string | null
          posicao_bateria: string | null
          posicao_guitarra: string | null
          posicao_microfones: string | null
          posicao_monitores: string | null
          posicao_teclado: string | null
          posicao_vocal: string | null
          posicoes_outros: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          banda_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          layout_json?: Json | null
          nome?: string
          observacoes?: string | null
          posicao_amplificadores?: string | null
          posicao_baixo?: string | null
          posicao_bateria?: string | null
          posicao_guitarra?: string | null
          posicao_microfones?: string | null
          posicao_monitores?: string | null
          posicao_teclado?: string | null
          posicao_vocal?: string | null
          posicoes_outros?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          banda_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          layout_json?: Json | null
          nome?: string
          observacoes?: string | null
          posicao_amplificadores?: string | null
          posicao_baixo?: string | null
          posicao_bateria?: string | null
          posicao_guitarra?: string | null
          posicao_microfones?: string | null
          posicao_monitores?: string | null
          posicao_teclado?: string | null
          posicao_vocal?: string | null
          posicoes_outros?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banda_mapa_palco_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_mapa_palco_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_mapa_palco_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_mapa_palco_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_membro: {
        Row: {
          ativo: boolean | null
          banda_id: string | null
          created_at: string | null
          id: string
          instrumento: string | null
          papel: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          banda_id?: string | null
          created_at?: string | null
          id?: string
          instrumento?: string | null
          papel?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          banda_id?: string | null
          created_at?: string | null
          id?: string
          instrumento?: string | null
          papel?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banda_membro_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_membro_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_repertorio: {
        Row: {
          arquivo_audio_url: string | null
          artista_original: string | null
          ativo: boolean | null
          banda_id: string
          bpm: number | null
          cifra: string | null
          created_at: string | null
          dificuldade: string | null
          duracao_minutos: number | null
          genero: string | null
          id: string
          letra: string | null
          observacoes: string | null
          tenant_id: string
          tipo: string | null
          titulo: string
          tom: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_audio_url?: string | null
          artista_original?: string | null
          ativo?: boolean | null
          banda_id: string
          bpm?: number | null
          cifra?: string | null
          created_at?: string | null
          dificuldade?: string | null
          duracao_minutos?: number | null
          genero?: string | null
          id?: string
          letra?: string | null
          observacoes?: string | null
          tenant_id: string
          tipo?: string | null
          titulo: string
          tom?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_audio_url?: string | null
          artista_original?: string | null
          ativo?: boolean | null
          banda_id?: string
          bpm?: number | null
          cifra?: string | null
          created_at?: string | null
          dificuldade?: string | null
          duracao_minutos?: number | null
          genero?: string | null
          id?: string
          letra?: string | null
          observacoes?: string | null
          tenant_id?: string
          tipo?: string | null
          titulo?: string
          tom?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banda_repertorio_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_repertorio_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_repertorio_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_repertorio_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_rider_tecnico: {
        Row: {
          altura_palco_minima: string | null
          amplificadores: string | null
          banda_id: string
          camarim_necessario: boolean | null
          canais_mixer: number | null
          cobertura_necessaria: boolean | null
          created_at: string | null
          descricao: string | null
          direct_boxes: number | null
          equipamentos_especiais: string | null
          estacionamento_necessario: boolean | null
          extensoes_necessarias: boolean | null
          id: string
          iluminacao_basica: boolean | null
          iluminacao_especial: string | null
          instrumentos_fornecidos: string | null
          microfones_instrumento: number | null
          microfones_vocal: number | null
          monitores_palco: number | null
          nome: string
          observacoes_gerais: string | null
          seguranca_necessaria: boolean | null
          tamanho_palco_minimo: string | null
          tenant_id: string
          tomadas_110v: number | null
          tomadas_220v: number | null
          updated_at: string | null
        }
        Insert: {
          altura_palco_minima?: string | null
          amplificadores?: string | null
          banda_id: string
          camarim_necessario?: boolean | null
          canais_mixer?: number | null
          cobertura_necessaria?: boolean | null
          created_at?: string | null
          descricao?: string | null
          direct_boxes?: number | null
          equipamentos_especiais?: string | null
          estacionamento_necessario?: boolean | null
          extensoes_necessarias?: boolean | null
          id?: string
          iluminacao_basica?: boolean | null
          iluminacao_especial?: string | null
          instrumentos_fornecidos?: string | null
          microfones_instrumento?: number | null
          microfones_vocal?: number | null
          monitores_palco?: number | null
          nome?: string
          observacoes_gerais?: string | null
          seguranca_necessaria?: boolean | null
          tamanho_palco_minimo?: string | null
          tenant_id: string
          tomadas_110v?: number | null
          tomadas_220v?: number | null
          updated_at?: string | null
        }
        Update: {
          altura_palco_minima?: string | null
          amplificadores?: string | null
          banda_id?: string
          camarim_necessario?: boolean | null
          canais_mixer?: number | null
          cobertura_necessaria?: boolean | null
          created_at?: string | null
          descricao?: string | null
          direct_boxes?: number | null
          equipamentos_especiais?: string | null
          estacionamento_necessario?: boolean | null
          extensoes_necessarias?: boolean | null
          id?: string
          iluminacao_basica?: boolean | null
          iluminacao_especial?: string | null
          instrumentos_fornecidos?: string | null
          microfones_instrumento?: number | null
          microfones_vocal?: number | null
          monitores_palco?: number | null
          nome?: string
          observacoes_gerais?: string | null
          seguranca_necessaria?: boolean | null
          tamanho_palco_minimo?: string | null
          tenant_id?: string
          tomadas_110v?: number | null
          tomadas_220v?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banda_rider_tecnico_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_rider_tecnico_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_rider_tecnico_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banda_rider_tecnico_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_setlist: {
        Row: {
          ativo: boolean | null
          banda_id: string
          created_at: string | null
          data_criacao: string | null
          descricao: string | null
          duracao_total_minutos: number | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          banda_id: string
          created_at?: string | null
          data_criacao?: string | null
          descricao?: string | null
          duracao_total_minutos?: number | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          banda_id?: string
          created_at?: string | null
          data_criacao?: string | null
          descricao?: string | null
          duracao_total_minutos?: number | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banda_setlist_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_setlist_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      banda_setlist_musica: {
        Row: {
          created_at: string | null
          id: string
          observacoes: string | null
          ordem: number
          repertorio_id: string
          setlist_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          ordem: number
          repertorio_id: string
          setlist_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number
          repertorio_id?: string
          setlist_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banda_setlist_musica_repertorio_id_fkey"
            columns: ["repertorio_id"]
            isOneToOne: false
            referencedRelation: "banda_repertorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banda_setlist_musica_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "banda_setlist"
            referencedColumns: ["id"]
          },
        ]
      }
      evento: {
        Row: {
          banda_id: string | null
          created_at: string | null
          descricao: string | null
          endereco: string | null
          fim: string | null
          id: string
          inicio: string
          local: string | null
          orcamento: number | null
          sala_id: string | null
          status: string | null
          tenant_id: string
          tipo: string
          titulo: string
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          banda_id?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          fim?: string | null
          id?: string
          inicio: string
          local?: string | null
          orcamento?: number | null
          sala_id?: string | null
          status?: string | null
          tenant_id: string
          tipo?: string
          titulo: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          banda_id?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          local?: string | null
          orcamento?: number | null
          sala_id?: string | null
          status?: string | null
          tenant_id?: string
          tipo?: string
          titulo?: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_banda: {
        Row: {
          banda_id: string
          created_at: string
          evento_id: string
          id: string
        }
        Insert: {
          banda_id: string
          created_at?: string
          evento_id: string
          id?: string
        }
        Update: {
          banda_id?: string
          created_at?: string
          evento_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_evento_banda_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_banda_id"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_banda_id"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_evento"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_evento"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "vw_eventos_proximos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_evento"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "vw_eventos_todos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_evento_id"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_evento_id"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "vw_eventos_proximos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda_evento_id"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "vw_eventos_todos"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          created_at: string | null
          data_transacao: string | null
          descricao: string | null
          evento_id: string | null
          id: string
          tenant_id: string
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_transacao?: string | null
          descricao?: string | null
          evento_id?: string | null
          id?: string
          tenant_id: string
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data_transacao?: string | null
          descricao?: string | null
          evento_id?: string | null
          id?: string
          tenant_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "vw_eventos_proximos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "vw_eventos_todos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unidade: {
        Row: {
          created_at: string
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_alunos_participantes: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          nome: string | null
          tenant_id: string | null
          unidade_id: string | null
        }
        Relationships: []
      }
      vw_bandas_ativas: {
        Row: {
          tenant_id: string | null
          total_ativas: number | null
          unidade_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_banda_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_bandas_lista: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          descricao: string | null
          genero: string | null
          id: string | null
          logo_url: string | null
          membros_count: number | null
          nome: string | null
          tenant_id: string | null
          unidade_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_banda_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_eventos_proximos: {
        Row: {
          banda_id: string | null
          banda_nome: string | null
          created_at: string | null
          descricao: string | null
          endereco: string | null
          fim: string | null
          id: string | null
          inicio: string | null
          local: string | null
          orcamento: number | null
          sala_id: string | null
          status: string | null
          tenant_id: string | null
          tipo: string | null
          titulo: string | null
          unidade_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_eventos_todos: {
        Row: {
          banda_id: string | null
          banda_nome: string | null
          created_at: string | null
          descricao: string | null
          endereco: string | null
          fim: string | null
          id: string | null
          inicio: string | null
          local: string | null
          orcamento: number | null
          status: string | null
          tenant_id: string | null
          tipo: string | null
          titulo: string | null
          unidade_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "banda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_banda"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "vw_bandas_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evento_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_proximos_eventos: {
        Row: {
          tenant_id: string | null
          total_proximos: number | null
          unidade_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_evento_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_total_alunos: {
        Row: {
          tenant_id: string | null
          total_alunos: number | null
          unidade_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_banda: {
        Args: {
          p_descricao?: string
          p_genero?: string
          p_logo_url?: string
          p_nome: string
        }
        Returns: {
          descricao: string
          genero: string
          id: string
          logo_url: string
          members_count: number
          nome: string
        }[]
      }
      create_evento: {
        Args:
          | {
              p_banda_id?: string
              p_descricao?: string
              p_inicio: string
              p_local?: string
              p_orcamento?: number
              p_tipo: string
              p_titulo: string
            }
          | {
              p_banda_ids?: string[]
              p_descricao?: string
              p_endereco?: string
              p_inicio: string
              p_local?: string
              p_orcamento?: number
              p_tipo: string
              p_titulo: string
            }
        Returns: {
          banda_nomes: string[]
          endereco: string
          id: string
          inicio: string
          local: string
          orcamento: number
          tipo: string
          titulo: string
        }[]
      }
      get_alunos_participantes: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          email: string | null
          id: string | null
          nome: string | null
          tenant_id: string | null
          unidade_id: string | null
        }[]
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      event_status: "rascunho" | "confirmado" | "cancelado"
      event_type: "ensaio" | "aula" | "evento"
      person_type: "aluno" | "professor" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_status: ["rascunho", "confirmado", "cancelado"],
      event_type: ["ensaio", "aula", "evento"],
      person_type: ["aluno", "professor", "staff"],
    },
  },
} as const
