/**
 * Tipos do schema Supabase — SPEC.md §4.4: gerados a partir do banco real via
 * `mcp__supabase__generate_typescript_types` (equivalente a
 * `supabase gen types typescript --project-id klvmbytlqnvydjsauigy`).
 * Nunca editar à mão — regerar sempre que uma migration alterar o schema.
 */

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_versions: {
        Row: {
          created_at: string
          current_version: string
          current_version_code: number
          force_update: boolean
          min_version_code: number
          platform: string
          release_notes: string | null
          store_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_version: string
          current_version_code: number
          force_update?: boolean
          min_version_code: number
          platform: string
          release_notes?: string | null
          store_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_version?: string
          current_version_code?: number
          force_update?: boolean
          min_version_code?: number
          platform?: string
          release_notes?: string | null
          store_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diagnostic_responses: {
        Row: {
          apetite_risco: number | null
          capital_disponivel: string | null
          created_at: string
          estilo_vida: Json
          experiencia: string[]
          formacao: string[]
          id: string
          localizacao_cidade: string | null
          localizacao_estado: string | null
          meses_de_folego: number | null
          objetivo: string | null
          rede_ativos: string[]
          respondido_em: string | null
          schema_version: number
          status_preenchimento: string
          tempo_disponivel: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apetite_risco?: number | null
          capital_disponivel?: string | null
          created_at?: string
          estilo_vida?: Json
          experiencia?: string[]
          formacao?: string[]
          id?: string
          localizacao_cidade?: string | null
          localizacao_estado?: string | null
          meses_de_folego?: number | null
          objetivo?: string | null
          rede_ativos?: string[]
          respondido_em?: string | null
          schema_version?: number
          status_preenchimento?: string
          tempo_disponivel?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apetite_risco?: number | null
          capital_disponivel?: string | null
          created_at?: string
          estilo_vida?: Json
          experiencia?: string[]
          formacao?: string[]
          id?: string
          localizacao_cidade?: string | null
          localizacao_estado?: string | null
          meses_de_folego?: number | null
          objetivo?: string | null
          rede_ativos?: string[]
          respondido_em?: string | null
          schema_version?: number
          status_preenchimento?: string
          tempo_disponivel?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jornada_deliverables: {
        Row: {
          conteudo: Json
          gerado_em: string
          gerado_por: string
          id: string
          jornada_instance_id: string
          tipo: string
          versao: number
        }
        Insert: {
          conteudo: Json
          gerado_em?: string
          gerado_por?: string
          id?: string
          jornada_instance_id: string
          tipo: string
          versao?: number
        }
        Update: {
          conteudo?: Json
          gerado_em?: string
          gerado_por?: string
          id?: string
          jornada_instance_id?: string
          tipo?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "jornada_deliverables_jornada_instance_id_fkey"
            columns: ["jornada_instance_id"]
            isOneToOne: false
            referencedRelation: "jornada_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      jornada_instances: {
        Row: {
          concorrentes: string | null
          created_at: string
          diferenciais: string | null
          fase_atual: string
          id: string
          niche_id: string | null
          nome_negocio: string | null
          publico_alvo: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concorrentes?: string | null
          created_at?: string
          diferenciais?: string | null
          fase_atual?: string
          id?: string
          niche_id?: string | null
          nome_negocio?: string | null
          publico_alvo?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concorrentes?: string | null
          created_at?: string
          diferenciais?: string | null
          fase_atual?: string
          id?: string
          niche_id?: string | null
          nome_negocio?: string | null
          publico_alvo?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornada_instances_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          ativo: boolean
          category_id: string
          conteudo: string
          created_at: string
          fonte: string
          fonte_data: string
          fonte_url: string | null
          id: string
          resumo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          category_id: string
          conteudo: string
          created_at?: string
          fonte: string
          fonte_data: string
          fonte_url?: string | null
          id?: string
          resumo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          category_id?: string
          conteudo?: string
          created_at?: string
          fonte?: string
          fonte_data?: string
          fonte_url?: string | null
          id?: string
          resumo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          article_id: string
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
        }
        Insert: {
          article_id: string
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Update: {
          article_id?: string
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      niche_matches: {
        Row: {
          fit_score: number
          gerado_em: string
          id: string
          justificativa_ia: string | null
          niche_id: string
          score_contexto: number
          score_financeiro: number
          score_perfil: number
          score_tempo: number
          user_id: string
        }
        Insert: {
          fit_score: number
          gerado_em?: string
          id?: string
          justificativa_ia?: string | null
          niche_id: string
          score_contexto: number
          score_financeiro: number
          score_perfil: number
          score_tempo: number
          user_id: string
        }
        Update: {
          fit_score?: number
          gerado_em?: string
          id?: string
          justificativa_ia?: string | null
          niche_id?: string
          score_contexto?: number
          score_financeiro?: number
          score_perfil?: number
          score_tempo?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_matches_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          ativo_no_mvp: boolean
          categoria: string
          complexidade_regulatoria: number
          created_at: string
          dependencia_ponto_fisico: boolean
          fonte: string | null
          fonte_data: string | null
          id: string
          intensidade_mao_de_obra: number
          investimento_max: number
          investimento_min: number
          margem_tipica_pct: number | null
          nivel_concorrencia: number
          nome: string
          perfil_cliente: string | null
          playbook_md: string | null
          sazonalidade: Json
          slug: string
          tempo_ate_equilibrio_meses: number | null
          updated_at: string
        }
        Insert: {
          ativo_no_mvp?: boolean
          categoria: string
          complexidade_regulatoria: number
          created_at?: string
          dependencia_ponto_fisico?: boolean
          fonte?: string | null
          fonte_data?: string | null
          id?: string
          intensidade_mao_de_obra: number
          investimento_max: number
          investimento_min: number
          margem_tipica_pct?: number | null
          nivel_concorrencia: number
          nome: string
          perfil_cliente?: string | null
          playbook_md?: string | null
          sazonalidade?: Json
          slug: string
          tempo_ate_equilibrio_meses?: number | null
          updated_at?: string
        }
        Update: {
          ativo_no_mvp?: boolean
          categoria?: string
          complexidade_regulatoria?: number
          created_at?: string
          dependencia_ponto_fisico?: boolean
          fonte?: string | null
          fonte_data?: string | null
          id?: string
          intensidade_mao_de_obra?: number
          investimento_max?: number
          investimento_min?: number
          margem_tipica_pct?: number | null
          nivel_concorrencia?: number
          nome?: string
          perfil_cliente?: string | null
          playbook_md?: string | null
          sazonalidade?: Json
          slug?: string
          tempo_ate_equilibrio_meses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          habilitado: boolean
          habilitado_em: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          habilitado?: boolean
          habilitado_em?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          habilitado?: boolean
          habilitado_em?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bloqueado: boolean
          cidade: string | null
          created_at: string
          criado_via: string
          email: string | null
          estado: string | null
          id: string
          nome: string | null
          onboarding_status: string
          role: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bloqueado?: boolean
          cidade?: string | null
          created_at?: string
          criado_via?: string
          email?: string | null
          estado?: string | null
          id: string
          nome?: string | null
          onboarding_status?: string
          role?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bloqueado?: boolean
          cidade?: string | null
          created_at?: string
          criado_via?: string
          email?: string | null
          estado?: string | null
          id?: string
          nome?: string | null
          onboarding_status?: string
          role?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      match_knowledge_chunks: {
        Args: {
          filter_category_slug?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          article_id: string
          article_resumo: string
          article_titulo: string
          category_slug: string
          chunk_id: string
          content: string
          fonte: string
          fonte_data: string
          fonte_url: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
