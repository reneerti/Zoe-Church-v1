-- Corrigir policy de scores para ser mais restritiva
DROP POLICY IF EXISTS "System can insert score" ON public.scores;

CREATE POLICY "Users can insert own score" ON public.scores
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Permitir que o sistema crie scores via service role (sem RLS)
-- Mas usuários autenticados só podem criar seu próprio score