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
import { PageContainer } from "@/components/layout/PageContainer"; // Corrigido para Named Import
import { useBibleData } from "@/hooks/useBibleData"; // Corrigido para Named Import
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hook de dados da bíblia
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  // Estados para funcionalidades de leitura
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  // Carregar preferências e progresso
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
    setSelectedVerses([]); // Reseta seleção ao mudar de capítulo
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
      .sort((a, b) => a.versiculo - b.versiculo)
      .map((v) => `${v.versiculo}. ${v.texto}`)
      .join("\n");

    const finalMsg = `*${livroNome} ${capitulo}*\n\n${textToShare}\n\n_Lido no Zoe Church_`;

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
      toast.success("Capítulo concluído!");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen pb-32">
        {/* Header Superior */}
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
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
                        className="flex-1 font-serif"
                        onClick={() => setFontFamily("serif")}
                      >
                        Fonte Clássica
                      </Button>
                      <Button
                        variant={fontFamily === "sans" ? "default" : "outline"}
                        className="flex-1 font-sans"
                        onClick={() => setFontFamily("sans")}
                      >
                        Fonte Moderna
                      </Button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                disabled={selectedVerses.length === 0}
                className={selectedVerses.length > 0 ? "text-primary animate-pulse" : ""}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Área de Texto Sequencial */}
        <main className="flex-1 px-5 pt-8 max-w-2xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <article
              className={`
                ${fontFamily === "serif" ? "font-serif" : "font-sans"} 
                leading-relaxed text-justify selection:bg-primary/30
              `}
              style={{ fontSize: `${fontSize}px` }}
            >
              {versiculos?.map((v) => (
                <span
                  key={v.id}
                  onClick={() => handleToggleVerse(v.versiculo)}
                  className={`
                    inline transition-all duration-200 cursor-pointer rounded-sm px-0.5
                    ${selectedVerses.includes(v.versiculo) ? "bg-primary/20 ring-1 ring-primary/40" : "hover:bg-primary/5"}
                  `}
                >
                  <sup className="font-bold text-primary mr-1 text-[0.65em] select-none opacity-70">{v.versiculo}</sup>
                  <span className="text-foreground mr-1.5">{v.texto}</span>
                </span>
              ))}
            </article>
          )}

          {/* Navegação e Progresso */}
          {!loading && (
            <div className="mt-16 space-y-10 pb-20">
              <Button
                variant={isRead ? "secondary" : "default"}
                className="w-full rounded-full py-7 text-base font-semibold shadow-lg"
                onClick={markAsRead}
                disabled={isRead}
              >
                {isRead ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> Capítulo Lido
                  </>
                ) : (
                  "Marcar como lido"
                )}
              </Button>

              <div className="flex justify-between items-center border-t pt-8">
                <Button
                  variant="ghost"
                  disabled={!capituloAnterior}
                  onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}`)}
                  className="flex flex-col h-auto py-2 px-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Anterior</span>
                </Button>

                <div className="h-10 w-px bg-border" />

                <Button
                  variant="ghost"
                  disabled={!proximoCapitulo}
                  onClick={() => navigate(`/biblia/${livroId}/${proximoCapitulo}`)}
                  className="flex flex-col h-auto py-2 px-6 text-primary"
                >
                  <ChevronRight className="h-6 w-6" />
                  <span className="text-[10px] uppercase font-bold mt-1">Próximo</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </PageContainer>
  );
};

export default LeituraCapitulo;
