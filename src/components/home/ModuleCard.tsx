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
        "module-card w-full text-left opacity-0 animate-fade-in",
        `module-card-${variant}`,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Ícone com fundo colorido */}
        <div className="module-icon p-2.5 rounded-xl flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>

        {/* Textos */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight">
            {title}
          </h3>
          <p className="text-sm mt-0.5 line-clamp-1">
            {description}
          </p>
        </div>

        {/* Seta indicadora */}
        <ChevronRight className="h-5 w-5 module-arrow flex-shrink-0" />
      </div>
    </button>
  );
}
