import { 
  ChevronLeft, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  BookOpen, 
  Settings, 
  LogOut,
  ChevronRight,
  Palette,
  HelpCircle,
  Shield,
  MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const user = {
  name: "Visitante",
  email: "Faça login para sincronizar",
  photo: null,
  isLoggedIn: false,
};

const readingStats = {
  versesRead: 0,
  booksCompleted: 0,
  streak: 0,
  highlights: 0,
};

export default function Perfil() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
        </div>
      </header>

      <PageContainer>
        {/* Profile Card */}
        <div className="py-4">
          <div 
            className={cn(
              "p-5 rounded-2xl bg-card border border-border",
              "opacity-0 animate-fade-in"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {!user.isLoggedIn && (
              <Button className="w-full mt-4" variant="default">
                Fazer Login
              </Button>
            )}
          </div>
        </div>

        {/* Reading Stats */}
        <div className="py-2">
          <h3 className="font-semibold mb-3">Estatísticas de Leitura</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              label="Versículos Lidos" 
              value={readingStats.versesRead} 
              delay={100}
            />
            <StatCard 
              label="Livros Completos" 
              value={readingStats.booksCompleted} 
              delay={150}
            />
            <StatCard 
              label="Dias Seguidos" 
              value={readingStats.streak} 
              icon="🔥"
              delay={200}
            />
            <StatCard 
              label="Marcações" 
              value={readingStats.highlights} 
              delay={250}
            />
          </div>
        </div>

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
              label="Privacidade"
              onClick={() => {}}
              delay={600}
            />
          </div>
        </div>

        {/* App Info */}
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">ZOE CHURCH App</p>
          <p className="text-xs text-muted-foreground">Versão 1.0.0</p>
        </div>
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
