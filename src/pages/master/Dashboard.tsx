import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Users, UserCheck, LogIn, UserPlus, TrendingUp, 
  BookOpen, Heart, MessageSquare, Sparkles, QrCode,
  ChevronLeft, Shield, Settings, Eye, EyeOff, Trash2,
  RefreshCw, Download, Bell, BookMarked
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlanosDashboard } from "@/components/master/PlanosDashboard";

type Membro = {
  id: string;
  nome: string | null;
  email: string;
  last_access: string | null;
  created_at: string | null;
  is_active: boolean | null;
  score?: {
    score_total: number;
    streak_atual: number;
    nivel: number;
  };
};

type Post = {
  id: string;
  conteudo: string;
  user_id: string | null;
  created_at: string | null;
  status: string | null;
  curtidas: number | null;
  comentarios: number | null;
  usuario_nome?: string;
};

type Metricas = {
  total_membros: number;
  ativos_7d: number;
  logins_hoje: number;
  novos_30d: number;
  capitulos_lidos: number;
  versiculos_marcados: number;
  posts_criados: number;
  consultas_ia: number;
};

export default function MasterDashboard() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  
  const [unidade, setUnidade] = useState<any>(null);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [metricas, setMetricas] = useState<Metricas>({
    total_membros: 0,
    ativos_7d: 0,
    logins_hoje: 0,
    novos_30d: 0,
    capitulos_lidos: 0,
    versiculos_marcados: 0,
    posts_criados: 0,
    consultas_ia: 0
  });
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [conviteLink, setConviteLink] = useState("");

  useEffect(() => {
    if (slug) {
      fetchUnidade();
    }
  }, [slug]);

  useEffect(() => {
    if (unidade?.id) {
      fetchMembros();
      fetchPosts();
      fetchMetricas();
    }
  }, [unidade?.id]);

  const fetchUnidade = async () => {
    const { data, error } = await supabase
      .from("unidades")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (error) {
      toast.error("Unidade não encontrada");
      navigate("/");
      return;
    }
    
    setUnidade(data);
  };

  const fetchMembros = async () => {
    const { data: usuarios, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("unidade_id", unidade.id)
      .order("last_access", { ascending: false, nullsFirst: false });
    
    if (error) {
      console.error("Erro ao buscar membros:", error);
      return;
    }

    // Buscar scores dos usuários
    const userIds = usuarios?.map(u => u.user_id).filter(Boolean) || [];
    const { data: scores } = await supabase
      .from("scores")
      .select("user_id, score_total, streak_atual, nivel")
      .in("user_id", userIds);

    const scoresMap = new Map(scores?.map(s => [s.user_id, s]) || []);

    const membrosComScore = usuarios?.map(u => ({
      ...u,
      score: u.user_id ? scoresMap.get(u.user_id) : undefined
    })) || [];

    setMembros(membrosComScore);
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("unidade_id", unidade.id)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Erro ao buscar posts:", error);
      return;
    }

    // Buscar nomes dos usuários
    const userIds = data?.map(p => p.user_id).filter(Boolean) || [];
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("user_id, nome")
      .in("user_id", userIds);

    const usuariosMap = new Map(usuarios?.map(u => [u.user_id, u.nome]) || []);

    const postsComNome = data?.map(p => ({
      ...p,
      usuario_nome: p.user_id ? usuariosMap.get(p.user_id) || "Anônimo" : "Anônimo"
    })) || [];

    setPosts(postsComNome);
  };

  const fetchMetricas = async () => {
    const hoje = new Date();
    const seteDiasAtras = subDays(hoje, 7);
    const trintaDiasAtras = subDays(hoje, 30);

    // Total de membros
    const { count: totalMembros } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("unidade_id", unidade.id)
      .eq("is_active", true);

    // Ativos últimos 7 dias
    const { count: ativos7d } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("unidade_id", unidade.id)
      .eq("is_active", true)
      .gte("last_access", seteDiasAtras.toISOString());

    // Novos últimos 30 dias
    const { count: novos30d } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("unidade_id", unidade.id)
      .gte("created_at", trintaDiasAtras.toISOString());

    // Logins hoje
    const { count: loginsHoje } = await supabase
      .from("sessoes")
      .select("*", { count: "exact", head: true })
      .eq("unidade_id", unidade.id)
      .gte("inicio", format(hoje, "yyyy-MM-dd"));

    // Posts criados
    const { count: postsCriados } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("unidade_id", unidade.id);

    // Consultas IA
    const { count: consultasIA } = await supabase
      .from("ai_consumo")
      .select("*", { count: "exact", head: true })
      .eq("unidade_id", unidade.id);

    setMetricas({
      total_membros: totalMembros || 0,
      ativos_7d: ativos7d || 0,
      logins_hoje: loginsHoje || 0,
      novos_30d: novos30d || 0,
      capitulos_lidos: 0,
      versiculos_marcados: 0,
      posts_criados: postsCriados || 0,
      consultas_ia: consultasIA || 0
    });
  };

  const gerarConviteUsuario = async () => {
    const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);

    const { error } = await supabase.from("convites").insert({
      codigo,
      tipo: "usuario",
      email: "",
      unidade_id: unidade.id,
      criado_por: user?.id,
      expira_em: expiraEm.toISOString(),
      status: "pendente"
    });

    if (error) {
      toast.error("Erro ao gerar convite");
      return;
    }

    const link = `${window.location.origin}/convite/${codigo}`;
    setConviteLink(link);
    
    // Gerar QR Code usando API externa
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`);
    
    toast.success("Convite gerado com sucesso!");
  };

  const moderarPost = async (postId: string, acao: "ocultar" | "restaurar" | "deletar") => {
    if (acao === "deletar") {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      
      if (error) {
        toast.error("Erro ao deletar post");
        return;
      }
      
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deletado");
    } else {
      const novoStatus = acao === "ocultar" ? "oculto" : "ativo";
      const { error } = await supabase
        .from("posts")
        .update({ 
          status: novoStatus,
          moderado_por: user?.id,
          moderado_em: new Date().toISOString()
        })
        .eq("id", postId);
      
      if (error) {
        toast.error("Erro ao moderar post");
        return;
      }
      
      setPosts(posts.map(p => p.id === postId ? { ...p, status: novoStatus } : p));
      toast.success(acao === "ocultar" ? "Post ocultado" : "Post restaurado");
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Nunca";
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (membro: Membro) => {
    if (!membro.last_access) return <Badge variant="secondary">Nunca acessou</Badge>;
    const lastAccess = new Date(membro.last_access);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return <Badge className="bg-green-500">Ativo</Badge>;
    if (diffDays <= 30) return <Badge className="bg-yellow-500">Inativo</Badge>;
    return <Badge variant="destructive">Ausente</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-bold text-sm leading-none">{unidade?.nome_fantasia}</h1>
                <p className="text-xs text-muted-foreground">Painel Master</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchMetricas}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-20">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metricas.total_membros}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Ativos 7d
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{metricas.ativos_7d}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Logins Hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metricas.logins_hoje}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Novos 30d
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{metricas.novos_30d}</p>
            </CardContent>
          </Card>
        </div>

        {/* Barras de Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Posts Criados</span>
                  <span>{metricas.posts_criados}</span>
                </div>
                <Progress value={Math.min(metricas.posts_criados, 100)} />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Consultas IA</span>
                  <span>{metricas.consultas_ia}</span>
                </div>
                <Progress value={Math.min(metricas.consultas_ia, 100)} className="bg-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Gerar Convite para Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={gerarConviteUsuario}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convite para Novos Membros</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-4 py-4">
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    )}
                    {conviteLink && (
                      <div className="w-full">
                        <p className="text-xs text-muted-foreground mb-2">Ou compartilhe o link:</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={conviteLink} 
                            readOnly 
                            className="flex-1 text-xs p-2 border rounded bg-muted"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(conviteLink);
                              toast.success("Link copiado!");
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Este convite expira em 7 dias
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/${slug}/painel/planos`)}
          >
            <BookMarked className="h-6 w-6 text-primary" />
            <span className="font-medium">Planos de Leitura</span>
            <span className="text-xs text-muted-foreground">Criar e gerenciar planos</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/${slug}/painel/notificacoes`)}
          >
            <Bell className="h-6 w-6 text-primary" />
            <span className="font-medium">Notificações</span>
            <span className="text-xs text-muted-foreground">Enviar para membros</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="planos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planos">Planos</TabsTrigger>
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="moderacao">Moderação</TabsTrigger>
            <TabsTrigger value="ia">Uso de IA</TabsTrigger>
          </TabsList>

          <TabsContent value="planos">
            <PlanosDashboard unidadeId={unidade?.id} />
          </TabsContent>

          <TabsContent value="membros">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista de Membros</CardTitle>
                <CardDescription>
                  {metricas.total_membros} membros cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Streak</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membros.map(membro => (
                        <TableRow key={membro.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{membro.nome || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground">{membro.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(membro.last_access)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{membro.score?.score_total || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-500">🔥 {membro.score?.streak_atual || 0}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(membro)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderacao">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Moderação de Posts</CardTitle>
                <CardDescription>
                  Gerencie o conteúdo da rede social
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div 
                        key={post.id} 
                        className={`p-4 rounded-lg border ${post.status === 'oculto' ? 'bg-muted/50 opacity-60' : 'bg-card'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{post.usuario_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(post.created_at)}
                            </p>
                          </div>
                          <Badge variant={post.status === 'oculto' ? 'secondary' : 'default'}>
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3">{post.conteudo}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>❤️ {post.curtidas || 0}</span>
                            <span>💬 {post.comentarios || 0}</span>
                          </div>
                          <div className="flex gap-2">
                            {post.status === 'ativo' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => moderarPost(post.id, "ocultar")}
                              >
                                <EyeOff className="h-3 w-3 mr-1" />
                                Ocultar
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => moderarPost(post.id, "restaurar")}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Restaurar
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => moderarPost(post.id, "deletar")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {posts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum post encontrado
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ia">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Uso de IA
                </CardTitle>
                <CardDescription>
                  Estatísticas de consumo de IA da unidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{metricas.consultas_ia}</p>
                    <p className="text-xs text-muted-foreground">Total de consultas</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{unidade?.ai_limite_por_usuario_dia || 50}</p>
                    <p className="text-xs text-muted-foreground">Limite diário/usuário</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  O limite de requisições é configurado pelo Super User
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
