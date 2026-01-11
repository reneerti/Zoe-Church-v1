import { Sparkles, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const dailyVerse = {
  text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
  reference: "João 3:16",
  version: "NVI"
};

export function DailyVerse() {
  const handleCopy = async () => {
    const fullText = `"${dailyVerse.text}"\n— ${dailyVerse.reference} (${dailyVerse.version})`;
    await navigator.clipboard.writeText(fullText);
    toast.success("Versículo copiado!");
  };

  const handleShare = async () => {
    const fullText = `"${dailyVerse.text}"\n— ${dailyVerse.reference} (${dailyVerse.version})`;
    if (navigator.share) {
      await navigator.share({
        title: "Versículo do Dia",
        text: fullText,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 hero-gradient text-primary-foreground opacity-0 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider opacity-90">
            Versículo do Dia
          </span>
        </div>
        
        <blockquote className="font-serif text-base leading-relaxed mb-4">
          "{dailyVerse.text}"
        </blockquote>
        
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-90">
            {dailyVerse.reference} • {dailyVerse.version}
          </p>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
