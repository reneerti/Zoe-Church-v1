import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Check,
  BookOpen,
  Share2,
  Settings2,
  Copy,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import PageContainer from "@/components/layout/PageContainer";
import { useBibleData } from "@/hooks/useBibleData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  // Estados para funcionalidades avançadas
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  // Carregar progresso e preferências
  useEffect(() => {
    const savedFontSize = localStorage.getItem("zoe-bible-font-size");
    if (savedFontSize) setFontSize(Number(savedFontSize));

    // Simulação de verificação de capítulo lido
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
      toast.info("Selecione versículos para compartilhar");
      return;
    }
    const textToShare = versiculos
      ?.filter((v) => selectedVerses.includes(v.versiculo))
      .map((v) => `${v.versiculo}. ${v.texto}`)
      .join("\n");

    const finalMsg = `*${livroNome} ${capitulo}*\n\n${textToShare}\n\n_Lido no Zoe Church App_`;

    if (navigator.share) {
      await navigator.share({ title: "Bíblia Zoe", text: finalMsg });
    } else {
      navigator.clipboard.writeText(finalMsg);
      toast.success("Copiado para a área de transferência!");
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
      toast.success("Capítulo concluído! +10 pontos de fé.");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen pb-32">
        {/* Header Fixo com Ações */}
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-lg font-bold leading-none">{livroNome}</h1>
                <p className="text-xs text-muted-foreground font-medium">Capítulo {capitulo}</p>
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
                    <DrawerTitle>Configurações de Leitura</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Tamanho da Fonte: {fontSize}px</label>
                      <Slider
                        value={[fontSize]}
                        min={14}
                        max={32}
                        step={1}
                        onValueChange={(val) => {
                          setFontSize(val[0]);
                          localStorage.setItem("zoe-bible-font-size", val[0].toString());
                        }}
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant={fontFamily === "serif" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFontFamily("serif")}
                      >
                        Serifada
                      </Button>
                      <Button
                        variant={fontFamily === "sans" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFontFamily("sans")}
                      >
                        Moderna
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

        {/* Área de Leitura Sequencial */}
        <main className="flex-1 px-5 pt-6 max-w-3xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <article
              className={`
                ${fontFamily === "serif" ? "font-serif" : "font-sans"} 
                leading-relaxed text-justify select-none
              `}
              style={{ fontSize: `${fontSize}px` }}
            >
              {versiculos?.map((v) => (
                <span
                  key={v.id}
                  onClick={() => handleToggleVerse(v.versiculo)}
                  className={`
                    inline transition-all duration-200 cursor-pointer rounded-sm px-0.5
                    ${selectedVerses.includes(v.versiculo) ? "bg-primary/30" : "hover:bg-primary/5"}
                  `}
                >
                  <sup className="font-bold text-primary mr-1 text-[0.6em] opacity-80 select-none">{v.versiculo}</sup>
                  <span className="text-foreground mr-1.5">{v.texto}</span>
                </span>
              ))}
            </article>
          )}

          {/* Ações de Fim de Capítulo */}
          {!loading && (
            <div className="mt-12 flex flex-col items-center gap-6 pb-10">
              <Button
                variant={isRead ? "secondary" : "default"}
                className="w-full max-w-xs rounded-full py-6 text-base shadow-lg"
                onClick={markAsRead}
                disabled={isRead}
              >
                {isRead ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> Concluído
                  </>
                ) : (
                  "Marcar como lido"
                )}
              </Button>

              <div className="flex justify-between w-full border-t pt-8">
                <Button
                  variant="ghost"
                  disabled={!capituloAnterior}
                  onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}`)}
                  className="flex flex-col h-auto py-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Anterior</span>
                </Button>

                <div className="h-10 w-[1px] bg-border self-center" />

                <Button
                  variant="ghost"
                  disabled={!proximoCapitulo}
                  onClick={() => navigate(`/biblia/${livroId}/${proximoCapitulo}`)}
                  className="flex flex-col h-auto py-2 text-primary"
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-bold">Próximo</span>
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Rodapé Zoe */}
        <div className="px-5 mb-4">
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-tight">
              Toque nos versículos para selecionar e compartilhar ou destacar passagens importantes.
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </PageContainer>
  );
};

export default LeituraCapitulo;
