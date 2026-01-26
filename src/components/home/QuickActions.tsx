import { BookOpen, Search, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const actions = [
  { icon: BookOpen, label: "Continuar Leitura", path: "/biblia", color: "bg-bible/10 text-bible" },
  { icon: Search, label: "Buscar Versículo", path: "/biblia/busca", color: "bg-primary/10 text-primary" },
  { icon: Music, label: "Harpa Cristã", path: "/harpa", color: "bg-harpa/10 text-harpa" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
      {actions.map((action, index) => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full",
            "whitespace-nowrap text-sm font-medium",
            "transition-all duration-200 hover:scale-105 active:scale-95",
            "opacity-0 animate-fade-in",
            action.color
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <action.icon className="h-4 w-4" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
