import { useEffect, useState } from "react";
import { 
  BookOpen, 
  Music, 
  Calendar, 
  Heart, 
  Gift, 
  Video,
  Users,
  UserPlus,
  Shield,
  Settings,
  BookMarked
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ModuleCard } from "@/components/home/ModuleCard";
import { DailyVerse } from "@/components/home/DailyVerse";
import { QuickActions } from "@/components/home/QuickActions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PushNotificationBanner } from "@/components/notifications/PushNotificationManager";

const modules = [
  {
    title: "Bíblia Sagrada",
    description: "Leia, marque e estude a Palavra de Deus",
    icon: BookOpen,
    path: "/biblia",
    variant: "bible" as const,
  },
  {
    title: "Planos de Leitura",
    description: "Siga planos organizados para ler a Bíblia",
    icon: BookMarked,
    path: "/planos",
    variant: "planos" as const,
  },
  {
    title: "Harpa Cristã",
    description: "Todos os 640 hinos para louvar",
    icon: Music,
    path: "/harpa",
    variant: "harpa" as const,
  },
  {
    title: "Agenda",
    description: "Eventos e programações da igreja",
    icon: Calendar,
    path: "/agenda",
    variant: "agenda" as const,
  },
  {
    title: "Devocional",
    description: "Meditações diárias e reflexões",
    icon: Heart,
    path: "/devocional",
    variant: "devocional" as const,
  },
  {
    title: "Ofertas e Dízimos",
    description: "Contribua com a obra de Deus",
    icon: Gift,
    path: "/ofertas",
    variant: "ofertas" as const,
  },
  {
    title: "Vídeos",
    description: "Mensagens e conteúdos em vídeo",
    icon: Video,
    path: "/videos",
    variant: "videos" as const,
  },
  {
    title: "Liderança",
    description: "Conheça nossos líderes e pastores",
    icon: Users,
    path: "/lideranca",
    variant: "lideranca" as const,
  },
  {
    title: "Novos Convertidos",
    description: "Bem-vindo à família de Deus",
    icon: UserPlus,
    path: "/novos-convertidos",
    variant: "convertidos" as const,
  },
];

interface UnidadeInfo {
  nome_fantasia: string;
  apelido_app: string;
  logo_url: string | null;
  logo_icon_url: string | null;
  cor_primaria: string | null;
}

export default function Index() {
  const { user, profile, isSuperUser, isMaster, unidadeSlug } = useAuth();
  const navigate = useNavigate();
  const [unidade, setUnidade] = useState<UnidadeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnidade = async () => {
      if (profile?.unidadeId) {
        const { data } = await supabase
          .from("unidades")
          .select("nome_fantasia, apelido_app, logo_url, logo_icon_url, cor_primaria")
          .eq("id", profile.unidadeId)
          .single();
        
        if (data) {
          setUnidade(data);
        }
      }
      setLoading(false);
    };

    if (profile) {
      fetchUnidade();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const churchName = unidade?.apelido_app || unidade?.nome_fantasia || "Minha Igreja";

  return (
    <>
      <Header showSearch showNotifications />
      
      <PageContainer>
        {/* Greeting */}
        <div className="pt-4 pb-2 opacity-0 animate-fade-in">
          <p className="text-muted-foreground text-sm">
            {user ? `Olá, ${profile?.nome || 'bem-vindo(a)'}!` : 'Bem-vindo(a) à'}
          </p>
          <h2 className="text-2xl font-bold text-foreground">{churchName.toUpperCase()}</h2>
        </div>

        {/* Admin/Master Quick Access */}
        {(isSuperUser || isMaster) && (
          <div className="py-3 flex gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            {isSuperUser && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate("/admin")}
              >
                <Shield className="h-4 w-4" />
                Painel Admin
              </Button>
            )}
            {isMaster && unidadeSlug && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate(`/${unidadeSlug}/painel`)}
              >
                <Settings className="h-4 w-4" />
                Painel Master
              </Button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="py-3">
          <QuickActions />
        </div>

        {/* Daily Verse */}
        <div className="py-3">
          <DailyVerse />
        </div>

        {/* Section Title */}
        <div className="pt-4 pb-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h3 className="text-lg font-semibold text-foreground">Explorar</h3>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 gap-3 pb-6">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.path}
              {...module}
              delay={150 + index * 50}
            />
          ))}
        </div>
      </PageContainer>

      <PushNotificationBanner />
      <BottomNav />
    </>
  );
}
