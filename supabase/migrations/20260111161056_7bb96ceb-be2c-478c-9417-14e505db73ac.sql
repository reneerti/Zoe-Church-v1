-- Tabela para armazenar tokens FCM dos usuários
CREATE TABLE public.fcm_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users manage own fcm_tokens"
  ON public.fcm_tokens
  FOR ALL
  USING (user_id = auth.uid());

-- Super users and masters can read tokens for sending notifications
CREATE POLICY "Masters read fcm_tokens for notifications"
  ON public.fcm_tokens
  FOR SELECT
  USING (is_super_user() OR EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.user_id = fcm_tokens.user_id 
    AND is_master_of(u.unidade_id)
  ));

-- Trigger for updated_at
CREATE TRIGGER update_fcm_tokens_updated_at
  BEFORE UPDATE ON public.fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();