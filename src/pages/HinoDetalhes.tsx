import { useState } from "react";
import { ChevronLeft, Heart, Share2, ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { useHarpaHymn, useFavoriteHymns, useToggleFavoriteHymn } from "@/hooks/useHarpaData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function HinoDetalhes() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const hymnNumber = parseInt(numero || "1");
  const { data: hymn, isLoading } = useHarpaHymn(hymnNumber);
  const { data: favoriteHymns = [] } = useFavoriteHymns(user?.id);
  const toggleFavorite = useToggleFavoriteHymn(user?.id);
  
  const [fontSize, setFontSize] = useState(18);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isFavorite = hymn ? favoriteHymns.some(f => f.hymn_id === hymn.id) : false;

  const handleFavorite = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar seus hinos favoritos",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!hymn) return;

    toggleFavorite.mutate(
      { hymnId: hymn.id, isFavorite },
      {
        onSuccess: () => {
          toast({
            title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
            description: isFavorite 
              ? `"${hymn.title}" foi removido dos seus favoritos`
              : `"${hymn.title}" foi adicionado aos seus favoritos`,
          });
        },
      }
    );
  };

  const handleShare = async () => {
    if (!hymn) return;

    const shareData = {
      title: `Harpa Cristã - ${hymn.hymn_number}. ${hymn.title}`,
      text: `Confira o hino "${hymn.title}" da Harpa Cristã`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência",
        });
      }
    } catch (error) {
      // User cancelled share
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 14));

  const navigateHymn = (direction: "prev" | "next") => {
    const newNumber = direction === "prev" ? hymnNumber - 1 : hymnNumber + 1;
    if (newNumber >= 1 && newNumber <= 640) {
      navigate(`/harpa/${newNumber}`);
    }
  };

  if (isLoading) {
    return (
      <>
        <header className="sticky top-0 z-40 glass safe-area-inset-top">
          <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-6 w-32" />
            <div className="w-9" />
          </div>
        </header>
        <PageContainer>
          <div className="py-8 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <div className="space-y-2 pt-8">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  if (!hymn) {
    return (
      <>
        <header className="sticky top-0 z-40 glass safe-area-inset-top">
          <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Hino não encontrado</h1>
            <div className="w-9" />
          </div>
        </header>
        <PageContainer>
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              Este hino ainda não está disponível no banco de dados.
            </p>
            <Button onClick={() => navigate("/harpa")}>
              Voltar para Harpa Cristã
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 glass safe-area-inset-top transition-opacity",
        isFullscreen && "opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => navigate("/harpa")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="font-bold text-lg truncate max-w-[180px]">
            Hino {hymn.hymn_number}
          </h1>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleFavorite}
            >
              <Heart 
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorite ? "fill-ofertas text-ofertas" : ""
                )} 
              />
            </Button>
          </div>
        </div>
      </header>

      <PageContainer className={cn(isFullscreen && "pt-0")}>
        {/* Title Section */}
        <div className="py-6 text-center border-b border-border mb-6">
          <div className="w-16 h-16 rounded-2xl bg-harpa/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-harpa">{hymn.hymn_number}</span>
          </div>
          <h2 className="text-xl font-bold mb-2">{hymn.title}</h2>
          {hymn.author && (
            <p className="text-sm text-muted-foreground">{hymn.author}</p>
          )}
        </div>

        {/* Lyrics */}
        <div 
          className="prose prose-lg max-w-none pb-8"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {hymn.lyrics}
          </div>

          {hymn.chorus && (
            <div className="mt-6 p-4 rounded-xl bg-harpa/5 border border-harpa/20">
              <p className="font-semibold text-harpa mb-2 text-sm uppercase tracking-wide">
                Coro
              </p>
              <div className="whitespace-pre-wrap italic">
                {hymn.chorus}
              </div>
            </div>
          )}
        </div>

        {/* Navigation between hymns */}
        <div className="flex justify-between items-center py-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateHymn("prev")}
            disabled={hymnNumber <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {hymnNumber} / 640
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateHymn("next")}
            disabled={hymnNumber >= 640}
            className="gap-1"
          >
            Próximo
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </PageContainer>

      {/* Font Size Controls (floating) */}
      <div className={cn(
        "fixed right-4 bottom-24 flex flex-col gap-2 z-30 transition-opacity",
        isFullscreen && "bottom-4"
      )}>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={increaseFontSize}
          disabled={fontSize >= 32}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={decreaseFontSize}
          disabled={fontSize <= 14}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <BottomNav className={cn(isFullscreen && "hidden")} />
    </>
  );
}
