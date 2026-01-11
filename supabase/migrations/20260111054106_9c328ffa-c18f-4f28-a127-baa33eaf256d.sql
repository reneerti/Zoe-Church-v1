-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SUPER USERS (FIXO)
-- ============================================
CREATE TABLE IF NOT EXISTS public.super_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255),
    is_permanent BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.super_users (email, nome, is_permanent) VALUES
('reneerti@gmail.com', 'Reneer', true),
('reneernx@hotmail.com', 'Reneer', true),
('reneerdeebie@gmail.com', 'Reneer', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- UNIDADES (IGREJAS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    slug VARCHAR(50) UNIQUE NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    
    -- Dados da Igreja
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    
    -- Personalização do App
    apelido_app VARCHAR(100) NOT NULL,
    logo_url TEXT,
    logo_icon_url TEXT,
    cor_primaria VARCHAR(7) DEFAULT '#6366F1',
    cor_secundaria VARCHAR(7) DEFAULT '#8B5CF6',
    cor_destaque VARCHAR(7) DEFAULT '#F59E0B',
    
    -- Endereço
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    
    -- Contato
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    site VARCHAR(255),
    instagram VARCHAR(100),
    facebook VARCHAR(255),
    youtube VARCHAR(255),
    
    -- PIX
    pix_chave VARCHAR(255),
    pix_tipo VARCHAR(20),
    pix_qr_code_url TEXT,
    pix_nome_beneficiario VARCHAR(255),
    
    -- LIMITES (CONFIGURÁVEIS)
    limite_masters INTEGER DEFAULT 3 CHECK (limite_masters >= 1 AND limite_masters <= 10),
    limite_usuarios INTEGER DEFAULT 50,
    
    -- FEATURES (ATIVAR/DESATIVAR)
    gamificacao_ativa BOOLEAN DEFAULT true,
    ranking_publico BOOLEAN DEFAULT false,
    rede_social_ativa BOOLEAN DEFAULT true,
    chat_ia_ativo BOOLEAN DEFAULT true,
    devocional_ia_ativo BOOLEAN DEFAULT true,
    notificacoes_ativas BOOLEAN DEFAULT true,
    
    -- IA
    ai_habilitada BOOLEAN DEFAULT true,
    ai_limite_por_usuario_dia INTEGER DEFAULT 50,
    ai_modelo_padrao VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    aceite_termos BOOLEAN DEFAULT false,
    aceite_termos_em TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- CONVITES (MASTERS E USUÁRIOS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.convites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    -- Tipo de convite
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('master', 'usuario')),
    
    -- Dados do convidado
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    cargo VARCHAR(100),
    
    -- Código único
    codigo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'expirado', 'cancelado')),
    
    -- Controle
    criado_por UUID REFERENCES auth.users(id),
    aceito_por UUID REFERENCES auth.users(id),
    
    -- Datas
    expira_em TIMESTAMPTZ NOT NULL,
    aceito_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Email tracking
    email_enviado BOOLEAN DEFAULT false,
    email_enviado_em TIMESTAMPTZ
);

-- ============================================
-- MASTERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    foto_url TEXT,
    
    -- Ordem/Prioridade
    is_principal BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Convite
    convite_id UUID REFERENCES public.convites(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_access TIMESTAMPTZ,
    
    UNIQUE(unidade_id, email)
);

-- ============================================
-- USUÁRIOS (MEMBROS) - Renomear tabela existente profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    foto_url TEXT,
    telefone VARCHAR(20),
    data_nascimento DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Convite
    convite_id UUID REFERENCES public.convites(id),
    convidado_por UUID REFERENCES auth.users(id),
    
    -- Aceite de termos
    aceite_termos BOOLEAN DEFAULT false,
    aceite_termos_em TIMESTAMPTZ,
    aceite_privacidade BOOLEAN DEFAULT false,
    aceite_privacidade_em TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_access TIMESTAMPTZ,
    
    UNIQUE(unidade_id, email)
);

