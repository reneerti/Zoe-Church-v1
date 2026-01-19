import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, Settings2, Check, BookOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageContainer } from "@/components/layout/PageContainer"; // Ajustado para named export
import { useBibleData } from "@/hooks/useBibleData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  useEffect(() => {
    const savedFontSize = localStorage.getItem("zoe-bible-font-size");
    if (savedFontSize) setFontSize(Number(savedFontSize));

    const checkReadStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("book_id", livroId)
          .eq("chapter", capitulo)
          .single();
        if (data) setIsRead(true);
      }
    };
    checkReadStatus();
  }, [livroId, capitulo]);

  const handleToggleVerse = (num: number) => {
    setSelectedVerses((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]));
  };

  const handleShare = async () => {
    if (selectedVerses.length === 0) {
      toast.info("Toque nos versículos para selecionar");
      return;
    }
    const textToShare = versiculos
      ?.filter((v) => selectedVerses.includes(v.versiculo))
      .map((v) => `${v.versiculo}. ${v.texto}`)
      .join("\n");

    const finalMsg = `*${livroNome} ${capitulo}*\n\n${textToShare}\n\n_Lido no Zoe App_`;

    if (navigator.share) {
      await navigator.share({ title: "Bíblia Zoe", text: finalMsg });
    } else {
      navigator.clipboard.writeText(finalMsg);
      toast.success("Copiado!");
    }
    setSelectedVerses([]);
  };

  const markAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_progress").upsert({
      user_id: user.id,
      book_id: livroId,
      chapter: Number(capitulo),
      completed_at: new Date().toISOString(),
    });

    if (!error) {
      setIsRead(true);
      toast.success("Capítulo lido!");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen pb-32">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-lg font-bold leading-none">{livroNome || "Carregando..."}</h1>
                <p className="text-xs text-muted-foreground">Capítulo {capitulo}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Configurações</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Tamanho da Fonte: {fontSize}px</label>
                      <Slider value={[fontSize]} min={14} max={30} step={1} onValueChange={(v) => setFontSize(v[0])} />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant={fontFamily === "serif" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFontFamily("serif")}
                      >
                        Serifa
                      </Button>
                      <Button
                        variant={fontFamily === "sans" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFontFamily("sans")}
                      >
                        Sem Serifa
                      </Button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
              <Button variant="ghost" size="icon" onClick={handleShare} disabled={selectedVerses.length === 0}>
                <Share2 className={`h-5 w-5 ${selectedVerses.length > 0 ? "text-primary" : ""}`} />
              </Button>
            </div>
          </div>
        </header>

        {/* Texto Sequencial */}
        <main className="flex-1 px-5 pt-6 max-w-2xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div
              className={`${fontFamily === "serif" ? "font-serif" : "font-sans"} leading-relaxed text-justify`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {versiculos?.map((v) => (
                <span
                  key={v.id}
                  onClick={() => handleToggleVerse(v.versiculo)}
                  className={`inline transition-colors cursor-pointer rounded px-0.5 ${selectedVerses.includes(v.versiculo) ? "bg-primary/20 ring-1 ring-primary/30" : "hover:bg-primary/5"}`}
                >
                  <sup className="font-bold text-primary mr-1 text-[0.6em] select-none">{v.versiculo}</sup>
                  <span className="text-foreground mr-1.5">{v.texto}</span>
                </span>
              ))}
            </div>
          )}

          {/* Navegação e Progresso */}
          {!loading && (
            <div className="mt-12 space-y-8">
              <Button
                variant={isRead ? "secondary" : "default"}
                className="w-full rounded-full py-6"
                onClick={markAsRead}
                disabled={isRead}
              >
                {isRead ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> Lido
                  </>
                ) : (
                  "Marcar como lido"
                )}
              </Button>

              <div className="flex justify-between items-center border-t pt-6">
                <Button
                  variant="ghost"
                  disabled={!capituloAnterior}
                  onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}`)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <Button
                  variant="ghost"
                  disabled={!proximoCapitulo}
                  onClick={() => navigate(`/biblia/${livroId}/${proximoCapitulo}`)}
                >
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </main>

        <div className="px-5 mt-8 mb-10">
          <div className="bg-muted p-4 rounded-xl flex gap-3 items-start">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Toque nos versículos para selecionar, copiar ou compartilhar passagens.
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </PageContainer>
  );
};

export default LeituraCapitulo;
