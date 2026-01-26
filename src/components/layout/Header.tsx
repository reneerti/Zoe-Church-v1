import { Bell, Search, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoZoe from '@/assets/logo-zoe.png';
import { useNavigate } from "react-router-dom";
import { useNotificationListener } from "@/components/notifications/PushNotificationManager";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showMenu?: boolean;
  className?: string;
  transparent?: boolean;
  showLogo?: boolean;
}

export function Header({ 
  title = "ZOE CHURCH", 
  showSearch = false, 
  showNotifications = true,
  showMenu = false,
  className,
  transparent = false,
  showLogo = false
}: HeaderProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationListener();
  
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full safe-area-inset-top",
      transparent ? "bg-transparent" : "glass",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showMenu && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {showLogo ? (
            <img src={logoZoe} alt="Zoe Church" className="h-8 w-auto" />
          ) : (
            <h1 className="font-bold text-lg tracking-tight">{title}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-primary"
            onClick={() => navigate('/chat')}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          {showNotifications && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 relative"
              onClick={() => navigate('/notificacoes')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