-- ============================================
-- AUDIT LOG (RASTREABILIDADE)
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Quem
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(20),
    
    -- Onde
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
    
    -- O quê
    acao VARCHAR(50) NOT NULL,
    tabela VARCHAR(100),
    registro_id UUID,
    
    -- Detalhes
    dados_anteriores JSONB,
    dados_novos JSONB,
    descricao TEXT,
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_unidade ON public.audit_log(unidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabela ON public.audit_log(tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_acao ON public.audit_log(acao);

-- ============================================
-- RATE LIMIT DE IA
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_rate_limit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    -- Contadores diários
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    requisicoes_hoje INTEGER DEFAULT 0,
    tokens_hoje INTEGER DEFAULT 0,
    
    -- Última requisição
    ultima_requisicao TIMESTAMPTZ,
    
    -- Reset
    reset_em TIMESTAMPTZ,
    
    UNIQUE(user_id, unidade_id, data)
);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_user_date ON public.ai_rate_limit(user_id, data);

-- ============================================
-- CONSUMO DE IA (HISTÓRICO DETALHADO)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_consumo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    -- Tipo de uso
    tipo VARCHAR(50) NOT NULL,
    
    -- Tokens
    tokens_entrada INTEGER DEFAULT 0,
    tokens_saida INTEGER DEFAULT 0,
    tokens_total INTEGER DEFAULT 0,
    
    -- Custo
    modelo VARCHAR(50),
    custo_estimado DECIMAL(10, 6) DEFAULT 0,
    
    -- Cache
    foi_cache BOOLEAN DEFAULT false,
    cache_key VARCHAR(255),
    
    -- Metadata
    prompt_resumo TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_consumo_unidade ON public.ai_consumo(unidade_id);
CREATE INDEX IF NOT EXISTS idx_ai_consumo_user ON public.ai_consumo(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consumo_data ON public.ai_consumo(created_at);

-- Resumo diário por unidade
CREATE TABLE IF NOT EXISTS public.ai_consumo_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    
    total_requisicoes INTEGER DEFAULT 0,
    total_requisicoes_cache INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    custo_total DECIMAL(10, 4) DEFAULT 0,
    usuarios_unicos INTEGER DEFAULT 0,
    
    UNIQUE(unidade_id, data)
);

-- ============================================
-- CACHE DE IA - VERSÍCULOS (EXATO)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_cache_versiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Chave
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Versículo
    livro VARCHAR(50) NOT NULL,
    capitulo INTEGER NOT NULL,
    versiculo_inicio INTEGER NOT NULL,
    versiculo_fim INTEGER,
    
    -- Tipo de pergunta
    tipo VARCHAR(50) NOT NULL,
    
    -- Resposta
    resposta TEXT NOT NULL,
    
    -- Metadata
    modelo VARCHAR(50),
    tokens_usados INTEGER,
    
    -- Uso
    hits INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_versiculos_key ON public.ai_cache_versiculos(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_versiculos_livro ON public.ai_cache_versiculos(livro, capitulo, versiculo_inicio);

-- ============================================
-- CONFIGURAÇÃO GLOBAL DE IA (SUPER USER)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Modelos
    modelo_chat VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    modelo_embedding VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    
    -- Limites globais
    limite_tokens_por_requisicao INTEGER DEFAULT 1000,
    limite_requisicoes_por_minuto INTEGER DEFAULT 60,
    
    -- Cache
    cache_habilitado BOOLEAN DEFAULT true,
    cache_similaridade_minima DECIMAL(3,2) DEFAULT 0.92,
    
    -- Custos
    custo_por_1k_tokens_entrada DECIMAL(10, 6) DEFAULT 0.0015,
    custo_por_1k_tokens_saida DECIMAL(10, 6) DEFAULT 0.002,
    custo_por_embedding DECIMAL(10, 6) DEFAULT 0.0001,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO public.ai_config (modelo_chat) VALUES ('gpt-3.5-turbo')
ON CONFLICT DO NOTHING;

-- ============================================
-- GAMIFICAÇÃO - SCORES
-- ============================================
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    -- Score principal
    score_total INTEGER DEFAULT 0,
    
    -- Detalhamento
    pontos_leitura INTEGER DEFAULT 0,
    pontos_devocional INTEGER DEFAULT 0,
    pontos_social INTEGER DEFAULT 0,
    pontos_streak INTEGER DEFAULT 0,
    
    -- Streaks
    streak_atual INTEGER DEFAULT 0,
    streak_maximo INTEGER DEFAULT 0,
    ultima_atividade DATE,
    
    -- Nível
    nivel INTEGER DEFAULT 1,
    nivel_nome VARCHAR(50) DEFAULT 'Semente',
    xp_atual INTEGER DEFAULT 0,
    xp_proximo_nivel INTEGER DEFAULT 100,
    
    -- Conquistas
    badges JSONB DEFAULT '[]',
    
    -- Estatísticas
    capitulos_lidos INTEGER DEFAULT 0,
    versiculos_marcados INTEGER DEFAULT 0,
    devocionais_criados INTEGER DEFAULT 0,
    devocionais_lidos INTEGER DEFAULT 0,
    dias_ativos INTEGER DEFAULT 0,
    
    -- Visibilidade
    visivel_ranking BOOLEAN DEFAULT true,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, unidade_id)
);

