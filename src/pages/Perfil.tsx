import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  BookOpen, 
  LogOut,
  ChevronRight,
  Palette,
  HelpCircle,
  Shield,
  MessageCircle,
  Camera,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScoreCard } from "@/components/gamification/ScoreCard";
import { Ranking } from "@/components/gamification/Ranking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserScore {
  score_total: number;
  nivel: number;
  nivel_nome: string;
  xp_atual: number;
  xp_proximo_nivel: number;
  streak_atual: number;
  streak_maximo: number;
  capitulos_lidos: number;
  versiculos_marcados: number;
  devocionais_lidos: number;
  devocionais_criados: number;
  badges: any[];
}

export default function Perfil() {
  const navigate = useNavigate();
  const { user, profile, signOut, isSuperUser, isMaster } = useAuth();
  const [darkMode, setDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );
  const [notifications, setNotifications] = useState(true);
  const [score, setScore] = useState<UserScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchData = async () => {
    try {
      // Buscar score do usuário
      if (user?.id) {
        const { data: scoreData } = await supabase
          .from("scores")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (scoreData) {
          setScore(scoreData as UserScore);
        }
      }

      // Buscar dados da unidade
      if (profile?.unidadeId) {
        const { data: unidadeData } = await supabase
          .from("unidades")
          .select("nome_fantasia, apelido_app, gamificacao_ativa, ranking_publico")
          .eq("id", profile.unidadeId)
          .single();
        
        setUnidade(unidadeData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast.success("Você saiu da sua conta");
  };

  const isLoggedIn = !!user;
  const userName = profile?.nome || user?.email?.split('@')[0] || "Visitante";
  const userEmail = user?.email || "Faça login para sincronizar";

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Perfil</h1>
          </div>
          {isLoggedIn && (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <PageContainer>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="py-4">
              <div 
                className={cn(
                  "p-5 rounded-2xl bg-card border border-border",
                  "opacity-0 animate-fade-in"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-8 w-8 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    {isLoggedIn && (
                      <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Camera className="h-3 w-3 text-primary-foreground" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{userName}</h2>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                    {(isSuperUser || isMaster) && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                        <Shield className="h-3 w-3" />
                        {isSuperUser ? "Super Admin" : "Master"}
                      </span>
                    )}
                  </div>
                </div>

                {!isLoggedIn && (
                  <Button 
                    className="w-full mt-4" 
                    variant="default"
                    onClick={() => navigate("/auth")}
                  >
                    Fazer Login
                  </Button>
                )}
              </div>
            </div>

            {/* Gamification Section */}
            {isLoggedIn && unidade?.gamificacao_ativa && (
              <div className="py-2">
                <Tabs defaultValue="score" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3">
                    <TabsTrigger value="score">Minha Jornada</TabsTrigger>
                    <TabsTrigger value="ranking" disabled={!unidade?.ranking_publico}>
                      Ranking
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="score">
                    <ScoreCard score={score} />
                  </TabsContent>

                  <TabsContent value="ranking">
                    <Ranking />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Legacy Stats for non-gamification */}
            {isLoggedIn && !unidade?.gamificacao_ativa && (
              <div className="py-2">
                <h3 className="font-semibold mb-3">Estatísticas de Leitura</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <StatCard 
                    label="Versículos Lidos" 
                    value={score?.versiculos_marcados || 0} 
                    delay={100}
                  />
                  <StatCard 
                    label="Capítulos Lidos" 
                    value={score?.capitulos_lidos || 0} 
                    delay={150}
                  />
                  <StatCard 
                    label="Dias Seguidos" 
                    value={score?.streak_atual || 0} 
                    icon="🔥"
                    delay={200}
                  />
                  <StatCard 
                    label="Devocionais" 
                    value={score?.devocionais_lidos || 0} 
                    delay={250}
                  />
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="py-4">
              <h3 className="font-semibold mb-3">Configurações</h3>
              
              <div className="space-y-1">
                {/* Dark Mode */}
                <SettingItem 
                  icon={darkMode ? Moon : Sun}
                  label="Modo Escuro"
                  delay={300}
                >
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={handleDarkMode}
                  />
                </SettingItem>

                {/* Notifications */}
                <SettingItem 
                  icon={Bell}
                  label="Notificações"
                  delay={350}
                >
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications}
                  />
                </SettingItem>

                {/* Reading Settings */}
                <SettingItem 
                  icon={BookOpen}
                  label="Configurações de Leitura"
                  onClick={() => {}}
                  delay={400}
                />

                {/* Theme */}
                <SettingItem 
                  icon={Palette}
                  label="Aparência"
                  onClick={() => {}}
                  delay={450}
                />
              </div>
            </div>

            {/* Support */}
            <div className="py-4">
              <h3 className="font-semibold mb-3">Suporte</h3>
              
              <div className="space-y-1">
                <SettingItem 
                  icon={HelpCircle}
                  label="Ajuda"
                  onClick={() => {}}
                  delay={500}
                />
                <SettingItem 
                  icon={MessageCircle}
                  label="Fale Conosco"
                  onClick={() => {}}
                  delay={550}
                />
                <SettingItem 
                  icon={Shield}
                  label="Termos e Privacidade"
                  onClick={() => navigate("/termos")}
                  delay={600}
                />
              </div>
            </div>

            {/* Logout */}
            {isLoggedIn && (
              <div className="py-4">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>
              </div>
            )}

            {/* App Info */}
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {unidade?.apelido_app || "ZOE CHURCH"} App
              </p>
              <p className="text-xs text-muted-foreground">Versão 1.0.0</p>
            </div>
          </>
        )}
      </PageContainer>

      <BottomNav />
    </>
  );
}

function StatCard({ 
  label, 
  value, 
  icon,
  delay 
}: { 
  label: string; 
  value: number; 
  icon?: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-card border border-border text-center",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl font-bold text-primary">
        {icon || value}
        {icon && <span className="ml-1">{value}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function SettingItem({ 
  icon: Icon, 
  label, 
  children, 
  onClick,
  delay 
}: { 
  icon: React.ElementType; 
  label: string; 
  children?: React.ReactNode;
  onClick?: () => void;
  delay: number;
}) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl",
        "bg-card border border-border",
        onClick && "hover:bg-muted/50 transition-colors cursor-pointer",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      
      {children || (onClick && <ChevronRight className="h-5 w-5 text-muted-foreground" />)}
    </Component>
  );
}
