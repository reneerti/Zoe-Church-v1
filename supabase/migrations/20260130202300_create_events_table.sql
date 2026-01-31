-- Tabela de Eventos da Igreja
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'culto',
  color TEXT DEFAULT 'bg-primary',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- 'weekly', 'monthly', 'yearly'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver eventos de sua unidade"
  ON public.events FOR SELECT
  USING (
    unidade_id IN (
      SELECT unidade_id FROM masters WHERE user_id = auth.uid()
      UNION
      SELECT unidade_id FROM usuarios WHERE user_id = auth.uid()
    )
    OR unidade_id IS NULL -- Eventos públicos/globais
  );

CREATE POLICY "Masters podem criar eventos"
  ON public.events FOR INSERT
  WITH CHECK (
    unidade_id IN (
      SELECT unidade_id FROM masters WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Masters podem atualizar eventos de sua unidade"
  ON public.events FOR UPDATE
  USING (
    unidade_id IN (
      SELECT unidade_id FROM masters WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Masters podem deletar eventos de sua unidade"
  ON public.events FOR DELETE
  USING (
    unidade_id IN (
      SELECT unidade_id FROM masters WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Índices para performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_unidade ON public.events(unidade_id);
CREATE INDEX idx_events_category ON public.events(category);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Comentários
COMMENT ON TABLE public.events IS 'Eventos da igreja (cultos, reuniões, eventos especiais)';
COMMENT ON COLUMN public.events.category IS 'Categoria: culto, reunião, evento, jovens, teens, mulheres, etc.';
COMMENT ON COLUMN public.events.is_recurring IS 'Se true, evento se repete conforme recurrence_rule';
COMMENT ON COLUMN public.events.recurrence_rule IS 'Regra de recorrência: weekly, monthly, yearly';