-- ============================================
-- REDE SOCIAL
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'texto',
    
    -- Referências
    versiculo_ref VARCHAR(100),
    devocional_id UUID,
    
    -- Contadores
    curtidas INTEGER DEFAULT 0,
    comentarios INTEGER DEFAULT 0,
    
    -- Moderação
    status VARCHAR(20) DEFAULT 'ativo',
    motivo_moderacao TEXT,
    moderado_por UUID REFERENCES auth.users(id),
    moderado_em TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curtidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    conteudo TEXT NOT NULL,
    
    -- Moderação
    status VARCHAR(20) DEFAULT 'ativo',
    motivo_moderacao TEXT,
    moderado_por UUID REFERENCES auth.users(id),
    moderado_em TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TERMOS DE USO E PRIVACIDADE
-- ============================================
CREATE TABLE IF NOT EXISTS public.termos_versoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tipo VARCHAR(20) NOT NULL,
    versao VARCHAR(20) NOT NULL,
    conteudo TEXT NOT NULL,
    
    -- Controle
    ativo BOOLEAN DEFAULT false,
    publicado_em TIMESTAMPTZ,
    criado_por UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tipo, versao)
);

CREATE TABLE IF NOT EXISTS public.aceites_termos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    termo_id UUID REFERENCES public.termos_versoes(id),
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    aceito_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MÉTRICAS DIÁRIAS (PARA DASHBOARD)
-- ============================================
CREATE TABLE IF NOT EXISTS public.metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    
    -- Usuários
    total_usuarios INTEGER DEFAULT 0,
    usuarios_ativos INTEGER DEFAULT 0,
    novos_usuarios INTEGER DEFAULT 0,
    
    -- Engajamento
    logins INTEGER DEFAULT 0,
    capitulos_lidos INTEGER DEFAULT 0,
    versiculos_marcados INTEGER DEFAULT 0,
    devocionais_lidos INTEGER DEFAULT 0,
    devocionais_criados INTEGER DEFAULT 0,
    
    -- Social
    posts_criados INTEGER DEFAULT 0,
    curtidas INTEGER DEFAULT 0,
    comentarios INTEGER DEFAULT 0,
    
    -- IA
    consultas_ia INTEGER DEFAULT 0,
    consultas_ia_cache INTEGER DEFAULT 0,
    
    UNIQUE(unidade_id, data)
);

