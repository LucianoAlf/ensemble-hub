export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      [_ in never]: never
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
          id: string | null
          nome: string | null
          tenant_id: string | null
          unidade_id: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          id?: string | null
          nome?: string | null
          tenant_id?: string | null
          unidade_id?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          id?: string | null
          nome?: string | null
          tenant_id?: string | null
          unidade_id?: string | null
        }
        Relationships: []
      }
      vw_eventos_proximos: {
        Row: {
          banda_id: string | null
          created_at: string | null
          fim: string | null
          id: string | null
          inicio: string | null
          sala_id: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          tenant_id: string | null
          tipo: Database["public"]["Enums"]["event_type"] | null
          titulo: string | null
          unidade_id: string | null
        }
        Insert: {
          banda_id?: string | null
          created_at?: string | null
          fim?: string | null
          id?: string | null
          inicio?: string | null
          sala_id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["event_type"] | null
          titulo?: string | null
          unidade_id?: string | null
        }
        Update: {
          banda_id?: string | null
          created_at?: string | null
          fim?: string | null
          id?: string | null
          inicio?: string | null
          sala_id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["event_type"] | null
          titulo?: string | null
          unidade_id?: string | null
        }
        Relationships: [
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
      [_ in never]: never
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
