import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, Settings, Plus, Search, 
  MoreVertical, Edit, Trash2, Mail, BarChart3,
  ChevronLeft, Shield, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Unidade {
  id: string;
  slug: string;
  nome_fantasia: string;
  apelido_app: string;
  is_active: boolean;
  limite_masters: number;
  limite_usuarios: number;
  gamificacao_ativa: boolean;
  rede_social_ativa: boolean;
  chat_ia_ativo: boolean;
  created_at: string;
  _count?: {
    masters: number;
    usuarios: number;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isSuperUser, profile } = useAuth();
  const { toast } = useToast();
  
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);

  // Form state para criar/editar unidade
  const [formData, setFormData] = useState({
    slug: "",
    nome_fantasia: "",
    apelido_app: "",
    limite_masters: 3,
    limite_usuarios: 50,
    gamificacao_ativa: true,
    rede_social_ativa: true,
    chat_ia_ativo: true,
    devocional_ia_ativo: true,
  });

  useEffect(() => {
    if (!isSuperUser) {
      navigate("/");
      return;
    }
    fetchUnidades();
  }, [isSuperUser, navigate]);

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar contagem de masters e usuários para cada unidade
      const unidadesWithCounts = await Promise.all(
        (data || []).map(async (unidade) => {
          const { count: mastersCount } = await supabase
            .from("masters")
            .select("*", { count: "exact", head: true })
            .eq("unidade_id", unidade.id)
            .eq("is_active", true);

          const { count: usuariosCount } = await supabase
            .from("usuarios")
            .select("*", { count: "exact", head: true })
            .eq("unidade_id", unidade.id)
            .eq("is_active", true);

          return {
            ...unidade,
            _count: {
              masters: mastersCount || 0,
              usuarios: usuariosCount || 0,
            },
          };
        })
      );

      setUnidades(unidadesWithCounts);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnidade = async () => {
    try {
      const { error } = await supabase.from("unidades").insert({
        ...formData,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Unidade criada com sucesso",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchUnidades();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a unidade",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUnidade = async () => {
    if (!selectedUnidade) return;

    try {
      const { error } = await supabase
        .from("unidades")
        .update(formData)
        .eq("id", selectedUnidade.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Unidade atualizada com sucesso",
      });

      setShowEditDialog(false);
      setSelectedUnidade(null);
      resetForm();
      fetchUnidades();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a unidade",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (unidade: Unidade) => {
    try {
      const { error } = await supabase
        .from("unidades")
        .update({ is_active: !unidade.is_active })
        .eq("id", unidade.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Unidade ${unidade.is_active ? "desativada" : "ativada"}`,
      });

      fetchUnidades();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      nome_fantasia: "",
      apelido_app: "",
      limite_masters: 3,
      limite_usuarios: 50,
      gamificacao_ativa: true,
      rede_social_ativa: true,
      chat_ia_ativo: true,
      devocional_ia_ativo: true,
    });
  };

  const openEditDialog = (unidade: Unidade) => {
    setSelectedUnidade(unidade);
    setFormData({
      slug: unidade.slug,
      nome_fantasia: unidade.nome_fantasia,
      apelido_app: unidade.apelido_app,
      limite_masters: unidade.limite_masters,
      limite_usuarios: unidade.limite_usuarios,
      gamificacao_ativa: unidade.gamificacao_ativa,
      rede_social_ativa: unidade.rede_social_ativa,
      chat_ia_ativo: unidade.chat_ia_ativo,
      devocional_ia_ativo: true,
    });
    setShowEditDialog(true);
  };

  const filteredUnidades = unidades.filter(
    (u) =>
      u.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
      u.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!isSuperUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl">Painel Super Admin</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Super User
            </Badge>
            <span className="text-sm text-muted-foreground">
              {profile?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="unidades" className="space-y-6">
          <TabsList>
            <TabsTrigger value="unidades" className="gap-2">
              <Building2 className="h-4 w-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="ia" className="gap-2">
              <Activity className="h-4 w-4" />
              Consumo IA
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Unidades */}
          <TabsContent value="unidades" className="space-y-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar unidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Unidade
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Unidades</CardDescription>
                  <CardTitle className="text-3xl">{unidades.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unidades Ativas</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {unidades.filter((u) => u.is_active).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Masters</CardDescription>
                  <CardTitle className="text-3xl">
                    {unidades.reduce((acc, u) => acc + (u._count?.masters || 0), 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Usuários</CardDescription>
                  <CardTitle className="text-3xl">
                    {unidades.reduce((acc, u) => acc + (u._count?.usuarios || 0), 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Unidades List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredUnidades.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma unidade encontrada</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Criar primeira unidade
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredUnidades.map((unidade) => (
                  <Card key={unidade.id} className={!unidade.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{unidade.nome_fantasia}</h3>
                              <Badge variant={unidade.is_active ? "default" : "secondary"}>
                                {unidade.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              /{unidade.slug} • App: {unidade.apelido_app}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{unidade._count?.masters || 0}</p>
                            <p className="text-xs text-muted-foreground">Masters</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{unidade._count?.usuarios || 0}</p>
                            <p className="text-xs text-muted-foreground">Usuários</p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/unidade/${unidade.id}/convites`)}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Convites
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(unidade)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(unidade)}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  {unidade.is_active ? "Desativar" : "Ativar"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Features badges */}
                      <div className="flex gap-2 mt-4">
                        {unidade.gamificacao_ativa && (
                          <Badge variant="outline" className="text-xs">Gamificação</Badge>
                        )}
                        {unidade.rede_social_ativa && (
                          <Badge variant="outline" className="text-xs">Rede Social</Badge>
                        )}
                        {unidade.chat_ia_ativo && (
                          <Badge variant="outline" className="text-xs">Chat IA</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Consumo IA */}
          <TabsContent value="ia">
            <Card>
              <CardHeader>
                <CardTitle>Consumo de IA por Unidade</CardTitle>
                <CardDescription>
                  Acompanhe o uso de IA em todas as unidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Dados de consumo de IA serão exibidos aqui
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configurações */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Globais de IA</CardTitle>
                <CardDescription>
                  Configure limites e modelos de IA para todo o sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Modelo de Chat</Label>
                    <Input value="gpt-3.5-turbo" disabled />
                  </div>
                  <div>
                    <Label>Modelo de Embedding</Label>
                    <Input value="text-embedding-ada-002" disabled />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para alterar configurações de IA, edite diretamente no banco de dados.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog: Criar Unidade */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Unidade</DialogTitle>
            <DialogDescription>
              Crie uma nova unidade (igreja) no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  placeholder="minha-igreja"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                />
              </div>
              <div>
                <Label>Apelido do App</Label>
                <Input
                  placeholder="App Igreja"
                  value={formData.apelido_app}
                  onChange={(e) => setFormData({ ...formData, apelido_app: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Nome Fantasia</Label>
              <Input
                placeholder="Igreja Batista Central"
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Limite de Masters</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.limite_masters}
                  onChange={(e) => setFormData({ ...formData, limite_masters: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div>
                <Label>Limite de Usuários</Label>
                <Input
                  type="number"
                  min={10}
                  value={formData.limite_usuarios}
                  onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Features</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Gamificação</span>
                <Switch
                  checked={formData.gamificacao_ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, gamificacao_ativa: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rede Social</span>
                <Switch
                  checked={formData.rede_social_ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, rede_social_ativa: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chat com IA</span>
                <Switch
                  checked={formData.chat_ia_ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, chat_ia_ativo: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Devocional com IA</span>
                <Switch
                  checked={formData.devocional_ia_ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, devocional_ia_ativo: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUnidade}>
              Criar Unidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Unidade */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>
              Atualize as configurações da unidade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                />
              </div>
              <div>
                <Label>Apelido do App</Label>
                <Input
                  value={formData.apelido_app}
                  onChange={(e) => setFormData({ ...formData, apelido_app: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Nome Fantasia</Label>
              <Input
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Limite de Masters</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.limite_masters}
                  onChange={(e) => setFormData({ ...formData, limite_masters: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div>
                <Label>Limite de Usuários</Label>
                <Input
                  type="number"
                  min={10}
                  value={formData.limite_usuarios}
                  onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Features</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Gamificação</span>
                <Switch
                  checked={formData.gamificacao_ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, gamificacao_ativa: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rede Social</span>
                <Switch
                  checked={formData.rede_social_ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, rede_social_ativa: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chat com IA</span>
                <Switch
                  checked={formData.chat_ia_ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, chat_ia_ativo: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Devocional com IA</span>
                <Switch
                  checked={formData.devocional_ia_ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, devocional_ia_ativo: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUnidade}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
