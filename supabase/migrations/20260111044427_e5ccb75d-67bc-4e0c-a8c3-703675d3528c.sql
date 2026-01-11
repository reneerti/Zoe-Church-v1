-- =============================================
-- TABELA DE PERFIS DE USUÁRIO
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- VERSÕES DA BÍBLIA
-- =============================================
CREATE TABLE public.bible_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'pt',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.bible_versions (code, name) VALUES 
('NVI', 'Nova Versão Internacional'),
('NTLH', 'Nova Tradução na Linguagem de Hoje'),
('ARA', 'Almeida Revista e Atualizada');

-- =============================================
-- LIVROS DA BÍBLIA
-- =============================================
CREATE TABLE public.bible_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    testament TEXT NOT NULL CHECK (testament IN ('AT', 'NT')),
    chapters_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(book_number)
);

-- Inserir os 66 livros da Bíblia
INSERT INTO public.bible_books (book_number, name, abbreviation, testament, chapters_count) VALUES
(1, 'Gênesis', 'Gn', 'AT', 50), (2, 'Êxodo', 'Êx', 'AT', 40), (3, 'Levítico', 'Lv', 'AT', 27),
(4, 'Números', 'Nm', 'AT', 36), (5, 'Deuteronômio', 'Dt', 'AT', 34), (6, 'Josué', 'Js', 'AT', 24),
(7, 'Juízes', 'Jz', 'AT', 21), (8, 'Rute', 'Rt', 'AT', 4), (9, '1 Samuel', '1Sm', 'AT', 31),
(10, '2 Samuel', '2Sm', 'AT', 24), (11, '1 Reis', '1Rs', 'AT', 22), (12, '2 Reis', '2Rs', 'AT', 25),
(13, '1 Crônicas', '1Cr', 'AT', 29), (14, '2 Crônicas', '2Cr', 'AT', 36), (15, 'Esdras', 'Ed', 'AT', 10),
(16, 'Neemias', 'Ne', 'AT', 13), (17, 'Ester', 'Et', 'AT', 10), (18, 'Jó', 'Jó', 'AT', 42),
(19, 'Salmos', 'Sl', 'AT', 150), (20, 'Provérbios', 'Pv', 'AT', 31), (21, 'Eclesiastes', 'Ec', 'AT', 12),
(22, 'Cantares', 'Ct', 'AT', 8), (23, 'Isaías', 'Is', 'AT', 66), (24, 'Jeremias', 'Jr', 'AT', 52),
(25, 'Lamentações', 'Lm', 'AT', 5), (26, 'Ezequiel', 'Ez', 'AT', 48), (27, 'Daniel', 'Dn', 'AT', 12),
(28, 'Oséias', 'Os', 'AT', 14), (29, 'Joel', 'Jl', 'AT', 3), (30, 'Amós', 'Am', 'AT', 9),
(31, 'Obadias', 'Ob', 'AT', 1), (32, 'Jonas', 'Jn', 'AT', 4), (33, 'Miquéias', 'Mq', 'AT', 7),
(34, 'Naum', 'Na', 'AT', 3), (35, 'Habacuque', 'Hc', 'AT', 3), (36, 'Sofonias', 'Sf', 'AT', 3),
(37, 'Ageu', 'Ag', 'AT', 2), (38, 'Zacarias', 'Zc', 'AT', 14), (39, 'Malaquias', 'Ml', 'AT', 4),
(40, 'Mateus', 'Mt', 'NT', 28), (41, 'Marcos', 'Mc', 'NT', 16), (42, 'Lucas', 'Lc', 'NT', 24),
(43, 'João', 'Jo', 'NT', 21), (44, 'Atos', 'At', 'NT', 28), (45, 'Romanos', 'Rm', 'NT', 16),
(46, '1 Coríntios', '1Co', 'NT', 16), (47, '2 Coríntios', '2Co', 'NT', 13), (48, 'Gálatas', 'Gl', 'NT', 6),
(49, 'Efésios', 'Ef', 'NT', 6), (50, 'Filipenses', 'Fp', 'NT', 4), (51, 'Colossenses', 'Cl', 'NT', 4),
(52, '1 Tessalonicenses', '1Ts', 'NT', 5), (53, '2 Tessalonicenses', '2Ts', 'NT', 3), (54, '1 Timóteo', '1Tm', 'NT', 6),
(55, '2 Timóteo', '2Tm', 'NT', 4), (56, 'Tito', 'Tt', 'NT', 3), (57, 'Filemom', 'Fm', 'NT', 1),
(58, 'Hebreus', 'Hb', 'NT', 13), (59, 'Tiago', 'Tg', 'NT', 5), (60, '1 Pedro', '1Pe', 'NT', 5),
(61, '2 Pedro', '2Pe', 'NT', 3), (62, '1 João', '1Jo', 'NT', 5), (63, '2 João', '2Jo', 'NT', 1),
(64, '3 João', '3Jo', 'NT', 1), (65, 'Judas', 'Jd', 'NT', 1), (66, 'Apocalipse', 'Ap', 'NT', 22);

