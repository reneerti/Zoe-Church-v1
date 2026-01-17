import { LucideIcon, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  variant: 'bible' | 'harpa' | 'agenda' | 'devocional' | 'ofertas' | 'videos' | 'lideranca' | 'convertidos' | 'planos';
  className?: string;
  delay?: number;
}

export function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  path, 
  variant,
  className,
  delay = 0
}: ModuleCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={cn(
        "module-card w-full text-left opacity-0 animate-fade-in transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        `module-card-${variant}`,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Ícone com fundo translúcido */}
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
          <Icon className="h-6 w-6 text-white drop-shadow-md" />
        </div>

        {/* Textos */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight text-white drop-shadow-md">
            {title}
          </h3>
          <p className="text-sm text-white/90 mt-0.5 line-clamp-1">
            {description}
          </p>
        </div>

        {/* Seta indicadora */}
        <ChevronRight className="h-5 w-5 text-white/70 flex-shrink-0" />
      </div>
    </button>
  );
}
