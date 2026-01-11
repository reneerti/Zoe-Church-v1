import { LucideIcon } from "lucide-react";
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
        "module-card w-full text-left opacity-0 animate-fade-in transition-all duration-300 hover:scale-[1.02]",
        `module-card-${variant}`,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Container do Ícone com as melhorias da imagem */}
        <div className="p-3 rounded-xl bg-white/25 backdrop-blur-sm shadow-inner flex-shrink-0">
          <Icon className="h-6 w-6 drop-shadow-sm" />
        </div>

        {/* Textos com as melhorias de espaçamento e sombra */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight drop-shadow-sm">
            {title}
          </h3>
          <p className="text-sm opacity-90 mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
  }
