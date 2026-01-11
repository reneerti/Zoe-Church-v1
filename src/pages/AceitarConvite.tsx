import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Loader2, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Convite {
  id: string;
  unidade_id: string;
  tipo: 'master' | 'usuario';
  email: string;
  nome: string;
  criado_por: string | null;
  cargo: string | null;
  codigo: string;
  status: string;
  expira_em: string;
}

interface Unidade {
  id: string;
  slug: string;
  nome_fantasia: string;
  apelido_app: string;
  logo_url: string | null;
}

export default function AceitarConvite() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, signInWithGoogle, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [convite, setConvite] = useState<Convite | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchConvite();
  }, [codigo]);

  useEffect(() => {
    // Se usuário já está logado, processar convite automaticamente
    if (user && convite && convite.status === 'pendente') {
      processarConvite(user.id);
    }
  }, [user, convite]);

  const fetchConvite = async () => {
    try {
      const { data: conviteData, error: conviteError } = await supabase
        .from("convites")
        .select("*")
        .eq("codigo", codigo)
        .single();

      if (conviteError || !conviteData) {
        setError("Convite não encontrado");
        setLoading(false);
        return;
      }

      // Verificar status
      if (conviteData.status === 'aceito') {
        setError("Este convite já foi utilizado");
        setLoading(false);
        return;
      }

      if (conviteData.status === 'cancelado') {
        setError("Este convite foi cancelado");
        setLoading(false);
        return;
      }

      // Verificar expiração
      if (new Date(conviteData.expira_em) < new Date()) {
        // Atualizar status para expirado
        await supabase
          .from("convites")
          .update({ status: "expirado" })
          .eq("id", conviteData.id);

        setError("Este convite expirou");
        setLoading(false);
        return;
      }

      setConvite(conviteData as Convite);

      // Buscar unidade
      const { data: unidadeData } = await supabase
        .from("unidades")
        .select("id, slug, nome_fantasia, apelido_app, logo_url")
        .eq("id", conviteData.unidade_id)
        .single();

      setUnidade(unidadeData as Unidade);
    } catch (err) {
      console.error("Erro ao buscar convite:", err);
      setError("Erro ao carregar convite");
    } finally {
      setLoading(false);
    }
  };

  const processarConvite = async (userId: string) => {
    if (!convite || !unidade) return;

    setProcessing(true);
    try {
      if (convite.tipo === 'master') {
        // Verificar limite de masters
        const { count } = await supabase
          .from("masters")
          .select("*", { count: "exact", head: true })
          .eq("unidade_id", convite.unidade_id)
          .eq("is_active", true);

        const { data: unidadeData } = await supabase
          .from("unidades")
          .select("limite_masters")
          .eq("id", convite.unidade_id)
          .single();

        if (count && unidadeData && count >= unidadeData.limite_masters) {
          toast({
            title: "Limite atingido",
            description: "Esta unidade já atingiu o limite de masters",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Criar master
        const { error: masterError } = await supabase.from("masters").insert({
          user_id: userId,
          unidade_id: convite.unidade_id,
          email: convite.email,
          nome: convite.nome,
          cargo: convite.cargo,
          convite_id: convite.id,
          is_principal: count === 0, // Primeiro master é principal
        });

        if (masterError) throw masterError;
      } else {
        // Verificar limite de usuários
        const { count } = await supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true })
          .eq("unidade_id", convite.unidade_id)
          .eq("is_active", true);

        const { data: unidadeData } = await supabase
          .from("unidades")
          .select("limite_usuarios")
          .eq("id", convite.unidade_id)
          .single();

        if (count && unidadeData && count >= unidadeData.limite_usuarios) {
          toast({
            title: "Limite atingido",
            description: "Esta unidade já atingiu o limite de usuários",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Criar usuário
        const { error: usuarioError } = await supabase.from("usuarios").insert({
          user_id: userId,
          unidade_id: convite.unidade_id,
          email: convite.email,
          nome: convite.nome,
          convite_id: convite.id,
          convidado_por: convite.criado_por,
        });

        if (usuarioError) throw usuarioError;

        // Criar score inicial
        await supabase.from("scores").insert({
          user_id: userId,
          unidade_id: convite.unidade_id,
        });
      }

      // Atualizar convite
      await supabase
        .from("convites")
        .update({
          status: "aceito",
          aceito_por: userId,
          aceito_em: new Date().toISOString(),
        })
        .eq("id", convite.id);

      // Atualizar perfil no contexto
      await refreshProfile();

      toast({
        title: "Bem-vindo!",
        description: `Você agora faz parte do ${unidade.apelido_app}`,
      });

      // Redirecionar
      if (convite.tipo === 'master') {
        navigate(`/painel`);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Erro ao processar convite:", err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível processar o convite",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!convite) return;

    setProcessing(true);
    try {
      if (authMode === 'signup') {
        const { error } = await signUp(convite.email, password, convite.nome);
        if (error) throw error;

        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar a conta",
        });
      } else {
        const { error } = await signIn(convite.email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro na autenticação",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
    // Salvar código do convite no localStorage para recuperar após OAuth
    localStorage.setItem('convite_codigo', codigo || '');
    
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <X className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Convite Inválido</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Ir para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-xl font-bold">Processando convite...</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {unidade?.logo_url && (
            <img 
              src={unidade.logo_url} 
              alt={unidade.apelido_app}
              className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
            />
          )}
          <CardTitle className="text-2xl">Você foi convidado!</CardTitle>
          <CardDescription>
            {convite?.tipo === 'master' ? (
              <>Para ser <strong>{convite.cargo || 'Administrador'}</strong> no app <strong>{unidade?.apelido_app}</strong></>
            ) : (
              <>Para participar do app <strong>{unidade?.apelido_app}</strong></>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dados do convite */}
          <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Convidado:</span>
              <span className="font-medium">{convite?.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{convite?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Válido até:</span>
              <span className="font-medium">
                {convite && new Date(convite.expira_em).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Formulário de autenticação */}
          <div className="space-y-4">
            {/* Google */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleAuth}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou
                </span>
              </div>
            </div>

            {/* Email/Senha */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={convite?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label>{authMode === 'signup' ? 'Criar Senha' : 'Senha'}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {authMode === 'signup' ? 'Criar Conta e Aceitar' : 'Entrar e Aceitar'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {authMode === 'signup' ? (
                <>
                  Já tem conta?{' '}
                  <button 
                    type="button"
                    className="text-primary underline"
                    onClick={() => setAuthMode('login')}
                  >
                    Fazer login
                  </button>
                </>
              ) : (
                <>
                  Não tem conta?{' '}
                  <button 
                    type="button"
                    className="text-primary underline"
                    onClick={() => setAuthMode('signup')}
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ao aceitar, você concorda com os{' '}
            <a href="/termos" className="text-primary underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="/privacidade" className="text-primary underline">Política de Privacidade</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
