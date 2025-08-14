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
          ativa: boolean | null
          created_at: string | null
          descricao: string | null
          genero: string | null
          id: string
          logo_url: string | null
          nome: string
          tenant_id: string
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          descricao?: string | null
          genero?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          tenant_id: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          descricao?: string | null
          genero?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          tenant_id?: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        ]
      }
      vw_proximos_eventos: {
        Row: {
          tenant_id: string | null
          total_proximos: number | null
          unidade_id: string | null
        }
        Relationships: []
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
        Args: {
          p_banda_id?: string
          p_descricao?: string
          p_inicio: string
          p_local?: string
          p_orcamento?: number
          p_tipo: string
          p_titulo: string
        }
        Returns: {
          banda_nome: string
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
