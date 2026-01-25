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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aceites_termos: {
        Row: {
          aceito_em: string | null
          id: string
          ip_address: string | null
          termo_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          aceito_em?: string | null
          id?: string
          ip_address?: string | null
          termo_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          aceito_em?: string | null
          id?: string
          ip_address?: string | null
          termo_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aceites_termos_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cache_semantico: {
        Row: {
          categoria: string | null
          contexto: Json | null
          created_at: string | null
          embedding: string | null
          expires_at: string | null
          hash_pergunta: string
          hits: number | null
          id: string
          last_hit_at: string | null
          modelo: string | null
          pergunta_normalizada: string
          pergunta_original: string
          resposta: string
          tokens_usados: number | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          contexto?: Json | null
          created_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          hash_pergunta: string
          hits?: number | null
          id?: string
          last_hit_at?: string | null
          modelo?: string | null
          pergunta_normalizada: string
          pergunta_original: string
          resposta: string
          tokens_usados?: number | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          contexto?: Json | null
          created_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          hash_pergunta?: string
          hits?: number | null
          id?: string
          last_hit_at?: string | null
          modelo?: string | null
          pergunta_normalizada?: string
          pergunta_original?: string
          resposta?: string
          tokens_usados?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_cache_versiculos: {
        Row: {
          cache_key: string
          capitulo: number
          created_at: string | null
          hits: number | null
          id: string
          last_hit_at: string | null
          livro: string
          modelo: string | null
          resposta: string
          tipo: string
          tokens_usados: number | null
          versiculo_fim: number | null
          versiculo_inicio: number
        }
        Insert: {
          cache_key: string
          capitulo: number
          created_at?: string | null
          hits?: number | null
          id?: string
          last_hit_at?: string | null
          livro: string
          modelo?: string | null
          resposta: string
          tipo: string
          tokens_usados?: number | null
          versiculo_fim?: number | null
          versiculo_inicio: number
        }
        Update: {
          cache_key?: string
          capitulo?: number
          created_at?: string | null
          hits?: number | null
          id?: string
          last_hit_at?: string | null
          livro?: string
          modelo?: string | null
          resposta?: string
          tipo?: string
          tokens_usados?: number | null
          versiculo_fim?: number | null
          versiculo_inicio?: number
        }
        Relationships: []
      }
      ai_config: {
        Row: {
          cache_habilitado: boolean | null
          cache_similaridade_minima: number | null
          custo_por_1k_tokens_entrada: number | null
          custo_por_1k_tokens_saida: number | null
          custo_por_embedding: number | null
          id: string
          limite_requisicoes_por_minuto: number | null
          limite_tokens_por_requisicao: number | null
          modelo_chat: string | null
          modelo_embedding: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cache_habilitado?: boolean | null
          cache_similaridade_minima?: number | null
          custo_por_1k_tokens_entrada?: number | null
          custo_por_1k_tokens_saida?: number | null
          custo_por_embedding?: number | null
          id?: string
          limite_requisicoes_por_minuto?: number | null
          limite_tokens_por_requisicao?: number | null
          modelo_chat?: string | null
          modelo_embedding?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cache_habilitado?: boolean | null
          cache_similaridade_minima?: number | null
          custo_por_1k_tokens_entrada?: number | null
          custo_por_1k_tokens_saida?: number | null
          custo_por_embedding?: number | null
          id?: string
          limite_requisicoes_por_minuto?: number | null
          limite_tokens_por_requisicao?: number | null
          modelo_chat?: string | null
          modelo_embedding?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_consumo: {
        Row: {
          cache_key: string | null
          created_at: string | null
          custo_estimado: number | null
          foi_cache: boolean | null
          id: string
          modelo: string | null
          prompt_resumo: string | null
          tipo: string
          tokens_entrada: number | null
          tokens_saida: number | null
          tokens_total: number | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          cache_key?: string | null
          created_at?: string | null
          custo_estimado?: number | null
          foi_cache?: boolean | null
          id?: string
          modelo?: string | null
          prompt_resumo?: string | null
          tipo: string
          tokens_entrada?: number | null
          tokens_saida?: number | null
          tokens_total?: number | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          cache_key?: string | null
          created_at?: string | null
          custo_estimado?: number | null
          foi_cache?: boolean | null
          id?: string
          modelo?: string | null
          prompt_resumo?: string | null
          tipo?: string
          tokens_entrada?: number | null
          tokens_saida?: number | null
          tokens_total?: number | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_consumo_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_consumo_diario: {
        Row: {
          custo_total: number | null
          data: string
          id: string
          total_requisicoes: number | null
          total_requisicoes_cache: number | null
          total_tokens: number | null
          unidade_id: string | null
          usuarios_unicos: number | null
        }
        Insert: {
          custo_total?: number | null
          data: string
          id?: string
          total_requisicoes?: number | null
          total_requisicoes_cache?: number | null
          total_tokens?: number | null
          unidade_id?: string | null
          usuarios_unicos?: number | null
        }
        Update: {
          custo_total?: number | null
          data?: string
          id?: string
          total_requisicoes?: number | null
          total_requisicoes_cache?: number | null
          total_tokens?: number | null
          unidade_id?: string | null
          usuarios_unicos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_consumo_diario_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limit: {
        Row: {
          data: string
          id: string
          requisicoes_hoje: number | null
          reset_em: string | null
          tokens_hoje: number | null
          ultima_requisicao: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          data?: string
          id?: string
          requisicoes_hoje?: number | null
          reset_em?: string | null
          tokens_hoje?: number | null
          ultima_requisicao?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          data?: string
          id?: string
          requisicoes_hoje?: number | null
          reset_em?: string | null
          tokens_hoje?: number | null
          ultima_requisicao?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rate_limit_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string | null
          id: string
          ip_address: string | null
          registro_id: string | null
          tabela: string | null
          unidade_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela?: string | null
          unidade_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela?: string | null
          unidade_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_books: {
        Row: {
          abbreviation: string
          book_number: number
          chapters_count: number
          created_at: string
          id: string
          name: string
          testament: string
        }
        Insert: {
          abbreviation: string
          book_number: number
          chapters_count: number
          created_at?: string
          id?: string
          name: string
          testament: string
        }
        Update: {
          abbreviation?: string
          book_number?: number
          chapters_count?: number
          created_at?: string
          id?: string
          name?: string
          testament?: string
        }
        Relationships: []
      }
      bible_verses: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          text: string
          texto_normalizado: string | null
          texto_tsv: unknown
          verse: number
          version_id: string
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          text: string
          texto_normalizado?: string | null
          texto_tsv?: unknown
          verse: number
          version_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          text?: string
          texto_normalizado?: string | null
          texto_tsv?: unknown
          verse?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_verses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_versions: {
        Row: {
          code: string
          created_at: string
          id: string
          language: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: string
          name?: string
        }
        Relationships: []
      }
      chat_historico: {
        Row: {
          created_at: string
          id: string
          mensagens: Json
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagens?: Json
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagens?: Json
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      comentarios: {
        Row: {
          conteudo: string
          created_at: string | null
          id: string
          moderado_em: string | null
          moderado_por: string | null
          motivo_moderacao: string | null
          post_id: string | null
          status: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          id?: string
          moderado_em?: string | null
          moderado_por?: string | null
          motivo_moderacao?: string | null
          post_id?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          id?: string
          moderado_em?: string | null
          moderado_por?: string | null
          motivo_moderacao?: string | null
          post_id?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          aceito_em: string | null
          aceito_por: string | null
          cargo: string | null
          codigo: string
          created_at: string | null
          criado_por: string | null
          email: string
          email_enviado: boolean | null
          email_enviado_em: string | null
          expira_em: string
          id: string
          nome: string | null
          status: string | null
          tipo: string
          unidade_id: string | null
        }
        Insert: {
          aceito_em?: string | null
          aceito_por?: string | null
          cargo?: string | null
          codigo: string
          created_at?: string | null
          criado_por?: string | null
          email: string
          email_enviado?: boolean | null
          email_enviado_em?: string | null
          expira_em: string
          id?: string
          nome?: string | null
          status?: string | null
          tipo: string
          unidade_id?: string | null
        }
        Update: {
          aceito_em?: string | null
          aceito_por?: string | null
          cargo?: string | null
          codigo?: string
          created_at?: string | null
          criado_por?: string | null
          email?: string
          email_enviado?: boolean | null
          email_enviado_em?: string | null
          expira_em?: string
          id?: string
          nome?: string | null
          status?: string | null
          tipo?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      curtidas: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curtidas_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curtidas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_hymns: {
        Row: {
          created_at: string
          hymn_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hymn_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hymn_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_hymns_hymn_id_fkey"
            columns: ["hymn_id"]
            isOneToOne: false
            referencedRelation: "harpa_hymns"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_verses: {
        Row: {
          created_at: string
          id: string
          user_id: string
          verse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          verse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_verses_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "bible_verses"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          is_active: boolean | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      harpa_hymns: {
        Row: {
          author: string | null
          chorus: string | null
          created_at: string
          hymn_number: number
          id: string
          lyrics: string
          title: string
        }
        Insert: {
          author?: string | null
          chorus?: string | null
          created_at?: string
          hymn_number: number
          id?: string
          lyrics: string
          title: string
        }
        Update: {
          author?: string | null
          chorus?: string | null
          created_at?: string
          hymn_number?: number
          id?: string
          lyrics?: string
          title?: string
        }
        Relationships: []
      }
      masters: {
        Row: {
          cargo: string | null
          convite_id: string | null
          created_at: string | null
          email: string
          foto_url: string | null
          id: string
          is_active: boolean | null
          is_principal: boolean | null
          last_access: string | null
          nome: string
          ordem: number | null
          telefone: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          cargo?: string | null
          convite_id?: string | null
          created_at?: string | null
          email: string
          foto_url?: string | null
          id?: string
          is_active?: boolean | null
          is_principal?: boolean | null
          last_access?: string | null
          nome: string
          ordem?: number | null
          telefone?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          cargo?: string | null
          convite_id?: string | null
          created_at?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          is_active?: boolean | null
          is_principal?: boolean | null
          last_access?: string | null
          nome?: string
          ordem?: number | null
          telefone?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "masters_convite_id_fkey"
            columns: ["convite_id"]
            isOneToOne: false
            referencedRelation: "convites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "masters_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_diarias: {
        Row: {
          capitulos_lidos: number | null
          comentarios: number | null
          consultas_ia: number | null
          consultas_ia_cache: number | null
          curtidas: number | null
          data: string
          devocionais_criados: number | null
          devocionais_lidos: number | null
          id: string
          logins: number | null
          novos_usuarios: number | null
          posts_criados: number | null
          total_usuarios: number | null
          unidade_id: string | null
          usuarios_ativos: number | null
          versiculos_marcados: number | null
        }
        Insert: {
          capitulos_lidos?: number | null
          comentarios?: number | null
          consultas_ia?: number | null
          consultas_ia_cache?: number | null
          curtidas?: number | null
          data: string
          devocionais_criados?: number | null
          devocionais_lidos?: number | null
          id?: string
          logins?: number | null
          novos_usuarios?: number | null
          posts_criados?: number | null
          total_usuarios?: number | null
          unidade_id?: string | null
          usuarios_ativos?: number | null
          versiculos_marcados?: number | null
        }
        Update: {
          capitulos_lidos?: number | null
          comentarios?: number | null
          consultas_ia?: number | null
          consultas_ia_cache?: number | null
          curtidas?: number | null
          data?: string
          devocionais_criados?: number | null
          devocionais_lidos?: number | null
          id?: string
          logins?: number | null
          novos_usuarios?: number | null
          posts_criados?: number | null
          total_usuarios?: number | null
          unidade_id?: string | null
          usuarios_ativos?: number | null
          versiculos_marcados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_diarias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          criado_por: string | null
          destinatarios_ids: string[] | null
          destinatarios_tipo: string | null
          enviada_em: string | null
          icone: string | null
          id: string
          link_acao: string | null
          mensagem: string
          programada_para: string | null
          status: string | null
          tipo: string | null
          titulo: string
          total_enviados: number | null
          total_lidos: number | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          destinatarios_ids?: string[] | null
          destinatarios_tipo?: string | null
          enviada_em?: string | null
          icone?: string | null
          id?: string
          link_acao?: string | null
          mensagem: string
          programada_para?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          total_enviados?: number | null
          total_lidos?: number | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          destinatarios_ids?: string[] | null
          destinatarios_tipo?: string | null
          enviada_em?: string | null
          icone?: string | null
          id?: string
          link_acao?: string | null
          mensagem?: string
          programada_para?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          total_enviados?: number | null
          total_lidos?: number | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_usuarios: {
        Row: {
          clicada_em: string | null
          id: string
          lida_em: string | null
          notificacao_id: string | null
          recebida_em: string | null
          user_id: string
        }
        Insert: {
          clicada_em?: string | null
          id?: string
          lida_em?: string | null
          notificacao_id?: string | null
          recebida_em?: string | null
          user_id: string
        }
        Update: {
          clicada_em?: string | null
          id?: string
          lida_em?: string | null
          notificacao_id?: string | null
          recebida_em?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuarios_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_leitura: {
        Row: {
          codigo_convite: string | null
          created_at: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          duracao_dias: number
          id: string
          imagem_url: string | null
          inclui_domingo: boolean | null
          inclui_sabado: boolean | null
          leituras_por_dia: number | null
          max_inscritos: number | null
          permite_inscricao_publica: boolean | null
          publicado_em: string | null
          status: string | null
          tipo: string
          titulo: string
          total_concluidos: number | null
          total_inscritos: number | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          codigo_convite?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          duracao_dias?: number
          id?: string
          imagem_url?: string | null
          inclui_domingo?: boolean | null
          inclui_sabado?: boolean | null
          leituras_por_dia?: number | null
          max_inscritos?: number | null
          permite_inscricao_publica?: boolean | null
          publicado_em?: string | null
          status?: string | null
          tipo?: string
          titulo: string
          total_concluidos?: number | null
          total_inscritos?: number | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo_convite?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          duracao_dias?: number
          id?: string
          imagem_url?: string | null
          inclui_domingo?: boolean | null
          inclui_sabado?: boolean | null
          leituras_por_dia?: number | null
          max_inscritos?: number | null
          permite_inscricao_publica?: boolean | null
          publicado_em?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          total_concluidos?: number | null
          total_inscritos?: number | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_leitura_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_leitura_inscricoes: {
        Row: {
          concluido_em: string | null
          data_fim_prevista: string | null
          data_inicio_usuario: string
          id: string
          inscrito_em: string | null
          itens_concluidos: number | null
          percentual_concluido: number | null
          plano_id: string | null
          status: string | null
          total_itens: number | null
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          concluido_em?: string | null
          data_fim_prevista?: string | null
          data_inicio_usuario: string
          id?: string
          inscrito_em?: string | null
          itens_concluidos?: number | null
          percentual_concluido?: number | null
          plano_id?: string | null
          status?: string | null
          total_itens?: number | null
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          concluido_em?: string | null
          data_fim_prevista?: string | null
          data_inicio_usuario?: string
          id?: string
          inscrito_em?: string | null
          itens_concluidos?: number | null
          percentual_concluido?: number | null
          plano_id?: string | null
          status?: string | null
          total_itens?: number | null
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_leitura_inscricoes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_leitura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_leitura_inscricoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_leitura_itens: {
        Row: {
          capitulo_fim: number | null
          capitulo_inicio: number
          data_prevista: string | null
          dia_numero: number
          id: string
          livro_id: string | null
          ordem: number | null
          plano_id: string | null
          referencia_texto: string
          titulo_dia: string | null
          versiculo_fim: number | null
          versiculo_inicio: number | null
        }
        Insert: {
          capitulo_fim?: number | null
          capitulo_inicio: number
          data_prevista?: string | null
          dia_numero: number
          id?: string
          livro_id?: string | null
          ordem?: number | null
          plano_id?: string | null
          referencia_texto: string
          titulo_dia?: string | null
          versiculo_fim?: number | null
          versiculo_inicio?: number | null
        }
        Update: {
          capitulo_fim?: number | null
          capitulo_inicio?: number
          data_prevista?: string | null
          dia_numero?: number
          id?: string
          livro_id?: string | null
          ordem?: number | null
          plano_id?: string | null
          referencia_texto?: string
          titulo_dia?: string | null
          versiculo_fim?: number | null
          versiculo_inicio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_leitura_itens_livro_id_fkey"
            columns: ["livro_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_leitura_itens_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_leitura"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_leitura_progresso: {
        Row: {
          anotacao: string | null
          concluido: boolean | null
          fonte: string | null
          id: string
          inscricao_id: string | null
          item_id: string | null
          marcado_em: string | null
          user_id: string
        }
        Insert: {
          anotacao?: string | null
          concluido?: boolean | null
          fonte?: string | null
          id?: string
          inscricao_id?: string | null
          item_id?: string | null
          marcado_em?: string | null
          user_id: string
        }
        Update: {
          anotacao?: string | null
          concluido?: boolean | null
          fonte?: string | null
          id?: string
          inscricao_id?: string | null
          item_id?: string | null
          marcado_em?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_leitura_progresso_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "planos_leitura_inscricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_leitura_progresso_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "planos_leitura_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_templates: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          duracao_dias: number
          id: string
          is_active: boolean | null
          leituras: Json
          nivel: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_dias: number
          id?: string
          is_active?: boolean | null
          leituras?: Json
          nivel?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_dias?: number
          id?: string
          is_active?: boolean | null
          leituras?: Json
          nivel?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          comentarios: number | null
          conteudo: string
          created_at: string | null
          curtidas: number | null
          devocional_id: string | null
          id: string
          moderado_em: string | null
          moderado_por: string | null
          motivo_moderacao: string | null
          status: string | null
          tipo: string | null
          unidade_id: string | null
          updated_at: string | null
          user_id: string | null
          versiculo_ref: string | null
        }
        Insert: {
          comentarios?: number | null
          conteudo: string
          created_at?: string | null
          curtidas?: number | null
          devocional_id?: string | null
          id?: string
          moderado_em?: string | null
          moderado_por?: string | null
          motivo_moderacao?: string | null
          status?: string | null
          tipo?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          versiculo_ref?: string | null
        }
        Update: {
          comentarios?: number | null
          conteudo?: string
          created_at?: string | null
          curtidas?: number | null
          devocional_id?: string | null
          id?: string
          moderado_em?: string | null
          moderado_por?: string | null
          motivo_moderacao?: string | null
          status?: string | null
          tipo?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          versiculo_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_plan_days: {
        Row: {
          book_id: string
          chapter_end: number
          chapter_start: number
          created_at: string
          day_number: number
          id: string
          plan_id: string
        }
        Insert: {
          book_id: string
          chapter_end: number
          chapter_start: number
          created_at?: string
          day_number: number
          id?: string
          plan_id: string
        }
        Update: {
          book_id?: string
          chapter_end?: number
          chapter_start?: number
          created_at?: string
          day_number?: number
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_public: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          is_public?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_public?: boolean
          name?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          last_read_at: string
          read_count: number
          user_id: string
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          last_read_at?: string
          read_count?: number
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          last_read_at?: string
          read_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          badges: Json | null
          capitulos_lidos: number | null
          devocionais_criados: number | null
          devocionais_lidos: number | null
          dias_ativos: number | null
          id: string
          nivel: number | null
          nivel_nome: string | null
          pontos_devocional: number | null
          pontos_leitura: number | null
          pontos_social: number | null
          pontos_streak: number | null
          score_total: number | null
          streak_atual: number | null
          streak_maximo: number | null
          ultima_atividade: string | null
          unidade_id: string | null
          updated_at: string | null
          user_id: string | null
          versiculos_marcados: number | null
          visivel_ranking: boolean | null
          xp_atual: number | null
          xp_proximo_nivel: number | null
        }
        Insert: {
          badges?: Json | null
          capitulos_lidos?: number | null
          devocionais_criados?: number | null
          devocionais_lidos?: number | null
          dias_ativos?: number | null
          id?: string
          nivel?: number | null
          nivel_nome?: string | null
          pontos_devocional?: number | null
          pontos_leitura?: number | null
          pontos_social?: number | null
          pontos_streak?: number | null
          score_total?: number | null
          streak_atual?: number | null
          streak_maximo?: number | null
          ultima_atividade?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          versiculos_marcados?: number | null
          visivel_ranking?: boolean | null
          xp_atual?: number | null
          xp_proximo_nivel?: number | null
        }
        Update: {
          badges?: Json | null
          capitulos_lidos?: number | null
          devocionais_criados?: number | null
          devocionais_lidos?: number | null
          dias_ativos?: number | null
          id?: string
          nivel?: number | null
          nivel_nome?: string | null
          pontos_devocional?: number | null
          pontos_leitura?: number | null
          pontos_social?: number | null
          pontos_streak?: number | null
          score_total?: number | null
          streak_atual?: number | null
          streak_maximo?: number | null
          ultima_atividade?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          versiculos_marcados?: number | null
          visivel_ranking?: boolean | null
          xp_atual?: number | null
          xp_proximo_nivel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          dispositivo: string | null
          duracao_segundos: number | null
          fim: string | null
          id: string
          inicio: string | null
          ip_address: string | null
          navegador: string | null
          sistema_operacional: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          dispositivo?: string | null
          duracao_segundos?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          ip_address?: string | null
          navegador?: string | null
          sistema_operacional?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          dispositivo?: string | null
          duracao_segundos?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          ip_address?: string | null
          navegador?: string | null
          sistema_operacional?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      super_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_permanent: boolean | null
          nome: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_permanent?: boolean | null
          nome?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_permanent?: boolean | null
          nome?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      termos_versoes: {
        Row: {
          ativo: boolean | null
          conteudo: string
          created_at: string | null
          criado_por: string | null
          id: string
          publicado_em: string | null
          tipo: string
          versao: string
        }
        Insert: {
          ativo?: boolean | null
          conteudo: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          publicado_em?: string | null
          tipo: string
          versao: string
        }
        Update: {
          ativo?: boolean | null
          conteudo?: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          publicado_em?: string | null
          tipo?: string
          versao?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          aceite_termos: boolean | null
          aceite_termos_em: string | null
          ai_habilitada: boolean | null
          ai_limite_por_usuario_dia: number | null
          ai_modelo_padrao: string | null
          apelido_app: string
          cep: string | null
          chat_ia_ativo: boolean | null
          cidade: string | null
          cnpj: string | null
          codigo: string | null
          cor_destaque: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string | null
          created_by: string | null
          devocional_ia_ativo: boolean | null
          email: string | null
          endereco: string | null
          estado: string | null
          facebook: string | null
          gamificacao_ativa: boolean | null
          id: string
          instagram: string | null
          is_active: boolean | null
          limite_masters: number | null
          limite_usuarios: number | null
          logo_icon_url: string | null
          logo_url: string | null
          nome_fantasia: string
          notificacoes_ativas: boolean | null
          pix_chave: string | null
          pix_nome_beneficiario: string | null
          pix_qr_code_url: string | null
          pix_tipo: string | null
          ranking_publico: boolean | null
          razao_social: string | null
          rede_social_ativa: boolean | null
          site: string | null
          slug: string
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          aceite_termos?: boolean | null
          aceite_termos_em?: string | null
          ai_habilitada?: boolean | null
          ai_limite_por_usuario_dia?: number | null
          ai_modelo_padrao?: string | null
          apelido_app: string
          cep?: string | null
          chat_ia_ativo?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          codigo?: string | null
          cor_destaque?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          created_by?: string | null
          devocional_ia_ativo?: boolean | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          facebook?: string | null
          gamificacao_ativa?: boolean | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          limite_masters?: number | null
          limite_usuarios?: number | null
          logo_icon_url?: string | null
          logo_url?: string | null
          nome_fantasia: string
          notificacoes_ativas?: boolean | null
          pix_chave?: string | null
          pix_nome_beneficiario?: string | null
          pix_qr_code_url?: string | null
          pix_tipo?: string | null
          ranking_publico?: boolean | null
          razao_social?: string | null
          rede_social_ativa?: boolean | null
          site?: string | null
          slug: string
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          aceite_termos?: boolean | null
          aceite_termos_em?: string | null
          ai_habilitada?: boolean | null
          ai_limite_por_usuario_dia?: number | null
          ai_modelo_padrao?: string | null
          apelido_app?: string
          cep?: string | null
          chat_ia_ativo?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          codigo?: string | null
          cor_destaque?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          created_by?: string | null
          devocional_ia_ativo?: boolean | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          facebook?: string | null
          gamificacao_ativa?: boolean | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          limite_masters?: number | null
          limite_usuarios?: number | null
          logo_icon_url?: string | null
          logo_url?: string | null
          nome_fantasia?: string
          notificacoes_ativas?: boolean | null
          pix_chave?: string | null
          pix_nome_beneficiario?: string | null
          pix_qr_code_url?: string | null
          pix_tipo?: string | null
          ranking_publico?: boolean | null
          razao_social?: string | null
          rede_social_ativa?: boolean | null
          site?: string | null
          slug?: string
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verse_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verse_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "bible_verses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          current_day: number
          id: string
          is_active: boolean
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          id?: string
          is_active?: boolean
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          id?: string
          is_active?: boolean
          plan_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          aceite_privacidade: boolean | null
          aceite_privacidade_em: string | null
          aceite_termos: boolean | null
          aceite_termos_em: string | null
          convidado_por: string | null
          convite_id: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string
          foto_url: string | null
          id: string
          is_active: boolean | null
          last_access: string | null
          nome: string | null
          telefone: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          aceite_privacidade?: boolean | null
          aceite_privacidade_em?: string | null
          aceite_termos?: boolean | null
          aceite_termos_em?: string | null
          convidado_por?: string | null
          convite_id?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email: string
          foto_url?: string | null
          id?: string
          is_active?: boolean | null
          last_access?: string | null
          nome?: string | null
          telefone?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          aceite_privacidade?: boolean | null
          aceite_privacidade_em?: string | null
          aceite_termos?: boolean | null
          aceite_termos_em?: string | null
          convidado_por?: string | null
          convite_id?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          is_active?: boolean | null
          last_access?: string | null
          nome?: string | null
          telefone?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_convite_id_fkey"
            columns: ["convite_id"]
            isOneToOne: false
            referencedRelation: "convites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_highlights: {
        Row: {
          color: string
          created_at: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
          verse_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
          verse_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verse_highlights_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "bible_verses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_metricas_diarias: {
        Args: { p_unidade_id: string }
        Returns: undefined
      }
      belongs_to_unidade: {
        Args: { check_unidade_id: string }
        Returns: boolean
      }
      buscar_biblia_exato: {
        Args: {
          limite?: number
          livro_id_param?: string
          pagina?: number
          termo_busca: string
          testamento_param?: string
          versao_codigo?: string
        }
        Returns: {
          capitulo: number
          id: string
          livro: string
          livro_abrev: string
          referencia: string
          texto: string
          versao: string
          versiculo: number
        }[]
      }
      buscar_biblia_palavras: {
        Args: {
          limite?: number
          livro_id_param?: string
          modo?: string
          pagina?: number
          termo_busca: string
          testamento_param?: string
          versao_codigo?: string
        }
        Returns: {
          capitulo: number
          id: string
          livro: string
          livro_abrev: string
          referencia: string
          relevancia: number
          texto: string
          versao: string
          versiculo: number
        }[]
      }
      buscar_biblia_prefixo: {
        Args: { limite?: number; prefixo: string; versao_codigo?: string }
        Returns: {
          capitulo: number
          id: string
          livro: string
          livro_abrev: string
          referencia: string
          texto: string
          versao: string
          versiculo: number
        }[]
      }
      buscar_biblia_similar: {
        Args: {
          limite?: number
          similaridade_minima?: number
          termo_busca: string
          versao_codigo?: string
        }
        Returns: {
          capitulo: number
          id: string
          livro: string
          livro_abrev: string
          referencia: string
          similaridade: number
          texto: string
          versao: string
          versiculo: number
        }[]
      }
      buscar_cache_similar_global: {
        Args: {
          p_categoria?: string
          p_embedding: string
          p_limite?: number
          p_similaridade_minima?: number
        }
        Returns: {
          categoria: string
          id: string
          pergunta_original: string
          resposta: string
          similaridade: number
        }[]
      }
      buscar_cache_versiculo: {
        Args: {
          p_capitulo: number
          p_livro: string
          p_tipo?: string
          p_versiculo_fim?: number
          p_versiculo_inicio: number
        }
        Returns: {
          hits: number
          id: string
          resposta: string
        }[]
      }
      buscar_plano_por_codigo: {
        Args: { p_codigo: string }
        Returns: {
          codigo_convite: string
          descricao: string
          duracao_dias: number
          id: string
          titulo: string
          total_inscritos: number
          unidade_nome: string
        }[]
      }
      buscar_similar_cache: {
        Args: {
          p_embedding: string
          p_limite_resultados?: number
          p_limite_similaridade?: number
        }
        Returns: {
          id: string
          resposta: string
          similaridade: number
        }[]
      }
      consumir_rate_limit: {
        Args: { p_tokens?: number; p_user_id: string }
        Returns: undefined
      }
      detectar_categoria_pergunta: {
        Args: { p_pergunta: string }
        Returns: string
      }
      gerar_plano_biblia_1_ano: {
        Args: { p_data_inicio?: string; p_plano_id: string }
        Returns: number
      }
      gerar_plano_livros: {
        Args: {
          p_capitulos_por_dia?: number
          p_data_inicio?: string
          p_livros_abreviacoes: string[]
          p_plano_id: string
        }
        Returns: number
      }
      get_user_unidade_id: { Args: never; Returns: string }
      incrementar_hit_cache: {
        Args: { p_cache_id: string }
        Returns: undefined
      }
      is_master_of: { Args: { check_unidade_id: string }; Returns: boolean }
      is_super_user: { Args: never; Returns: boolean }
      normalizar_texto: { Args: { texto: string }; Returns: string }
      salvar_cache_versiculo: {
        Args: {
          p_capitulo: number
          p_livro: string
          p_modelo?: string
          p_resposta: string
          p_tipo: string
          p_tokens?: number
          p_versiculo_fim: number
          p_versiculo_inicio: number
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
      verificar_rate_limit: {
        Args: { p_unidade_id: string; p_user_id: string }
        Returns: {
          limite_restante: number
          limite_total: number
          permitido: boolean
          proxima_liberacao: string
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
