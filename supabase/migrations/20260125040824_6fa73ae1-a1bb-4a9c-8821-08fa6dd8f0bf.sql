-- Create table for chat history (max 3 per user)
CREATE TABLE public.chat_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagens JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_historico ENABLE ROW LEVEL SECURITY;

-- User can only see their own history
CREATE POLICY "Users can view their own chat history" 
ON public.chat_historico 
FOR SELECT 
USING (auth.uid() = user_id);

-- User can insert their own history
CREATE POLICY "Users can create their own chat history" 
ON public.chat_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- User can update their own history
CREATE POLICY "Users can update their own chat history" 
ON public.chat_historico 
FOR UPDATE 
USING (auth.uid() = user_id);

-- User can delete their own history
CREATE POLICY "Users can delete their own chat history" 
ON public.chat_historico 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_chat_historico_user_id ON public.chat_historico(user_id);
CREATE INDEX idx_chat_historico_updated_at ON public.chat_historico(updated_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_chat_historico_updated_at
BEFORE UPDATE ON public.chat_historico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();