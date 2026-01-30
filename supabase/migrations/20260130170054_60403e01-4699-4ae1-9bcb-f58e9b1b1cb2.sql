-- Criar bucket para avatars/fotos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para masters poderem fazer upload
CREATE POLICY "Masters can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (
    EXISTS (
      SELECT 1 FROM public.masters m 
      WHERE m.user_id = auth.uid() AND m.is_active = true
    )
    OR is_super_user()
  )
);

-- Política para masters poderem atualizar
CREATE POLICY "Masters can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (
    EXISTS (
      SELECT 1 FROM public.masters m 
      WHERE m.user_id = auth.uid() AND m.is_active = true
    )
    OR is_super_user()
  )
);

-- Política para masters poderem deletar
CREATE POLICY "Masters can delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (
    EXISTS (
      SELECT 1 FROM public.masters m 
      WHERE m.user_id = auth.uid() AND m.is_active = true
    )
    OR is_super_user()
  )
);