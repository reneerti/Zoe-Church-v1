import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ChevronLeft, Mail, Plus, Copy, Check, Clock, 
  X, RefreshCw, User, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Convite {
  id: string;
  tipo: 'master' | 'usuario';
  email: string;
  nome: string;
  cargo: string | null;
  codigo: string;
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado';
  expira_em: string;
  created_at: string;
  email_enviado: boolean;
}

interface Unidade {
  id: string;
  slug: string;
  nome_fantasia: string;
  limite_masters: number;
  limite_usuarios: number;
}

export default function ConvitesPage() {
  const { unidadeId } = useParams<{ unidadeId: string }>();
  const navigate = useNavigate();
  const { isSuperUser, user } = useAuth();
  const { toast } = useToast();
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'master' as 'master' | 'usuario',
    email: '',
    nome: '',
    cargo: '',
  });

  useEffect(() => {
    if (!isSuperUser) {
      navigate("/admin");
      return;
    }
    fetchData();
  }, [unidadeId, isSuperUser]);

  const fetchData = async () => {
    try {
      // Buscar unidade
      const { data: unidadeData, error: unidadeError } = await supabase
        .from("unidades")
        .select("id, slug, nome_fantasia, limite_masters, limite_usuarios")
        .eq("id", unidadeId)
        .single();

      if (unidadeError) throw unidadeError;
      setUnidade(unidadeData);

      // Buscar convites
      const { data: convitesData, error: convitesError } = await supabase
        .from("convites")
        .select("*")
        .eq("unidade_id", unidadeId)
        .order("created_at", { ascending: false });

      if (convitesError) throw convitesError;
      setConvites(convitesData as Convite[] || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateConvite = async () => {
    if (!formData.email || !formData.nome) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const codigo = generateCode();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7); // 7 dias

      // Verificar se já existe convite pendente para este email
      const { data: existingConvite } = await supabase
        .from("convites")
        .select("id")
        .eq("unidade_id", unidadeId)
        .eq("email", formData.email)
        .eq("status", "pendente")
        .single();

      if (existingConvite) {
        toast({
          title: "Atenção",
          description: "Já existe um convite pendente para este email",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Criar convite
      const { error } = await supabase.from("convites").insert({
        unidade_id: unidadeId,
        tipo: formData.tipo,
        email: formData.email,
        nome: formData.nome,
        cargo: formData.cargo || null,
        codigo,
        expira_em: expiraEm.toISOString(),
        criado_por: user?.id,
      });

      if (error) throw error;

      // Buscar ID do convite recém-criado para enviar email
      const { data: novoConvite } = await supabase
        .from("convites")
        .select("id")
        .eq("codigo", codigo)
        .single();

      // Enviar email via edge function
      if (novoConvite) {
        try {
          await supabase.functions.invoke('send-convite-email', {
            body: { conviteId: novoConvite.id }
          });
          toast({
            title: "Email enviado!",
            description: `Convite enviado para ${formData.email}`,
          });
        } catch (emailError) {
          console.error("Erro ao enviar email:", emailError);
          // Não bloquear o fluxo se o email falhar
        }
      }

      toast({
        title: "Sucesso!",
        description: `Convite criado para ${formData.email}`,
      });

      setShowCreateDialog(false);
      setFormData({ tipo: 'master', email: '', nome: '', cargo: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o convite",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCancelConvite = async (conviteId: string) => {
    try {
      const { error } = await supabase
        .from("convites")
        .update({ status: "cancelado" })
        .eq("id", conviteId);

      if (error) throw error;

      toast({
        title: "Convite cancelado",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite",
        variant: "destructive",
      });
    }
  };

  const copyConviteLink = (codigo: string) => {
    const link = `${window.location.origin}/convite/${codigo}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(codigo);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'aceito':
        return <Badge variant="default" className="gap-1 bg-green-600"><Check className="h-3 w-3" /> Aceito</Badge>;
      case 'expirado':
        return <Badge variant="secondary" className="gap-1"><X className="h-3 w-3" /> Expirado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const convitesMasters = convites.filter(c => c.tipo === 'master');
  const convitesUsuarios = convites.filter(c => c.tipo === 'usuario');

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-xl">Convites</h1>
              <p className="text-sm text-muted-foreground">{unidade?.nome_fantasia}</p>
            </div>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Convite
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="masters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="masters" className="gap-2">
              <Shield className="h-4 w-4" />
              Masters ({convitesMasters.length})
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2">
              <User className="h-4 w-4" />
              Usuários ({convitesUsuarios.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Masters */}
          <TabsContent value="masters">
            {convitesMasters.length === 0 ? (
              <Card className="p-12 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum convite para master</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setFormData({ ...formData, tipo: 'master' });
                    setShowCreateDialog(true);
                  }}
                >
                  Convidar Master
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {convitesMasters.map((convite) => (
                  <ConviteCard 
                    key={convite.id} 
                    convite={convite}
                    onCopy={copyConviteLink}
                    onCancel={handleCancelConvite}
                    copiedCode={copiedCode}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Usuários */}
          <TabsContent value="usuarios">
            {convitesUsuarios.length === 0 ? (
              <Card className="p-12 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum convite para usuário</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setFormData({ ...formData, tipo: 'usuario' });
                    setShowCreateDialog(true);
                  }}
                >
                  Convidar Usuário
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {convitesUsuarios.map((convite) => (
                  <ConviteCard 
                    key={convite.id} 
                    convite={convite}
                    onCopy={copyConviteLink}
                    onCancel={handleCancelConvite}
                    copiedCode={copiedCode}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog: Criar Convite */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Convite</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo {formData.tipo === 'master' ? 'administrador' : 'membro'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de Convite</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'master' | 'usuario') => 
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master (Administrador)</SelectItem>
                  <SelectItem value="usuario">Usuário (Membro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {formData.tipo === 'master' && (
              <div>
                <Label>Cargo</Label>
                <Input
                  placeholder="Ex: Pastor, Líder de Louvor"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateConvite} disabled={sending}>
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Criar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card de Convite
function ConviteCard({ 
  convite, 
  onCopy, 
  onCancel, 
  copiedCode, 
  getStatusBadge 
}: { 
  convite: Convite;
  onCopy: (codigo: string) => void;
  onCancel: (id: string) => void;
  copiedCode: string | null;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  const isExpired = new Date(convite.expira_em) < new Date();
  const canCancel = convite.status === 'pendente' && !isExpired;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {convite.tipo === 'master' ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{convite.nome}</h3>
                {getStatusBadge(isExpired && convite.status === 'pendente' ? 'expirado' : convite.status)}
              </div>
              <p className="text-sm text-muted-foreground">{convite.email}</p>
              {convite.cargo && (
                <p className="text-xs text-muted-foreground">{convite.cargo}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-muted-foreground">
              <p>Código: <code className="bg-muted px-2 py-1 rounded">{convite.codigo}</code></p>
              <p>Expira: {new Date(convite.expira_em).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(convite.codigo)}
              >
                {copiedCode === convite.codigo ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(convite.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
