import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ZoeAIButtonProps {
  className?: string;
}

export function ZoeAIButton({ className }: ZoeAIButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/chat")}
      className={cn(
        "w-full gap-3 py-6 rounded-2xl text-white font-semibold shadow-lg",
        "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500",
        "hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400",
        "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-300",
        "border border-white/20",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 bg-white/20 rounded-xl p-2.5">
        <Sparkles className="h-5 w-5 text-white animate-pulse" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-lg font-bold tracking-tight">ZOE AI</span>
        <span className="text-xs text-white/80 font-normal">Pergunte sobre a Bíblia</span>
      </div>
    </Button>
  );
}
