import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  Music, 
  Calendar, 
  BookMarked,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/biblia", icon: BookOpen, label: "Bíblia" },
  { path: "/planos", icon: BookMarked, label: "Planos" },
  { path: "/harpa", icon: Music, label: "Harpa" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={cn("bottom-nav", className)}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "bottom-nav-item flex-1",
                isActive && "active"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
