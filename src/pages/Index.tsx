import { 
  BookOpen, 
  Music, 
  Calendar, 
  Heart, 
  Gift, 
  Video,
  Users,
  UserPlus
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ModuleCard } from "@/components/home/ModuleCard";
import { DailyVerse } from "@/components/home/DailyVerse";
import { QuickActions } from "@/components/home/QuickActions";

const modules = [
  {
    title: "Bíblia Sagrada",
    description: "Leia, marque e estude a Palavra de Deus",
    icon: BookOpen,
    path: "/biblia",
    variant: "bible" as const,
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

export default function Index() {
  return (
    <>
      <Header showSearch showNotifications />
      
      <PageContainer>
        {/* Greeting */}
        <div className="pt-4 pb-2 opacity-0 animate-fade-in">
          <p className="text-muted-foreground text-sm">Bem-vindo(a) à</p>
          <h2 className="text-2xl font-bold text-foreground">ZOE CHURCH</h2>
        </div>

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

      <BottomNav />
    </>
  );
}
