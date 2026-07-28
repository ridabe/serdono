/**
 * Tipos do schema Supabase — SPEC.md §4.4: gerados a partir do banco com
 * `supabase gen types typescript`, nunca escritos à mão em produção.
 *
 * Esta versão foi escrita manualmente porque este ambiente não tem acesso
 * direto ao projeto Supabase (klvmbytlqnvydjsauigy) para rodar o CLI —
 * espelha exatamente `supabase/migrations/202607281300_diagnostico_e_nichos.sql`.
 * Assim que as migrations forem aplicadas, regerar com:
 *   supabase gen types typescript --project-id klvmbytlqnvydjsauigy > packages/supabase/types.ts
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          telefone: string | null;
          cidade: string | null;
          estado: string | null;
          criado_via: "organico" | "pago" | "indicacao" | "institucional";
          onboarding_status: "cadastrado" | "diagnostico_concluido" | "assinante" | "negocio_aberto";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      diagnostic_responses: {
        Row: {
          id: string;
          user_id: string;
          schema_version: number;
          capital_disponivel: "ate_5k" | "5k_15k" | "15k_40k" | "mais_40k" | null;
          meses_de_folego: number | null;
          apetite_risco: number | null;
          tempo_disponivel: "integral" | "parcial" | "paralelo_emprego" | null;
          formacao: string[];
          experiencia: string[];
          estilo_vida: Record<string, unknown>;
          localizacao_cidade: string | null;
          localizacao_estado: string | null;
          rede_ativos: string[];
          objetivo: "renda_extra" | "substituir_salario" | "escalar" | null;
          status_preenchimento: "em_andamento" | "concluido";
          respondido_em: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["diagnostic_responses"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["diagnostic_responses"]["Row"]>;
        Relationships: [];
      };
      niches: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          categoria: string;
          investimento_min: number;
          investimento_max: number;
          tempo_ate_equilibrio_meses: number | null;
          complexidade_regulatoria: number;
          sazonalidade: Record<string, unknown>;
          margem_tipica_pct: number | null;
          intensidade_mao_de_obra: number;
          dependencia_ponto_fisico: boolean;
          nivel_concorrencia: number;
          perfil_cliente: string | null;
          playbook_md: string | null;
          fonte: string | null;
          fonte_data: string | null;
          ativo_no_mvp: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["niches"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["niches"]["Row"]>;
        Relationships: [];
      };
      niche_matches: {
        Row: {
          id: string;
          user_id: string;
          niche_id: string;
          fit_score: number;
          score_perfil: number;
          score_financeiro: number;
          score_contexto: number;
          score_tempo: number;
          justificativa_ia: string | null;
          gerado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["niche_matches"]["Row"]> & {
          user_id: string;
          niche_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["niche_matches"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "niche_matches_niche_id_fkey";
            columns: ["niche_id"];
            isOneToOne: false;
            referencedRelation: "niches";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