-- =============================================
-- VERSÍCULOS DA BÍBLIA
-- =============================================
CREATE TABLE public.bible_verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID REFERENCES public.bible_versions(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.bible_books(id) ON DELETE CASCADE NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(version_id, book_id, chapter, verse)
);

CREATE INDEX idx_bible_verses_lookup ON public.bible_verses(version_id, book_id, chapter);

-- =============================================
-- HINOS DA HARPA CRISTÃ
-- =============================================
CREATE TABLE public.harpa_hymns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hymn_number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    lyrics TEXT NOT NULL,
    chorus TEXT,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_harpa_hymns_number ON public.harpa_hymns(hymn_number);

-- =============================================
-- VERSÍCULOS FAVORITOS
-- =============================================
CREATE TABLE public.favorite_verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.bible_verses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, verse_id)
);

ALTER TABLE public.favorite_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus versículos favoritos" ON public.favorite_verses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem adicionar versículos favoritos" ON public.favorite_verses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover versículos favoritos" ON public.favorite_verses FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- HINOS FAVORITOS
-- =============================================
CREATE TABLE public.favorite_hymns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    hymn_id UUID REFERENCES public.harpa_hymns(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, hymn_id)
);

ALTER TABLE public.favorite_hymns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus hinos favoritos" ON public.favorite_hymns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem adicionar hinos favoritos" ON public.favorite_hymns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover hinos favoritos" ON public.favorite_hymns FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DESTAQUES DA BÍBLIA (Highlighting)
-- =============================================
CREATE TABLE public.verse_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.bible_verses(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL DEFAULT 'yellow',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, verse_id)
);

ALTER TABLE public.verse_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus destaques" ON public.verse_highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem adicionar destaques" ON public.verse_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar destaques" ON public.verse_highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover destaques" ON public.verse_highlights FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PROGRESSO DE LEITURA (por capítulo)
-- =============================================
CREATE TABLE public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.bible_books(id) ON DELETE CASCADE NOT NULL,
    chapter INTEGER NOT NULL,
    read_count INTEGER NOT NULL DEFAULT 1,
    last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, book_id, chapter)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu progresso" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem registrar progresso" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar progresso" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- PLANOS DE LEITURA
-- =============================================
CREATE TABLE public.reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.reading_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.reading_plans(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL,
    book_id UUID REFERENCES public.bible_books(id) ON DELETE CASCADE NOT NULL,
    chapter_start INTEGER NOT NULL,
    chapter_end INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(plan_id, day_number)
);

CREATE TABLE public.user_reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.reading_plans(id) ON DELETE CASCADE NOT NULL,
    current_day INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, plan_id)
);

ALTER TABLE public.user_reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus planos" ON public.user_reading_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar planos" ON public.user_reading_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar planos" ON public.user_reading_plans FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- HISTÓRICO DE CHAT IA
-- =============================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas mensagens" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar mensagens" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGER PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_verse_highlights_updated_at BEFORE UPDATE ON public.verse_highlights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INSERIR PLANO DE LEITURA BÍBLIA EM 1 ANO
-- =============================================
INSERT INTO public.reading_plans (name, description, duration_days) VALUES 
('Bíblia em 1 Ano', 'Leia toda a Bíblia em 365 dias com leituras diárias balanceadas', 365),
('Novo Testamento em 90 dias', 'Complete o Novo Testamento em 90 dias', 90),
('Salmos e Provérbios', 'Sabedoria diária através dos Salmos e Provérbios', 31);