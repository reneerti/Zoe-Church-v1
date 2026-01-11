-- ============================================
-- CACHE GLOBAL DE IA (sem unidade_id)
-- ============================================

-- 1. Atualizar tabela ai_cache_semantico para cache global
-- Adicionar coluna categoria e ajustar estrutura

-- Adicionar coluna categoria se não existir
ALTER TABLE ai_cache_semantico 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);

-- Adicionar coluna contexto se não existir  
ALTER TABLE ai_cache_semantico
ADD COLUMN IF NOT EXISTS contexto JSONB;

-- Adicionar coluna expires_at se não existir
ALTER TABLE ai_cache_semantico
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '365 days';

-- Renomear hash_pergunta para pergunta_hash se existir com nome diferente
-- (já existe como hash_pergunta, manter compatibilidade)

-- ============================================
-- FUNÇÃO PARA BUSCAR CACHE SIMILAR COM EMBEDDINGS
-- ============================================

-- Atualizar função de busca similar para retornar mais informações
CREATE OR REPLACE FUNCTION buscar_cache_similar_global(
    p_embedding vector,
    p_similaridade_minima float DEFAULT 0.92,
    p_limite int DEFAULT 1,
    p_categoria text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    pergunta_original text,
    resposta text,
    similaridade float,
    categoria varchar(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.pergunta_original,
        c.resposta,
        (1 - (c.embedding <=> p_embedding))::float AS similaridade,
        c.categoria
    FROM ai_cache_semantico c
    WHERE 
        c.embedding IS NOT NULL
        AND (1 - (c.embedding <=> p_embedding)) >= p_similaridade_minima
        AND (p_categoria IS NULL OR c.categoria = p_categoria)
        AND (c.expires_at IS NULL OR c.expires_at > NOW())
    ORDER BY c.embedding <=> p_embedding
    LIMIT p_limite;
END;
$$;

-- ============================================
-- FUNÇÃO PARA DETECTAR CATEGORIA DA PERGUNTA
-- ============================================
CREATE OR REPLACE FUNCTION detectar_categoria_pergunta(p_pergunta text)
RETURNS varchar(50)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_pergunta_lower text;
BEGIN
    v_pergunta_lower := lower(p_pergunta);
    
    -- Detectar categoria baseada em palavras-chave
    IF v_pergunta_lower ~ '(deus|senhor|jeová|pai celestial|criador)' THEN
        RETURN 'deus';
    ELSIF v_pergunta_lower ~ '(jesus|cristo|messias|salvador|filho de deus)' THEN
        RETURN 'jesus';
    ELSIF v_pergunta_lower ~ '(espírito santo|espírito|consolador|paracleto)' THEN
        RETURN 'espirito_santo';
    ELSIF v_pergunta_lower ~ '(salvação|salvo|salvar|redenção|redimir)' THEN
        RETURN 'salvacao';
    ELSIF v_pergunta_lower ~ '(oração|orar|rezar|prece|súplica)' THEN
        RETURN 'oracao';
    ELSIF v_pergunta_lower ~ '(fé|crer|acreditar|crença|confiar)' THEN
        RETURN 'fe';
    ELSIF v_pergunta_lower ~ '(amor|amar|caridade|compaixão)' THEN
        RETURN 'amor';
    ELSIF v_pergunta_lower ~ '(pecado|pecar|tentação|perdão|perdoar)' THEN
        RETURN 'pecado';
    ELSIF v_pergunta_lower ~ '(céu|paraíso|vida eterna|eternidade|morte)' THEN
        RETURN 'escatologia';
    ELSIF v_pergunta_lower ~ '(igreja|comunhão|corpo de cristo|congregação)' THEN
        RETURN 'igreja';
    ELSIF v_pergunta_lower ~ '(profecia|profeta|apocalipse|revelação|fim dos tempos)' THEN
        RETURN 'profecia';
    ELSIF v_pergunta_lower ~ '(gênesis|êxodo|criação|dilúvio|moisés|abraão)' THEN
        RETURN 'antigo_testamento';
    ELSIF v_pergunta_lower ~ '(evangelho|apóstolo|paulo|pedro|mateus|marcos|lucas|joão)' THEN
        RETURN 'novo_testamento';
    ELSE
        RETURN 'geral';
    END IF;
END;
$$;

-- ============================================
-- ÍNDICE PARA BUSCA VETORIAL (se não existir)
-- ============================================
DO $$
BEGIN
    -- Verificar se o índice já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_cache_semantico_embedding_cosine'
    ) THEN
        -- Criar índice IVFFlat para busca vetorial
        CREATE INDEX idx_cache_semantico_embedding_cosine 
        ON ai_cache_semantico USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
    END IF;
END $$;

-- ============================================
-- ATUALIZAR TABELA AI_CACHE_VERSICULOS (GLOBAL)
-- ============================================

-- Criar tabela de cache para versículos específicos (se não existir)
CREATE TABLE IF NOT EXISTS ai_cache_versiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Chave única
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Versículo
    livro VARCHAR(50) NOT NULL,
    capitulo INTEGER NOT NULL,
    versiculo_inicio INTEGER NOT NULL,
    versiculo_fim INTEGER,
    
    -- Tipo de pergunta
    tipo VARCHAR(50) NOT NULL,  -- significado, contexto, aplicacao, devocional
    
    -- Resposta
    resposta TEXT NOT NULL,
    
    -- Metadata
    modelo VARCHAR(50),
    tokens_usados INTEGER,
    
    -- Estatísticas de uso
    hits INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    
    -- Controle (sem expiração - Bíblia é eterna)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por versículo
CREATE INDEX IF NOT EXISTS idx_cache_versiculos_ref 
ON ai_cache_versiculos(livro, capitulo, versiculo_inicio);

-- ============================================
-- FUNÇÃO PARA BUSCAR CACHE DE VERSÍCULO
-- ============================================
CREATE OR REPLACE FUNCTION buscar_cache_versiculo(
    p_livro varchar,
    p_capitulo int,
    p_versiculo_inicio int,
    p_versiculo_fim int DEFAULT NULL,
    p_tipo varchar DEFAULT 'significado'
)
RETURNS TABLE (
    id uuid,
    resposta text,
    hits int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cache_key varchar;
BEGIN
    -- Construir cache_key
    v_cache_key := UPPER(p_livro) || ':' || p_tipo || ':' || p_capitulo || ':' || p_versiculo_inicio;
    IF p_versiculo_fim IS NOT NULL THEN
        v_cache_key := v_cache_key || '-' || p_versiculo_fim;
    END IF;
    
    RETURN QUERY
    SELECT c.id, c.resposta, c.hits
    FROM ai_cache_versiculos c
    WHERE c.cache_key = v_cache_key;
    
    -- Incrementar hits se encontrou
    UPDATE ai_cache_versiculos
    SET hits = hits + 1, last_hit_at = NOW()
    WHERE cache_key = v_cache_key;
END;
$$;

-- ============================================
-- FUNÇÃO PARA SALVAR CACHE DE VERSÍCULO
-- ============================================
CREATE OR REPLACE FUNCTION salvar_cache_versiculo(
    p_livro varchar,
    p_capitulo int,
    p_versiculo_inicio int,
    p_versiculo_fim int,
    p_tipo varchar,
    p_resposta text,
    p_modelo varchar DEFAULT NULL,
    p_tokens int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cache_key varchar;
    v_id uuid;
BEGIN
    -- Construir cache_key
    v_cache_key := UPPER(p_livro) || ':' || p_tipo || ':' || p_capitulo || ':' || p_versiculo_inicio;
    IF p_versiculo_fim IS NOT NULL THEN
        v_cache_key := v_cache_key || '-' || p_versiculo_fim;
    END IF;
    
    INSERT INTO ai_cache_versiculos (
        cache_key, livro, capitulo, versiculo_inicio, versiculo_fim,
        tipo, resposta, modelo, tokens_usados
    ) VALUES (
        v_cache_key, UPPER(p_livro), p_capitulo, p_versiculo_inicio, p_versiculo_fim,
        p_tipo, p_resposta, p_modelo, p_tokens
    )
    ON CONFLICT (cache_key) DO UPDATE SET
        resposta = EXCLUDED.resposta,
        modelo = EXCLUDED.modelo,
        tokens_usados = EXCLUDED.tokens_usados
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;