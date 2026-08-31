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
      checkups_mensais: {
        Row: {
          created_at: string
          gerado_em: string
          id: string
          mes_referencia: string
          respostas: Json
          saude: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          gerado_em?: string
          id?: string
          mes_referencia: string
          respostas: Json
          saude: Json
          user_id: string
        }
        Update: {
          created_at?: string
          gerado_em?: string
          id?: string
          mes_referencia?: string
          respostas?: Json
          saude?: Json
          user_id?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          campos: Json
          created_at: string
          enviado_em: string | null
          enviado_para: string | null
          gerado_em: string
          id: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          campos: Json
          created_at?: string
          enviado_em?: string | null
          enviado_para?: string | null
          gerado_em?: string
          id?: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          campos?: Json
          created_at?: string
          enviado_em?: string | null
          enviado_para?: string | null
          gerado_em?: string
          id?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      cotacoes_snapshots: {
        Row: {
          capturado_em: string
          dados: Json
          fonte: string
          id: string
        }
        Insert: {
          capturado_em?: string
          dados: Json
          fonte?: string
          id?: string
        }
        Update: {
          capturado_em?: string
          dados?: Json
          fonte?: string
          id?: string
        }
        Relationships: []
      }
      diagnostic_responses: {
        Row: {
          apetite_risco: number | null
          areas_inferidas: string[]
          capital_disponivel: string | null
          created_at: string
          estilo_vida: Json
          experiencia: string[]
          formacao: string[]
          id: string
          interesses_texto: string | null
          localizacao_cidade: string | null
          localizacao_estado: string | null
          meses_de_folego: number | null
          nichos_inferidos: string[]
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
          areas_inferidas?: string[]
          capital_disponivel?: string | null
          created_at?: string
          estilo_vida?: Json
          experiencia?: string[]
          formacao?: string[]
          id?: string
          interesses_texto?: string | null
          localizacao_cidade?: string | null
          localizacao_estado?: string | null
          meses_de_folego?: number | null
          nichos_inferidos?: string[]
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
          areas_inferidas?: string[]
          capital_disponivel?: string | null
          created_at?: string
          estilo_vida?: Json
          experiencia?: string[]
          formacao?: string[]
          id?: string
          interesses_texto?: string | null
          localizacao_cidade?: string | null
          localizacao_estado?: string | null
          meses_de_folego?: number | null
          nichos_inferidos?: string[]
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
      dicas_acessos: {
        Row: {
          created_at: string
          id: string
          material_id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dicas_acessos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "dicas_materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      dicas_categorias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          id: string
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao: string
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      dicas_materiais: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          ativo: boolean
          categoria_id: string
          created_at: string
          descricao: string | null
          id: string
          link_externo_label: string | null
          link_externo_url: string | null
          nivel: string | null
          ordem: number
          titulo: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          ativo?: boolean
          categoria_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          link_externo_label?: string | null
          link_externo_url?: string | null
          nivel?: string | null
          ordem?: number
          titulo: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          link_externo_label?: string | null
          link_externo_url?: string | null
          nivel?: string | null
          ordem?: number
          titulo?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dicas_materiais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "dicas_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores_parceiros: {
        Row: {
          ativo: boolean
          categoria: string
          contato: string | null
          created_at: string
          descricao: string | null
          embedding: string | null
          id: string
          indicado_desenvolvimento: boolean
          logo_url: string | null
          niches_aplicaveis: string[]
          nome: string
          regiao: string | null
          site: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          contato?: string | null
          created_at?: string
          descricao?: string | null
          embedding?: string | null
          id?: string
          indicado_desenvolvimento?: boolean
          logo_url?: string | null
          niches_aplicaveis?: string[]
          nome: string
          regiao?: string | null
          site?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          contato?: string | null
          created_at?: string
          descricao?: string | null
          embedding?: string | null
          id?: string
          indicado_desenvolvimento?: boolean
          logo_url?: string | null
          niches_aplicaveis?: string[]
          nome?: string
          regiao?: string | null
          site?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ia_usage_logs: {
        Row: {
          created_at: string
          funcao: string
          id: string
          input_tokens: number | null
          modelo: string
          output_tokens: number | null
          provider: string
          total_tokens: number | null
          unidades: number
          user_id: string
        }
        Insert: {
          created_at?: string
          funcao: string
          id?: string
          input_tokens?: number | null
          modelo: string
          output_tokens?: number | null
          provider: string
          total_tokens?: number | null
          unidades?: number
          user_id: string
        }
        Update: {
          created_at?: string
          funcao?: string
          id?: string
          input_tokens?: number | null
          modelo?: string
          output_tokens?: number | null
          provider?: string
          total_tokens?: number | null
          unidades?: number
          user_id?: string
        }
        Relationships: []
      }
      jornada_clientes_contatos: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          jornada_instance_id: string
          nome: string
          notas: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          jornada_instance_id: string
          nome: string
          notas?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          jornada_instance_id?: string
          nome?: string
          notas?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornada_clientes_contatos_jornada_instance_id_fkey"
            columns: ["jornada_instance_id"]
            isOneToOne: false
            referencedRelation: "jornada_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      jornada_conclusao_config: {
        Row: {
          atualizado_em: string
          id: string
          video_url: string | null
        }
        Insert: {
          atualizado_em?: string
          id?: string
          video_url?: string | null
        }
        Update: {
          atualizado_em?: string
          id?: string
          video_url?: string | null
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
      jornada_etapa_templates: {
        Row: {
          aplica_se: string | null
          created_at: string
          depende_de: string[]
          descricao: string | null
          dica: string | null
          dispensavel_categorias: string[]
          dispensavel_sem_ponto_fisico: boolean
          documentos: Json
          fase: string
          id: string
          ordem: number
          prazo: string | null
          slug: string
          tipo_conclusao: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aplica_se?: string | null
          created_at?: string
          depende_de?: string[]
          descricao?: string | null
          dica?: string | null
          dispensavel_categorias?: string[]
          dispensavel_sem_ponto_fisico?: boolean
          documentos?: Json
          fase: string
          id?: string
          ordem: number
          prazo?: string | null
          slug: string
          tipo_conclusao: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aplica_se?: string | null
          created_at?: string
          depende_de?: string[]
          descricao?: string | null
          dica?: string | null
          dispensavel_categorias?: string[]
          dispensavel_sem_ponto_fisico?: boolean
          documentos?: Json
          fase?: string
          id?: string
          ordem?: number
          prazo?: string | null
          slug?: string
          tipo_conclusao?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      jornada_etapas: {
        Row: {
          concluido_em: string | null
          created_at: string
          dados_usuario: Json
          etapa_template_id: string
          id: string
          jornada_instance_id: string
          status: string
          updated_at: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          dados_usuario?: Json
          etapa_template_id: string
          id?: string
          jornada_instance_id: string
          status: string
          updated_at?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          dados_usuario?: Json
          etapa_template_id?: string
          id?: string
          jornada_instance_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornada_etapas_etapa_template_id_fkey"
            columns: ["etapa_template_id"]
            isOneToOne: false
            referencedRelation: "jornada_etapa_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jornada_etapas_jornada_instance_id_fkey"
            columns: ["jornada_instance_id"]
            isOneToOne: false
            referencedRelation: "jornada_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      jornada_fornecedores: {
        Row: {
          avaliacao: string | null
          categoria: string
          contato: string | null
          created_at: string
          id: string
          jornada_instance_id: string
          nome_fornecedor: string
          origem: string
          parceiro_id: string | null
          prazo: string | null
          preco: string | null
          updated_at: string
        }
        Insert: {
          avaliacao?: string | null
          categoria: string
          contato?: string | null
          created_at?: string
          id?: string
          jornada_instance_id: string
          nome_fornecedor: string
          origem?: string
          parceiro_id?: string | null
          prazo?: string | null
          preco?: string | null
          updated_at?: string
        }
        Update: {
          avaliacao?: string | null
          categoria?: string
          contato?: string | null
          created_at?: string
          id?: string
          jornada_instance_id?: string
          nome_fornecedor?: string
          origem?: string
          parceiro_id?: string | null
          prazo?: string | null
          preco?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornada_fornecedores_jornada_instance_id_fkey"
            columns: ["jornada_instance_id"]
            isOneToOne: false
            referencedRelation: "jornada_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jornada_fornecedores_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "fornecedores_parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      jornada_instances: {
        Row: {
          cnpj: string | null
          concorrentes: string | null
          created_at: string
          diferenciais: string | null
          fase_atual: string
          id: string
          logo_path: string | null
          niche_id: string | null
          nicho_personalizado: string | null
          nome_empresa_escolhido: string | null
          nome_negocio: string | null
          origem_intake: string
          publico_alvo: string | null
          regime_formalizacao: string | null
          slogan_escolhido: string | null
          status: string
          sub_negocio_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          concorrentes?: string | null
          created_at?: string
          diferenciais?: string | null
          fase_atual?: string
          id?: string
          logo_path?: string | null
          niche_id?: string | null
          nicho_personalizado?: string | null
          nome_empresa_escolhido?: string | null
          nome_negocio?: string | null
          origem_intake?: string
          publico_alvo?: string | null
          regime_formalizacao?: string | null
          slogan_escolhido?: string | null
          status?: string
          sub_negocio_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          concorrentes?: string | null
          created_at?: string
          diferenciais?: string | null
          fase_atual?: string
          id?: string
          logo_path?: string | null
          niche_id?: string | null
          nicho_personalizado?: string | null
          nome_empresa_escolhido?: string | null
          nome_negocio?: string | null
          origem_intake?: string
          publico_alvo?: string | null
          regime_formalizacao?: string | null
          slogan_escolhido?: string | null
          status?: string
          sub_negocio_id?: string | null
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
          {
            foreignKeyName: "jornada_instances_sub_negocio_id_fkey"
            columns: ["sub_negocio_id"]
            isOneToOne: false
            referencedRelation: "niche_sub_negocios"
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
      lembretes_enviados: {
        Row: {
          chave: string
          enviado_em: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          chave: string
          enviado_em?: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          chave?: string
          enviado_em?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      maturidade_snapshots: {
        Row: {
          categorias: Json
          created_at: string
          gerado_em: string
          id: string
          mes_referencia: string
          nivel: string
          pontuacao_total: number
          user_id: string
        }
        Insert: {
          categorias: Json
          created_at?: string
          gerado_em?: string
          id?: string
          mes_referencia: string
          nivel: string
          pontuacao_total: number
          user_id: string
        }
        Update: {
          categorias?: Json
          created_at?: string
          gerado_em?: string
          id?: string
          mes_referencia?: string
          nivel?: string
          pontuacao_total?: number
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          anuncio_grupo: string | null
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          plano_minimo: string
          slug: string
          updated_at: string
        }
        Insert: {
          anuncio_grupo?: string | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          plano_minimo?: string
          slug: string
          updated_at?: string
        }
        Update: {
          anuncio_grupo?: string | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          plano_minimo?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      niche_matches: {
        Row: {
          afinidade_direta: boolean
          fit_score: number
          gerado_em: string
          id: string
          justificativa_ia: string | null
          niche_id: string
          ordem: number
          precisa_de_mais_capital: boolean
          score_contexto: number
          score_financeiro: number
          score_perfil: number
          score_tempo: number
          sub_negocios_destaque: Json
          user_id: string
        }
        Insert: {
          afinidade_direta?: boolean
          fit_score: number
          gerado_em?: string
          id?: string
          justificativa_ia?: string | null
          niche_id: string
          ordem?: number
          precisa_de_mais_capital?: boolean
          score_contexto: number
          score_financeiro: number
          score_perfil: number
          score_tempo: number
          sub_negocios_destaque?: Json
          user_id: string
        }
        Update: {
          afinidade_direta?: boolean
          fit_score?: number
          gerado_em?: string
          id?: string
          justificativa_ia?: string | null
          niche_id?: string
          ordem?: number
          precisa_de_mais_capital?: boolean
          score_contexto?: number
          score_financeiro?: number
          score_perfil?: number
          score_tempo?: number
          sub_negocios_destaque?: Json
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
      niche_sub_negocios: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          exige_equipe: boolean
          id: string
          niche_id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao: string
          exige_equipe?: boolean
          id?: string
          niche_id: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          exige_equipe?: boolean
          id?: string
          niche_id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "niche_sub_negocios_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          areas_afinidade: string[]
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
          permite_inicio_em_casa: boolean
          playbook_md: string | null
          sazonalidade: Json
          slug: string
          tempo_ate_equilibrio_meses: number | null
          updated_at: string
        }
        Insert: {
          areas_afinidade?: string[]
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
          permite_inicio_em_casa?: boolean
          playbook_md?: string | null
          sazonalidade?: Json
          slug: string
          tempo_ate_equilibrio_meses?: number | null
          updated_at?: string
        }
        Update: {
          areas_afinidade?: string[]
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
          permite_inicio_em_casa?: boolean
          playbook_md?: string | null
          sazonalidade?: Json
          slug?: string
          tempo_ate_equilibrio_meses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      obrigacoes_catalogo: {
        Row: {
          ativo: boolean
          como_fazer: string
          created_at: string
          descricao: string
          fonte_data: string
          fonte_url: string
          id: string
          nome: string
          ordem: number
          regime: string[]
          regra_vencimento: Json
          requer_funcionarios: boolean
          slug: string
        }
        Insert: {
          ativo?: boolean
          como_fazer: string
          created_at?: string
          descricao: string
          fonte_data: string
          fonte_url: string
          id?: string
          nome: string
          ordem?: number
          regime: string[]
          regra_vencimento: Json
          requer_funcionarios?: boolean
          slug: string
        }
        Update: {
          ativo?: boolean
          como_fazer?: string
          created_at?: string
          descricao?: string
          fonte_data?: string
          fonte_url?: string
          id?: string
          nome?: string
          ordem?: number
          regime?: string[]
          regra_vencimento?: Json
          requer_funcionarios?: boolean
          slug?: string
        }
        Relationships: []
      }
      obrigacoes_config: {
        Row: {
          created_at: string
          regime: string
          tem_funcionarios: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          regime: string
          tem_funcionarios?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          regime?: string
          tem_funcionarios?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      obrigacoes_status: {
        Row: {
          concluido_em: string
          id: string
          obrigacao_id: string
          periodo_referencia: string
          user_id: string
        }
        Insert: {
          concluido_em?: string
          id?: string
          obrigacao_id: string
          periodo_referencia: string
          user_id: string
        }
        Update: {
          concluido_em?: string
          id?: string
          obrigacao_id?: string
          periodo_referencia?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obrigacoes_status_obrigacao_id_fkey"
            columns: ["obrigacao_id"]
            isOneToOne: false
            referencedRelation: "obrigacoes_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_acao: {
        Row: {
          created_at: string
          gerado_em: string
          id: string
          mes_referencia: string
          objetivo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gerado_em?: string
          id?: string
          mes_referencia: string
          objetivo: string
          user_id: string
        }
        Update: {
          created_at?: string
          gerado_em?: string
          id?: string
          mes_referencia?: string
          objetivo?: string
          user_id?: string
        }
        Relationships: []
      }
      planos_acao_itens: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          id: string
          ordem: number
          plano_id: string
          semana: number
          titulo: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          id?: string
          ordem?: number
          plano_id: string
          semana: number
          titulo: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          id?: string
          ordem?: number
          plano_id?: string
          semana?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_acao_itens_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      raiox_despesas_diarias: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          descricao?: string | null
          id?: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      raiox_financeiro_mensal: {
        Row: {
          created_at: string
          despesas: number
          faturamento: number
          gerado_em: string
          id: string
          mes_referencia: string
          retirada_socio: number
          user_id: string
        }
        Insert: {
          created_at?: string
          despesas: number
          faturamento: number
          gerado_em?: string
          id?: string
          mes_referencia: string
          retirada_socio?: number
          user_id: string
        }
        Update: {
          created_at?: string
          despesas?: number
          faturamento?: number
          gerado_em?: string
          id?: string
          mes_referencia?: string
          retirada_socio?: number
          user_id?: string
        }
        Relationships: []
      }
      retencao_clientes: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          notas: string | null
          origem: string
          origem_contato_id: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          notas?: string | null
          origem?: string
          origem_contato_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          notas?: string | null
          origem?: string
          origem_contato_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retencao_clientes_origem_contato_id_fkey"
            columns: ["origem_contato_id"]
            isOneToOne: false
            referencedRelation: "jornada_clientes_contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      retencao_config: {
        Row: {
          ciclo_recompra_dias: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciclo_recompra_dias: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciclo_recompra_dias?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      retencao_interacoes: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          notas: string | null
          ocorrida_em: string
          tipo: string
          valor: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          notas?: string | null
          ocorrida_em?: string
          tipo: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          notas?: string | null
          ocorrida_em?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retencao_interacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "retencao_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      retencao_roteiros: {
        Row: {
          cliente_id: string
          conteudo: Json
          created_at: string
          updated_at: string
          versao: number
        }
        Insert: {
          cliente_id: string
          conteudo: Json
          created_at?: string
          updated_at?: string
          versao?: number
        }
        Update: {
          cliente_id?: string
          conteudo?: Json
          created_at?: string
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "retencao_roteiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "retencao_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          com_quem: string
          created_at: string
          gerado_em: string
          guia: Json
          id: string
          objetivo: string
          observacoes: string | null
          tipo: string
          tipo_outro_detalhe: string | null
          user_id: string
        }
        Insert: {
          com_quem: string
          created_at?: string
          gerado_em?: string
          guia: Json
          id?: string
          objetivo: string
          observacoes?: string | null
          tipo: string
          tipo_outro_detalhe?: string | null
          user_id: string
        }
        Update: {
          com_quem?: string
          created_at?: string
          gerado_em?: string
          guia?: Json
          id?: string
          objetivo?: string
          observacoes?: string | null
          tipo?: string
          tipo_outro_detalhe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reunioes_agenda: {
        Row: {
          atualizado_em: string
          contato_email: string | null
          contato_nome: string | null
          convite_enviado_em: string | null
          criado_em: string
          data_hora: string
          id: string
          local_tipo: string
          local_valor: string
          reuniao_id: string
        }
        Insert: {
          atualizado_em?: string
          contato_email?: string | null
          contato_nome?: string | null
          convite_enviado_em?: string | null
          criado_em?: string
          data_hora: string
          id?: string
          local_tipo: string
          local_valor: string
          reuniao_id: string
        }
        Update: {
          atualizado_em?: string
          contato_email?: string | null
          contato_nome?: string | null
          convite_enviado_em?: string | null
          criado_em?: string
          data_hora?: string
          id?: string
          local_tipo?: string
          local_valor?: string
          reuniao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_agenda_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: true
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes_resultado: {
        Row: {
          atualizado_em: string
          combinado: string | null
          id: string
          registrado_em: string
          reuniao_id: string
          sucesso: string
        }
        Insert: {
          atualizado_em?: string
          combinado?: string | null
          id?: string
          registrado_em?: string
          reuniao_id: string
          sucesso: string
        }
        Update: {
          atualizado_em?: string
          combinado?: string | null
          id?: string
          registrado_em?: string
          reuniao_id?: string
          sucesso?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_resultado_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: true
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          abacatepay_billing_id: string | null
          abacatepay_customer_id: string | null
          abacatepay_external_id: string
          cancelado_em: string | null
          ciclo: string
          concedido_por: string | null
          created_at: string
          id: string
          inadimplente_desde: string | null
          iniciado_em: string | null
          nota: string | null
          origem: string
          plano: string
          preco_centavos: number
          renovado_em: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abacatepay_billing_id?: string | null
          abacatepay_customer_id?: string | null
          abacatepay_external_id: string
          cancelado_em?: string | null
          ciclo?: string
          concedido_por?: string | null
          created_at?: string
          id?: string
          inadimplente_desde?: string | null
          iniciado_em?: string | null
          nota?: string | null
          origem?: string
          plano: string
          preco_centavos: number
          renovado_em?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abacatepay_billing_id?: string | null
          abacatepay_customer_id?: string | null
          abacatepay_external_id?: string
          cancelado_em?: string | null
          ciclo?: string
          concedido_por?: string | null
          created_at?: string
          id?: string
          inadimplente_desde?: string | null
          iniciado_em?: string | null
          nota?: string | null
          origem?: string
          plano?: string
          preco_centavos?: number
          renovado_em?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          cortesia: boolean
          habilitado: boolean
          habilitado_em: string
          id: string
          module_id: string
          novidade_vista: boolean
          user_id: string
        }
        Insert: {
          cortesia?: boolean
          habilitado?: boolean
          habilitado_em?: string
          id?: string
          module_id: string
          novidade_vista?: boolean
          user_id: string
        }
        Update: {
          cortesia?: boolean
          habilitado?: boolean
          habilitado_em?: string
          id?: string
          module_id?: string
          novidade_vista?: boolean
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
      user_push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          plano_atual: string
          role: string
          telefone: string | null
          updated_at: string
          welcome_email_enviado_em: string | null
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
          plano_atual?: string
          role?: string
          telefone?: string | null
          updated_at?: string
          welcome_email_enviado_em?: string | null
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
          plano_atual?: string
          role?: string
          telefone?: string | null
          updated_at?: string
          welcome_email_enviado_em?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assinaturas_listar: {
        Args: { filtro_status?: string }
        Returns: {
          cancelado_em: string
          created_at: string
          email: string
          id: string
          nome: string
          nota: string
          origem: string
          plano: string
          preco_centavos: number
          renovado_em: string
          status: string
          user_id: string
        }[]
      }
      admin_assinaturas_por_plano: {
        Args: never
        Returns: {
          ativos: number
          ativos_cortesia: number
          plano: string
          receita_real_centavos: number
        }[]
      }
      admin_assinaturas_resumo: { Args: never; Returns: Json }
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_dicas_ranking: {
        Args: { limite?: number }
        Returns: {
          acessos: number
          categoria: string
          material_id: string
          titulo: string
        }[]
      }
      admin_fornecedores_by_categoria: {
        Args: never
        Returns: {
          categoria: string
          total: number
        }[]
      }
      admin_ia_usage_por_dia: {
        Args: { dias?: number }
        Returns: {
          chamadas: number
          dia: string
          tokens: number
        }[]
      }
      admin_ia_usage_por_funcao: {
        Args: never
        Returns: {
          chamadas: number
          funcao: string
          tokens: number
        }[]
      }
      admin_ia_usage_totals: { Args: never; Returns: Json }
      admin_jornada_funnel: {
        Args: never
        Returns: {
          alcancaram: number
          fase: string
          total_jornadas: number
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          bloqueado: boolean
          created_at: string
          email: string
          id: string
          is_anonymous: boolean
          last_sign_in_at: string
          nome: string
          role: string
          telefone: string
        }[]
      }
      admin_module_adoption: {
        Args: never
        Returns: {
          habilitados: number
          modulo: string
        }[]
      }
      admin_planos_usuarios: {
        Args: never
        Returns: {
          assinatura_id: string
          email: string
          nome: string
          origem: string
          plano_atual: string
          user_id: string
        }[]
      }
      admin_user_growth: {
        Args: { dias?: number }
        Returns: {
          dia: string
          novos_usuarios: number
        }[]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      match_fornecedores_parceiros: {
        Args: {
          filter_niche_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          categoria: string
          contato: string
          descricao: string
          id: string
          nome: string
          regiao: string
          similarity: number
          site: string
        }[]
      }
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