-- ============================================
-- SESSÕES (PARA TRACKING DE ACESSO)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    
    inicio TIMESTAMPTZ DEFAULT NOW(),
    fim TIMESTAMPTZ,
    duracao_segundos INTEGER,
    
    -- Metadata
    dispositivo VARCHAR(50),
    navegador VARCHAR(100),
    sistema_operacional VARCHAR(100),
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_sessoes_user ON public.sessoes(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_unidade ON public.sessoes(unidade_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_inicio ON public.sessoes(inicio);

-- ============================================
-- HABILITAR RLS
-- ============================================
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_consumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_consumo_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache_versiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aceites_termos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

CREATE OR REPLACE FUNCTION public.is_super_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_users 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_unidade_id()
RETURNS UUID AS $$
DECLARE
    v_unidade_id UUID;
BEGIN
    SELECT unidade_id INTO v_unidade_id 
    FROM public.masters 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
    
    IF v_unidade_id IS NULL THEN
        SELECT unidade_id INTO v_unidade_id 
        FROM public.usuarios 
        WHERE user_id = auth.uid() AND is_active = true
        LIMIT 1;
    END IF;
    
    RETURN v_unidade_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_master_of(check_unidade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.masters 
        WHERE user_id = auth.uid() 
        AND unidade_id = check_unidade_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.belongs_to_unidade(check_unidade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_super_user() OR EXISTS (
        SELECT 1 FROM public.masters 
        WHERE user_id = auth.uid() 
        AND unidade_id = check_unidade_id
        AND is_active = true
    ) OR EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE user_id = auth.uid() 
        AND unidade_id = check_unidade_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- POLICIES
-- ============================================

-- SUPER_USERS: apenas leitura para verificação
CREATE POLICY "Anyone can check super users" ON public.super_users
    FOR SELECT USING (true);

-- UNIDADES
CREATE POLICY "Super users full access unidades" ON public.unidades
    FOR ALL USING (public.is_super_user());

CREATE POLICY "Masters view own unidade" ON public.unidades
    FOR SELECT USING (public.is_master_of(id));

CREATE POLICY "Users view own unidade" ON public.unidades
    FOR SELECT USING (public.belongs_to_unidade(id));

-- CONVITES
CREATE POLICY "Super users manage all convites" ON public.convites
    FOR ALL USING (public.is_super_user());

CREATE POLICY "Masters manage unidade convites" ON public.convites
    FOR ALL USING (public.is_master_of(unidade_id));

-- MASTERS
CREATE POLICY "Super users manage all masters" ON public.masters
    FOR ALL USING (public.is_super_user());

CREATE POLICY "Masters view same unidade" ON public.masters
    FOR SELECT USING (unidade_id = public.get_user_unidade_id());

-- USUARIOS
CREATE POLICY "Super users manage all usuarios" ON public.usuarios
    FOR ALL USING (public.is_super_user());

CREATE POLICY "Masters manage unidade usuarios" ON public.usuarios
    FOR ALL USING (public.is_master_of(unidade_id));

CREATE POLICY "Users view same unidade" ON public.usuarios
    FOR SELECT USING (public.belongs_to_unidade(unidade_id));

-- AUDIT_LOG
CREATE POLICY "Super users view all audit" ON public.audit_log
    FOR SELECT USING (public.is_super_user());

CREATE POLICY "Masters view unidade audit" ON public.audit_log
    FOR SELECT USING (public.is_master_of(unidade_id));

-- AI_CONFIG: apenas super users
CREATE POLICY "Only super users access ai_config" ON public.ai_config
    FOR ALL USING (public.is_super_user());

-- AI_RATE_LIMIT
CREATE POLICY "Users manage own rate limit" ON public.ai_rate_limit
    FOR ALL USING (user_id = auth.uid());

-- AI_CONSUMO
CREATE POLICY "Super users view all consumo" ON public.ai_consumo
    FOR SELECT USING (public.is_super_user());

CREATE POLICY "Masters view unidade consumo" ON public.ai_consumo
    FOR SELECT USING (public.is_master_of(unidade_id));

CREATE POLICY "Users view own consumo" ON public.ai_consumo
    FOR SELECT USING (user_id = auth.uid());

-- AI_CONSUMO_DIARIO
CREATE POLICY "Super users view all consumo diario" ON public.ai_consumo_diario
    FOR SELECT USING (public.is_super_user());

CREATE POLICY "Masters view unidade consumo diario" ON public.ai_consumo_diario
    FOR SELECT USING (public.is_master_of(unidade_id));

-- AI_CACHE: público para leitura (otimização)
CREATE POLICY "Anyone can read cache versiculos" ON public.ai_cache_versiculos
    FOR SELECT USING (true);

-- SCORES
CREATE POLICY "Users view unidade scores" ON public.scores
    FOR SELECT USING (public.belongs_to_unidade(unidade_id));

CREATE POLICY "Users update own score" ON public.scores
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert score" ON public.scores
    FOR INSERT WITH CHECK (true);

-- POSTS
CREATE POLICY "Users view unidade posts" ON public.posts
    FOR SELECT USING (
        public.belongs_to_unidade(unidade_id) 
        AND (status = 'ativo' OR user_id = auth.uid() OR public.is_master_of(unidade_id))
    );

CREATE POLICY "Users create own posts" ON public.posts
    FOR INSERT WITH CHECK (user_id = auth.uid() AND public.belongs_to_unidade(unidade_id));

CREATE POLICY "Users update own posts" ON public.posts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Masters moderate posts" ON public.posts
    FOR UPDATE USING (public.is_master_of(unidade_id));

CREATE POLICY "Users delete own posts" ON public.posts
    FOR DELETE USING (user_id = auth.uid() OR public.is_master_of(unidade_id));

-- CURTIDAS e COMENTARIOS
CREATE POLICY "Users manage curtidas" ON public.curtidas
    FOR ALL USING (public.belongs_to_unidade(unidade_id));

CREATE POLICY "Users manage comentarios" ON public.comentarios
    FOR ALL USING (public.belongs_to_unidade(unidade_id));

-- TERMOS: público para leitura
CREATE POLICY "Anyone can read termos" ON public.termos_versoes
    FOR SELECT USING (ativo = true);

CREATE POLICY "Super users manage termos" ON public.termos_versoes
    FOR ALL USING (public.is_super_user());

-- ACEITES
CREATE POLICY "Users manage own aceites" ON public.aceites_termos
    FOR ALL USING (user_id = auth.uid());

-- MÉTRICAS
CREATE POLICY "Super users view all metricas" ON public.metricas_diarias
    FOR SELECT USING (public.is_super_user());

CREATE POLICY "Masters view unidade metricas" ON public.metricas_diarias
    FOR SELECT USING (public.is_master_of(unidade_id));

-- SESSÕES
CREATE POLICY "Users manage own sessoes" ON public.sessoes
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Masters view unidade sessoes" ON public.sessoes
    FOR SELECT USING (public.is_master_of(unidade_id));