-- ==========================================
-- TABELA DE NOTIFICAÇÕES
-- ==========================================
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
  criado_por UUID,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'geral', -- geral, plano, evento, devocional
  link_acao VARCHAR(500),
  icone VARCHAR(50) DEFAULT 'bell',
  programada_para TIMESTAMP WITH TIME ZONE,
  enviada_em TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, agendada, enviada, cancelada
  destinatarios_tipo VARCHAR(20) DEFAULT 'todos', -- todos, ativos, inativos, especificos
  destinatarios_ids UUID[],
  total_enviados INTEGER DEFAULT 0,
  total_lidos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para rastrear quais notificações cada usuário recebeu/leu
CREATE TABLE public.notificacoes_usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notificacao_id UUID REFERENCES public.notificacoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recebida_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lida_em TIMESTAMP WITH TIME ZONE,
  clicada_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(notificacao_id, user_id)
);

-- ==========================================
-- RLS PARA NOTIFICAÇÕES
-- ==========================================
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_usuarios ENABLE ROW LEVEL SECURITY;

-- Masters gerenciam notificações da unidade
CREATE POLICY "Masters manage notificacoes" ON public.notificacoes
  FOR ALL USING (is_master_of(unidade_id));

-- Super users veem todas
CREATE POLICY "Super users view all notificacoes" ON public.notificacoes
  FOR SELECT USING (is_super_user());

-- Usuários veem suas próprias notificações recebidas
CREATE POLICY "Users manage own notificacoes_usuarios" ON public.notificacoes_usuarios
  FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- ADICIONAR CÓDIGO DE COMPARTILHAMENTO AOS PLANOS
-- ==========================================
ALTER TABLE public.planos_leitura 
  ADD COLUMN IF NOT EXISTS codigo_convite VARCHAR(10) UNIQUE,
  ADD COLUMN IF NOT EXISTS max_inscritos INTEGER,
  ADD COLUMN IF NOT EXISTS permite_inscricao_publica BOOLEAN DEFAULT false;

-- Função para gerar código único para plano
CREATE OR REPLACE FUNCTION public.gerar_codigo_plano()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_convite IS NULL THEN
    NEW.codigo_convite := UPPER(SUBSTRING(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar código
DROP TRIGGER IF EXISTS trg_gerar_codigo_plano ON public.planos_leitura;
CREATE TRIGGER trg_gerar_codigo_plano
  BEFORE INSERT ON public.planos_leitura
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_plano();

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificacoes_unidade ON public.notificacoes(unidade_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON public.notificacoes(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuarios_user ON public.notificacoes_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuarios_notificacao ON public.notificacoes_usuarios(notificacao_id);
CREATE INDEX IF NOT EXISTS idx_planos_codigo ON public.planos_leitura(codigo_convite);

-- ==========================================
-- FUNÇÃO PARA BUSCAR PLANO POR CÓDIGO
-- ==========================================
CREATE OR REPLACE FUNCTION public.buscar_plano_por_codigo(p_codigo VARCHAR)
RETURNS TABLE(
  id UUID,
  titulo VARCHAR,
  descricao TEXT,
  duracao_dias INTEGER,
  total_inscritos INTEGER,
  unidade_nome VARCHAR,
  codigo_convite VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.titulo,
    p.descricao,
    p.duracao_dias,
    p.total_inscritos,
    u.nome_fantasia as unidade_nome,
    p.codigo_convite
  FROM planos_leitura p
  JOIN unidades u ON u.id = p.unidade_id
  WHERE p.codigo_convite = UPPER(p_codigo)
    AND p.status = 'publicado'
    AND (p.permite_inscricao_publica = true OR p.codigo_convite IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;