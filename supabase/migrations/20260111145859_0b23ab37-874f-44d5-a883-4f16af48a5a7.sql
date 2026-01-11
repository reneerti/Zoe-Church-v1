-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ADICIONAR COLUNAS NECESSÁRIAS À bible_verses
-- ============================================
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS texto_normalizado TEXT;
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS texto_tsv tsvector;

-- Função para normalizar texto
CREATE OR REPLACE FUNCTION normalizar_texto(texto TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(unaccent(trim(texto)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar textos normalizados existentes
UPDATE bible_verses 
SET texto_normalizado = normalizar_texto(text)
WHERE texto_normalizado IS NULL;

-- Atualizar tsvector existentes
UPDATE bible_verses 
SET texto_tsv = to_tsvector('portuguese', text)
WHERE texto_tsv IS NULL;

-- Trigger para manter sincronizado
CREATE OR REPLACE FUNCTION atualizar_texto_normalizado()
RETURNS TRIGGER AS $$
BEGIN
  NEW.texto_normalizado := normalizar_texto(NEW.text);
  NEW.texto_tsv := to_tsvector('portuguese', NEW.text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_texto_normalizado ON bible_verses;
CREATE TRIGGER trg_atualizar_texto_normalizado
BEFORE INSERT OR UPDATE OF text ON bible_verses
FOR EACH ROW
EXECUTE FUNCTION atualizar_texto_normalizado();

-- ============================================
-- ÍNDICES PARA BUSCA
-- ============================================
CREATE INDEX IF NOT EXISTS idx_verses_texto_normalizado ON bible_verses(texto_normalizado);
CREATE INDEX IF NOT EXISTS idx_verses_tsv ON bible_verses USING GIN(texto_tsv);
CREATE INDEX IF NOT EXISTS idx_verses_trgm ON bible_verses USING GIN(texto_normalizado gin_trgm_ops);

-- ============================================
-- BUSCA EXATA (frase completa)
-- ============================================
CREATE OR REPLACE FUNCTION buscar_biblia_exato(
  termo_busca TEXT,
  versao_codigo VARCHAR DEFAULT NULL,
  livro_id_param UUID DEFAULT NULL,
  testamento_param VARCHAR DEFAULT NULL,
  limite INTEGER DEFAULT 50,
  pagina INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  versao VARCHAR,
  livro VARCHAR,
  livro_abrev VARCHAR,
  capitulo INTEGER,
  versiculo INTEGER,
  texto TEXT,
  referencia TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  termo_normalizado TEXT;
BEGIN
  termo_normalizado := normalizar_texto(termo_busca);
  
  RETURN QUERY
  SELECT
    bv.id,
    ver.code AS versao,
    l.name AS livro,
    l.abbreviation AS livro_abrev,
    bv.chapter AS capitulo,
    bv.verse AS versiculo,
    bv.text AS texto,
    l.abbreviation || ' ' || bv.chapter || ':' || bv.verse AS referencia
  FROM bible_verses bv
  JOIN bible_versions ver ON ver.id = bv.version_id
  JOIN bible_books l ON l.id = bv.book_id
  WHERE
    bv.texto_normalizado ILIKE '%' || termo_normalizado || '%'
    AND (versao_codigo IS NULL OR ver.code = versao_codigo)
    AND (livro_id_param IS NULL OR l.id = livro_id_param)
    AND (testamento_param IS NULL OR l.testament = testamento_param)
  ORDER BY l.book_number, bv.chapter, bv.verse
  LIMIT limite
  OFFSET pagina * limite;
END;
$$;

-- ============================================
-- BUSCA FULL-TEXT (palavras)
-- ============================================
CREATE OR REPLACE FUNCTION buscar_biblia_palavras(
  termo_busca TEXT,
  modo VARCHAR DEFAULT 'todas',
  versao_codigo VARCHAR DEFAULT NULL,
  livro_id_param UUID DEFAULT NULL,
  testamento_param VARCHAR DEFAULT NULL,
  limite INTEGER DEFAULT 50,
  pagina INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  versao VARCHAR,
  livro VARCHAR,
  livro_abrev VARCHAR,
  capitulo INTEGER,
  versiculo INTEGER,
  texto TEXT,
  referencia TEXT,
  relevancia FLOAT
)
LANGUAGE plpgsql AS $$
DECLARE
  tsquery_str TEXT;
  operador TEXT;
BEGIN
  operador := CASE WHEN modo = 'qualquer' THEN ' | ' ELSE ' & ' END;
  tsquery_str := array_to_string(regexp_split_to_array(trim(termo_busca), '\s+'), operador);
  
  RETURN QUERY
  SELECT
    bv.id,
    ver.code AS versao,
    l.name AS livro,
    l.abbreviation AS livro_abrev,
    bv.chapter AS capitulo,
    bv.verse AS versiculo,
    bv.text AS texto,
    l.abbreviation || ' ' || bv.chapter || ':' || bv.verse AS referencia,
    ts_rank(bv.texto_tsv, to_tsquery('portuguese', tsquery_str))::FLOAT AS relevancia
  FROM bible_verses bv
  JOIN bible_versions ver ON ver.id = bv.version_id
  JOIN bible_books l ON l.id = bv.book_id
  WHERE
    bv.texto_tsv @@ to_tsquery('portuguese', tsquery_str)
    AND (versao_codigo IS NULL OR ver.code = versao_codigo)
    AND (livro_id_param IS NULL OR l.id = livro_id_param)
    AND (testamento_param IS NULL OR l.testament = testamento_param)
  ORDER BY relevancia DESC, l.book_number, bv.chapter, bv.verse
  LIMIT limite
  OFFSET pagina * limite;
END;
$$;

-- ============================================
-- BUSCA COM PREFIXO (autocomplete)
-- ============================================
CREATE OR REPLACE FUNCTION buscar_biblia_prefixo(
  prefixo TEXT,
  versao_codigo VARCHAR DEFAULT NULL,
  limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  versao VARCHAR,
  livro VARCHAR,
  livro_abrev VARCHAR,
  capitulo INTEGER,
  versiculo INTEGER,
  texto TEXT,
  referencia TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  prefixo_normalizado TEXT;
BEGIN
  prefixo_normalizado := normalizar_texto(prefixo);
  
  RETURN QUERY
  SELECT
    bv.id,
    ver.code AS versao,
    l.name AS livro,
    l.abbreviation AS livro_abrev,
    bv.chapter AS capitulo,
    bv.verse AS versiculo,
    bv.text AS texto,
    l.abbreviation || ' ' || bv.chapter || ':' || bv.verse AS referencia
  FROM bible_verses bv
  JOIN bible_versions ver ON ver.id = bv.version_id
  JOIN bible_books l ON l.id = bv.book_id
  WHERE
    bv.texto_tsv @@ to_tsquery('portuguese', prefixo_normalizado || ':*')
    AND (versao_codigo IS NULL OR ver.code = versao_codigo)
  ORDER BY l.book_number, bv.chapter, bv.verse
  LIMIT limite;
END;
$$;

-- ============================================
-- BUSCA SIMILAR (fuzzy - erros de digitação)
-- ============================================
CREATE OR REPLACE FUNCTION buscar_biblia_similar(
  termo_busca TEXT,
  similaridade_minima FLOAT DEFAULT 0.3,
  versao_codigo VARCHAR DEFAULT NULL,
  limite INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  versao VARCHAR,
  livro VARCHAR,
  livro_abrev VARCHAR,
  capitulo INTEGER,
  versiculo INTEGER,
  texto TEXT,
  referencia TEXT,
  similaridade FLOAT
)
LANGUAGE plpgsql AS $$
DECLARE
  termo_normalizado TEXT;
BEGIN
  termo_normalizado := normalizar_texto(termo_busca);
  
  RETURN QUERY
  SELECT
    bv.id,
    ver.code AS versao,
    l.name AS livro,
    l.abbreviation AS livro_abrev,
    bv.chapter AS capitulo,
    bv.verse AS versiculo,
    bv.text AS texto,
    l.abbreviation || ' ' || bv.chapter || ':' || bv.verse AS referencia,
    similarity(bv.texto_normalizado, termo_normalizado)::FLOAT AS similaridade
  FROM bible_verses bv
  JOIN bible_versions ver ON ver.id = bv.version_id
  JOIN bible_books l ON l.id = bv.book_id
  WHERE
    bv.texto_normalizado % termo_normalizado
    AND similarity(bv.texto_normalizado, termo_normalizado) >= similaridade_minima
    AND (versao_codigo IS NULL OR ver.code = versao_codigo)
  ORDER BY similaridade DESC
  LIMIT limite;
END;
$$;

-- ============================================
-- PLANOS DE LEITURA (criados pelo Master)
-- ============================================
CREATE TABLE IF NOT EXISTS planos_leitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  
  tipo VARCHAR(50) NOT NULL DEFAULT 'personalizado',
  duracao_dias INTEGER NOT NULL DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  leituras_por_dia INTEGER DEFAULT 1,
  inclui_sabado BOOLEAN DEFAULT true,
  inclui_domingo BOOLEAN DEFAULT true,
  
  status VARCHAR(20) DEFAULT 'rascunho',
  publicado_em TIMESTAMPTZ,
  
  total_inscritos INTEGER DEFAULT 0,
  total_concluidos INTEGER DEFAULT 0,
  
  criado_por UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ITENS DO PLANO (cada leitura do dia)
-- ============================================
CREATE TABLE IF NOT EXISTS planos_leitura_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES planos_leitura(id) ON DELETE CASCADE,
  
  dia_numero INTEGER NOT NULL,
  data_prevista DATE,
  
  livro_id UUID REFERENCES bible_books(id),
  capitulo_inicio INTEGER NOT NULL,
  capitulo_fim INTEGER,
  versiculo_inicio INTEGER,
  versiculo_fim INTEGER,
  
  referencia_texto VARCHAR(100) NOT NULL,
  titulo_dia VARCHAR(255),
  
  ordem INTEGER DEFAULT 1,
  
  UNIQUE(plano_id, dia_numero, ordem)
);

-- ============================================
-- INSCRIÇÕES DOS USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS planos_leitura_inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES planos_leitura(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  
  data_inicio_usuario DATE NOT NULL,
  data_fim_prevista DATE,
  
  total_itens INTEGER DEFAULT 0,
  itens_concluidos INTEGER DEFAULT 0,
  percentual_concluido DECIMAL(5, 2) DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'ativo',
  
  inscrito_em TIMESTAMPTZ DEFAULT now(),
  concluido_em TIMESTAMPTZ,
  
  UNIQUE(plano_id, user_id)
);

-- ============================================
-- PROGRESSO (marcação de leituras)
-- ============================================
CREATE TABLE IF NOT EXISTS planos_leitura_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID REFERENCES planos_leitura_inscricoes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES planos_leitura_itens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  concluido BOOLEAN DEFAULT false,
  fonte VARCHAR(20),
  
  marcado_em TIMESTAMPTZ DEFAULT now(),
  anotacao TEXT,
  
  UNIQUE(inscricao_id, item_id)
);

-- ============================================
-- TEMPLATES DE PLANOS (pré-definidos)
-- ============================================
CREATE TABLE IF NOT EXISTS planos_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  duracao_dias INTEGER NOT NULL,
  leituras JSONB NOT NULL DEFAULT '[]',
  categoria VARCHAR(50),
  nivel VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir templates padrão
INSERT INTO planos_templates (titulo, descricao, tipo, duracao_dias, categoria, nivel, leituras) 
VALUES
  ('Bíblia em 1 Ano', 'Leia toda a Bíblia em 365 dias, cerca de 3-4 capítulos por dia', 'anual', 365, 'cronologico', 'intermediario', '[]'),
  ('Novo Testamento em 90 Dias', 'Leia todo o Novo Testamento em 3 meses', 'trimestral', 90, 'livro_completo', 'iniciante', '[]'),
  ('Salmos e Provérbios', 'Leia Salmos e Provérbios em 30 dias', 'mensal', 30, 'devocional', 'iniciante', '[]'),
  ('Evangelhos', 'Leia os 4 Evangelhos em 4 semanas', 'mensal', 28, 'tematico', 'iniciante', '[]')
ON CONFLICT DO NOTHING;

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_planos_unidade ON planos_leitura(unidade_id);
CREATE INDEX IF NOT EXISTS idx_planos_status ON planos_leitura(status);
CREATE INDEX IF NOT EXISTS idx_planos_itens_plano ON planos_leitura_itens(plano_id);
CREATE INDEX IF NOT EXISTS idx_planos_itens_dia ON planos_leitura_itens(plano_id, dia_numero);
CREATE INDEX IF NOT EXISTS idx_inscricoes_user ON planos_leitura_inscricoes(user_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_plano ON planos_leitura_inscricoes(plano_id);
CREATE INDEX IF NOT EXISTS idx_progresso_inscricao ON planos_leitura_progresso(inscricao_id);
CREATE INDEX IF NOT EXISTS idx_progresso_user ON planos_leitura_progresso(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE planos_leitura ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_leitura_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_leitura_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_leitura_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_templates ENABLE ROW LEVEL SECURITY;

-- Planos de leitura
CREATE POLICY "Masters manage planos" ON planos_leitura
FOR ALL USING (is_master_of(unidade_id));

CREATE POLICY "Users view published planos" ON planos_leitura
FOR SELECT USING (belongs_to_unidade(unidade_id) AND status = 'publicado');

-- Itens do plano
CREATE POLICY "Anyone view planos_itens" ON planos_leitura_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM planos_leitura p
    WHERE p.id = planos_leitura_itens.plano_id
    AND (is_master_of(p.unidade_id) OR (belongs_to_unidade(p.unidade_id) AND p.status = 'publicado'))
  )
);

CREATE POLICY "Masters manage planos_itens" ON planos_leitura_itens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM planos_leitura p
    WHERE p.id = planos_leitura_itens.plano_id
    AND is_master_of(p.unidade_id)
  )
);

-- Inscrições
CREATE POLICY "Users manage own inscricoes" ON planos_leitura_inscricoes
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Masters view unidade inscricoes" ON planos_leitura_inscricoes
FOR SELECT USING (is_master_of(unidade_id));

-- Progresso
CREATE POLICY "Users manage own progresso" ON planos_leitura_progresso
FOR ALL USING (user_id = auth.uid());

-- Templates (públicos)
CREATE POLICY "Anyone view templates" ON planos_templates
FOR SELECT USING (is_active = true);

-- ============================================
-- FUNÇÃO GERAR PLANO BÍBLIA EM 1 ANO
-- ============================================
CREATE OR REPLACE FUNCTION gerar_plano_biblia_1_ano(
  p_plano_id UUID,
  p_data_inicio DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_livro RECORD;
  v_dia INTEGER := 1;
  v_capitulo INTEGER;
  v_capitulos_por_dia INTEGER := 4;
  v_caps_hoje INTEGER;
  v_cap_fim INTEGER;
  v_data_atual DATE := p_data_inicio;
  v_itens_criados INTEGER := 0;
BEGIN
  FOR v_livro IN (
    SELECT id, name, abbreviation, chapters_count, book_number
    FROM bible_books
    ORDER BY book_number
  ) LOOP
    v_capitulo := 1;
    
    WHILE v_capitulo <= v_livro.chapters_count AND v_dia <= 365 LOOP
      v_caps_hoje := LEAST(v_capitulos_por_dia, v_livro.chapters_count - v_capitulo + 1);
      v_cap_fim := v_capitulo + v_caps_hoje - 1;
      
      INSERT INTO planos_leitura_itens (
        plano_id,
        dia_numero,
        data_prevista,
        livro_id,
        capitulo_inicio,
        capitulo_fim,
        referencia_texto,
        ordem
      ) VALUES (
        p_plano_id,
        v_dia,
        v_data_atual,
        v_livro.id,
        v_capitulo,
        CASE WHEN v_cap_fim > v_capitulo THEN v_cap_fim ELSE NULL END,
        v_livro.abbreviation || ' ' || v_capitulo || 
          CASE WHEN v_cap_fim > v_capitulo THEN '-' || v_cap_fim ELSE '' END,
        1
      );
      
      v_itens_criados := v_itens_criados + 1;
      v_capitulo := v_cap_fim + 1;
      v_dia := v_dia + 1;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
  END LOOP;
  
  UPDATE planos_leitura SET
    data_inicio = p_data_inicio,
    data_fim = p_data_inicio + (v_dia - 2) * INTERVAL '1 day',
    duracao_dias = v_dia - 1,
    updated_at = now()
  WHERE id = p_plano_id;
  
  RETURN v_itens_criados;
END;
$$;

-- ============================================
-- FUNÇÃO GERAR PLANO PERSONALIZADO
-- ============================================
CREATE OR REPLACE FUNCTION gerar_plano_livros(
  p_plano_id UUID,
  p_livros_abreviacoes TEXT[],
  p_data_inicio DATE DEFAULT CURRENT_DATE,
  p_capitulos_por_dia INTEGER DEFAULT 2
)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_livro RECORD;
  v_dia INTEGER := 1;
  v_capitulo INTEGER;
  v_cap_fim INTEGER;
  v_itens_criados INTEGER := 0;
BEGIN
  FOR v_livro IN (
    SELECT id, name, abbreviation, chapters_count, book_number
    FROM bible_books
    WHERE abbreviation = ANY(p_livros_abreviacoes)
    ORDER BY book_number
  ) LOOP
    v_capitulo := 1;
    
    WHILE v_capitulo <= v_livro.chapters_count LOOP
      v_cap_fim := LEAST(v_capitulo + p_capitulos_por_dia - 1, v_livro.chapters_count);
      
      INSERT INTO planos_leitura_itens (
        plano_id,
        dia_numero,
        data_prevista,
        livro_id,
        capitulo_inicio,
        capitulo_fim,
        referencia_texto,
        ordem
      ) VALUES (
        p_plano_id,
        v_dia,
        p_data_inicio + (v_dia - 1) * INTERVAL '1 day',
        v_livro.id,
        v_capitulo,
        CASE WHEN v_cap_fim > v_capitulo THEN v_cap_fim ELSE NULL END,
        v_livro.abbreviation || ' ' || v_capitulo || 
          CASE WHEN v_cap_fim > v_capitulo THEN '-' || v_cap_fim ELSE '' END,
        1
      );
      
      v_itens_criados := v_itens_criados + 1;
      v_capitulo := v_cap_fim + 1;
      v_dia := v_dia + 1;
    END LOOP;
  END LOOP;
  
  UPDATE planos_leitura SET
    data_inicio = p_data_inicio,
    data_fim = p_data_inicio + (v_dia - 2) * INTERVAL '1 day',
    duracao_dias = v_dia - 1,
    updated_at = now()
  WHERE id = p_plano_id;
  
  RETURN v_itens_criados;
END;
$$;

-- ============================================
-- ATUALIZAR PROGRESSO DA INSCRIÇÃO
-- ============================================
CREATE OR REPLACE FUNCTION atualizar_progresso_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  v_inscricao_id UUID;
  v_total INTEGER;
  v_concluidos INTEGER;
BEGIN
  v_inscricao_id := COALESCE(NEW.inscricao_id, OLD.inscricao_id);
  
  SELECT COUNT(*) INTO v_total
  FROM planos_leitura_itens i
  JOIN planos_leitura_inscricoes ins ON ins.plano_id = i.plano_id
  WHERE ins.id = v_inscricao_id;
  
  SELECT COUNT(*) INTO v_concluidos
  FROM planos_leitura_progresso
  WHERE inscricao_id = v_inscricao_id AND concluido = true;
  
  UPDATE planos_leitura_inscricoes
  SET 
    total_itens = v_total,
    itens_concluidos = v_concluidos,
    percentual_concluido = CASE WHEN v_total > 0 THEN (v_concluidos::DECIMAL / v_total) * 100 ELSE 0 END,
    status = CASE WHEN v_concluidos >= v_total AND v_total > 0 THEN 'concluido' ELSE status END,
    concluido_em = CASE WHEN v_concluidos >= v_total AND v_total > 0 THEN now() ELSE concluido_em END
  WHERE id = v_inscricao_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_progresso ON planos_leitura_progresso;
CREATE TRIGGER trg_atualizar_progresso
AFTER INSERT OR UPDATE OR DELETE ON planos_leitura_progresso
FOR EACH ROW
EXECUTE FUNCTION atualizar_progresso_inscricao();