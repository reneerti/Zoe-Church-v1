import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Music,
  BookMarked,
  User,
  Shield // Added Shield icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
  const { isSuperUser } = useAuth(); // Get super user status

  // Add Admin item if super user
  const currentNavItems = isSuperUser
    ? [
      ...navItems.slice(0, 4), // First 4 items
      { path: "/admin/dashboard", icon: Shield, label: "Admin" }, // Admin link
      navItems[4] // Profile at the end
    ]
    : navItems;

  return (
    <nav className={cn("bottom-nav sticky bottom-0 z-50 bg-background border-t", className)}>
      <div className="flex items-center justify-around max-w-lg mx-auto w-full">
        {currentNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "bottom-nav-item flex-1 py-3 flex flex-col items-center justify-center min-h-[60px]",
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
