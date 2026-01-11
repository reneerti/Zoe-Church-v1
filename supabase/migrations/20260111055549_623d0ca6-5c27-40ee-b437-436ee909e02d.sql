-- =========================================
-- SISTEMA DE AUDITORIA COMPLETO
-- =========================================

-- 1. Função genérica de audit para triggers
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_user_role text;
    v_unidade_id uuid;
    v_old_data jsonb;
    v_new_data jsonb;
    v_acao text;
BEGIN
    -- Obter user_id atual
    v_user_id := auth.uid();
    
    -- Obter email do usuário
    SELECT email INTO v_user_email 
    FROM auth.users WHERE id = v_user_id;
    
    -- Determinar role do usuário
    IF EXISTS (SELECT 1 FROM public.super_users WHERE user_id = v_user_id) THEN
        v_user_role := 'super_user';
    ELSIF EXISTS (SELECT 1 FROM public.masters WHERE user_id = v_user_id AND is_active = true) THEN
        v_user_role := 'master';
    ELSE
        v_user_role := 'usuario';
    END IF;
    
    -- Obter unidade_id
    v_unidade_id := public.get_user_unidade_id();
    
    -- Determinar ação
    IF TG_OP = 'INSERT' THEN
        v_acao := 'criar';
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_acao := 'atualizar';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_acao := 'deletar';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- Inserir no audit_log
    INSERT INTO public.audit_log (
        user_id,
        user_email,
        user_role,
        acao,
        tabela,
        registro_id,
        dados_anteriores,
        dados_novos,
        unidade_id,
        descricao
    ) VALUES (
        v_user_id,
        v_user_email,
        v_user_role,
        v_acao,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (OLD.id)::uuid
            ELSE (NEW.id)::uuid
        END,
        v_old_data,
        v_new_data,
        v_unidade_id,
        TG_OP || ' em ' || TG_TABLE_NAME
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Triggers de auditoria em tabelas críticas

-- Trigger para unidades
DROP TRIGGER IF EXISTS audit_unidades ON public.unidades;
CREATE TRIGGER audit_unidades
    AFTER INSERT OR UPDATE OR DELETE ON public.unidades
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para masters
DROP TRIGGER IF EXISTS audit_masters ON public.masters;
CREATE TRIGGER audit_masters
    AFTER INSERT OR UPDATE OR DELETE ON public.masters
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para usuarios
DROP TRIGGER IF EXISTS audit_usuarios ON public.usuarios;
CREATE TRIGGER audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para convites
DROP TRIGGER IF EXISTS audit_convites ON public.convites;
CREATE TRIGGER audit_convites
    AFTER INSERT OR UPDATE OR DELETE ON public.convites
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para posts (moderação)
DROP TRIGGER IF EXISTS audit_posts ON public.posts;
CREATE TRIGGER audit_posts
    AFTER INSERT OR UPDATE OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para comentarios (moderação)
DROP TRIGGER IF EXISTS audit_comentarios ON public.comentarios;
CREATE TRIGGER audit_comentarios
    AFTER INSERT OR UPDATE OR DELETE ON public.comentarios
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para scores
DROP TRIGGER IF EXISTS audit_scores ON public.scores;
CREATE TRIGGER audit_scores
    AFTER INSERT OR UPDATE OR DELETE ON public.scores
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- =========================================
-- CACHE SEMÂNTICO COM EMBEDDINGS
-- =========================================

-- Habilitar extensão vector (se não existir)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de cache semântico com embeddings
CREATE TABLE IF NOT EXISTS public.ai_cache_semantico (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pergunta_original text NOT NULL,
    pergunta_normalizada text NOT NULL,
    hash_pergunta text NOT NULL,
    embedding vector(1536),
    resposta text NOT NULL,
    modelo text DEFAULT 'gpt-3.5-turbo',
    tokens_usados integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    hits integer DEFAULT 0,
    last_hit_at timestamptz,
    contexto jsonb DEFAULT '{}'::jsonb,
    UNIQUE(hash_pergunta)
);

-- Índice para busca por similaridade
CREATE INDEX IF NOT EXISTS idx_ai_cache_semantico_embedding 
ON public.ai_cache_semantico 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para busca por hash
CREATE INDEX IF NOT EXISTS idx_ai_cache_semantico_hash 
ON public.ai_cache_semantico (hash_pergunta);

-- RLS para ai_cache_semantico
ALTER TABLE public.ai_cache_semantico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache semantico" 
ON public.ai_cache_semantico 
FOR SELECT USING (true);

CREATE POLICY "Super users manage cache semantico" 
ON public.ai_cache_semantico 
FOR ALL USING (is_super_user());

-- Função para buscar similar no cache semântico
CREATE OR REPLACE FUNCTION public.buscar_similar_cache(
    p_embedding vector(1536),
    p_limite_similaridade float DEFAULT 0.92,
    p_limite_resultados int DEFAULT 1
)
RETURNS TABLE (
    id uuid,
    resposta text,
    similaridade float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.resposta,
        1 - (c.embedding <=> p_embedding) as similaridade
    FROM public.ai_cache_semantico c
    WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_embedding) >= p_limite_similaridade
    ORDER BY c.embedding <=> p_embedding
    LIMIT p_limite_resultados;
END;
$$;

-- Função para atualizar hits do cache
CREATE OR REPLACE FUNCTION public.incrementar_hit_cache(p_cache_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.ai_cache_semantico
    SET hits = hits + 1,
        last_hit_at = now()
    WHERE id = p_cache_id;
END;
$$;

-- =========================================
-- RATE LIMIT MELHORADO
-- =========================================

-- Função para verificar e atualizar rate limit
CREATE OR REPLACE FUNCTION public.verificar_rate_limit(
    p_user_id uuid,
    p_unidade_id uuid
)
RETURNS TABLE (
    permitido boolean,
    limite_restante integer,
    limite_total integer,
    proxima_liberacao timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limite_dia integer;
    v_requisicoes_hoje integer;
    v_data_atual date;
BEGIN
    v_data_atual := CURRENT_DATE;
    
    -- Obter limite da unidade
    SELECT COALESCE(ai_limite_por_usuario_dia, 50) INTO v_limite_dia
    FROM public.unidades
    WHERE id = p_unidade_id;
    
    -- Obter/criar registro de rate limit
    INSERT INTO public.ai_rate_limit (user_id, unidade_id, data, requisicoes_hoje)
    VALUES (p_user_id, p_unidade_id, v_data_atual, 0)
    ON CONFLICT (user_id, data) 
    DO NOTHING;
    
    -- Obter requisições de hoje
    SELECT requisicoes_hoje INTO v_requisicoes_hoje
    FROM public.ai_rate_limit
    WHERE user_id = p_user_id AND data = v_data_atual;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        v_requisicoes_hoje < v_limite_dia,
        v_limite_dia - v_requisicoes_hoje,
        v_limite_dia,
        (v_data_atual + interval '1 day')::timestamptz;
END;
$$;

-- Função para consumir do rate limit
CREATE OR REPLACE FUNCTION public.consumir_rate_limit(
    p_user_id uuid,
    p_tokens integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.ai_rate_limit
    SET requisicoes_hoje = requisicoes_hoje + 1,
        tokens_hoje = tokens_hoje + p_tokens,
        ultima_requisicao = now()
    WHERE user_id = p_user_id AND data = CURRENT_DATE;
END;
$$;

-- Adicionar constraint único para rate_limit por usuário/dia
ALTER TABLE public.ai_rate_limit 
DROP CONSTRAINT IF EXISTS ai_rate_limit_user_data_unique;

ALTER TABLE public.ai_rate_limit 
ADD CONSTRAINT ai_rate_limit_user_data_unique UNIQUE (user_id, data);

-- =========================================
-- METRICAS DIÁRIAS - Função de agregação
-- =========================================

CREATE OR REPLACE FUNCTION public.atualizar_metricas_diarias(p_unidade_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_data_atual date;
BEGIN
    v_data_atual := CURRENT_DATE;
    
    INSERT INTO public.metricas_diarias (
        unidade_id,
        data,
        total_usuarios,
        usuarios_ativos,
        novos_usuarios,
        logins,
        capitulos_lidos,
        versiculos_marcados,
        devocionais_criados,
        devocionais_lidos,
        posts_criados,
        curtidas,
        comentarios,
        consultas_ia,
        consultas_ia_cache
    )
    SELECT 
        p_unidade_id,
        v_data_atual,
        (SELECT COUNT(*) FROM public.usuarios WHERE unidade_id = p_unidade_id AND is_active = true),
        (SELECT COUNT(*) FROM public.usuarios WHERE unidade_id = p_unidade_id AND is_active = true AND last_access > now() - interval '7 days'),
        (SELECT COUNT(*) FROM public.usuarios WHERE unidade_id = p_unidade_id AND DATE(created_at) = v_data_atual),
        (SELECT COUNT(*) FROM public.sessoes WHERE unidade_id = p_unidade_id AND DATE(inicio) = v_data_atual),
        0, -- capitulos_lidos (calcular de reading_progress)
        0, -- versiculos_marcados (calcular de verse_highlights)
        0, -- devocionais_criados
        0, -- devocionais_lidos
        (SELECT COUNT(*) FROM public.posts WHERE unidade_id = p_unidade_id AND DATE(created_at) = v_data_atual),
        (SELECT COUNT(*) FROM public.curtidas WHERE unidade_id = p_unidade_id AND DATE(created_at) = v_data_atual),
        (SELECT COUNT(*) FROM public.comentarios WHERE unidade_id = p_unidade_id AND DATE(created_at) = v_data_atual),
        (SELECT COUNT(*) FROM public.ai_consumo WHERE unidade_id = p_unidade_id AND DATE(created_at) = v_data_atual AND foi_cache = false),
        (SELECT COUNT(*) FROM public.ai_consumo WHERE unidade_id = p_unidade_id AND DATE(created_at) = v_data_atual AND foi_cache = true)
    ON CONFLICT (unidade_id, data) 
    DO UPDATE SET
        total_usuarios = EXCLUDED.total_usuarios,
        usuarios_ativos = EXCLUDED.usuarios_ativos,
        novos_usuarios = EXCLUDED.novos_usuarios,
        logins = EXCLUDED.logins,
        posts_criados = EXCLUDED.posts_criados,
        curtidas = EXCLUDED.curtidas,
        comentarios = EXCLUDED.comentarios,
        consultas_ia = EXCLUDED.consultas_ia,
        consultas_ia_cache = EXCLUDED.consultas_ia_cache;
END;
$$;

-- Constraint único para métricas diárias
ALTER TABLE public.metricas_diarias 
DROP CONSTRAINT IF EXISTS metricas_diarias_unidade_data_unique;

ALTER TABLE public.metricas_diarias 
ADD CONSTRAINT metricas_diarias_unidade_data_unique UNIQUE (unidade_id, data);