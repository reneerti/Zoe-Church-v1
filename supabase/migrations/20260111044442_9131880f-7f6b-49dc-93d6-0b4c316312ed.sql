-- Habilitar RLS nas tabelas públicas e permitir leitura pública

-- BIBLE_VERSIONS (leitura pública)
ALTER TABLE public.bible_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver versões da Bíblia" ON public.bible_versions FOR SELECT USING (true);

-- BIBLE_BOOKS (leitura pública)
ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver livros da Bíblia" ON public.bible_books FOR SELECT USING (true);

-- BIBLE_VERSES (leitura pública)
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver versículos" ON public.bible_verses FOR SELECT USING (true);

-- HARPA_HYMNS (leitura pública)
ALTER TABLE public.harpa_hymns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver hinos" ON public.harpa_hymns FOR SELECT USING (true);

-- READING_PLANS (leitura pública para planos públicos)
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver planos públicos" ON public.reading_plans FOR SELECT USING (is_public = true);

-- READING_PLAN_DAYS (leitura pública para planos públicos)
ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver dias de planos públicos" ON public.reading_plan_days FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.reading_plans WHERE id = plan_id AND is_public = true));