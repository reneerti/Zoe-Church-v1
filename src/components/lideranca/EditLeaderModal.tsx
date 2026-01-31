import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InputMask from "react-input-mask";

type Leader = {
  id: string;
  nome: string;
  cargo: string | null;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  ordem: number | null;
};

interface EditLeaderModalProps {
  leader: Leader | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditLeaderModal({ leader, open, onOpenChange, onSave }: EditLeaderModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    foto_url: "",
    ordem: 1,
  });

  // Reset form when leader changes
  useEffect(() => {
    if (leader && open) {
      setFormData({
        nome: leader.nome || "",
        cargo: leader.cargo || "",
        email: leader.email || "",
        telefone: leader.telefone || "",
        foto_url: leader.foto_url || "",
        ordem: leader.ordem || 1,
      });
      setPhotoPreview(leader.foto_url);
      setPhotoFile(null);
    }
  }, [leader, open]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !leader?.id) return null;

    setUploading(true);
    try {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${leader.id}-${Date.now()}.${fileExt}`;
      const filePath = `lideranca/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar foto");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!leader?.id) return;

    // Validate required fields
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("E-mail é obrigatório");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("E-mail inválido");
      return;
    }

    setLoading(true);
    try {
      // Upload photo if a new one was selected
      let photoUrl = formData.foto_url;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from("masters")
        .update({
          nome: formData.nome.trim(),
          cargo: formData.cargo.trim() || null,
          email: formData.email.trim(),
          telefone: formData.telefone.trim() || null,
          foto_url: photoUrl || null,
          ordem: formData.ordem || 1,
        })
        .eq("id", leader.id);

      if (error) throw error;

      toast.success("Líder atualizado com sucesso!");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Editar Líder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed border-border">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={formData.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Enviando..." : photoPreview ? "Alterar foto" : "Adicionar foto"}
              </div>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={uploading || loading}
              />
            </Label>
            {photoPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                  setFormData(prev => ({ ...prev, foto_url: "" }));
                }}
                disabled={loading}
              >
                Remover foto
              </Button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                placeholder="Ex: Pastor, Líder de Louvor"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={loading}
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    id="telefone"
                    placeholder="(00) 00000-0000"
                  />
                )}
              </InputMask>
            </div>

            <div>
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input
                id="ordem"
                type="number"
                min={1}
                max={100}
                value={formData.ordem}
                onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Menor número aparece primeiro
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
