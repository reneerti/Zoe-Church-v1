import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Settings2,
  Check,
  Info,
  Copy,
  Type,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageContainer } from "@/components/layout/PageContainer"; // Corrigido: Named
import useBibleData from "@/hooks/useBibleData"; // Corrigido: Default
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook de dados da bíblia
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  // Estados de Preferências (Mantendo a inteligência do seu app)
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  useEffect(() => {
    // Scroll para o topo ao mudar de capítulo
    window.scrollTo(0, 0);

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
    setSelectedVerses([]);
  }, [livroId, capitulo]);

  const handleToggleVerse = (num: number) => {
    setSelectedVerses((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]));
  };

  const handleShare = async () => {
    const textToShare = versiculos
      ?.filter((v) => selectedVerses.includes(v.versiculo))
      .map((v) => `${v.versiculo}. ${v.texto}`)
      .join("\n");

    const finalMsg = `*${livroNome} ${capitulo}*\n\n${textToShare}\n\n_Zoe Church App_`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Bíblia Zoe", text: finalMsg });
      } catch (e) {
        console.log(e);
      }
    } else {
      navigator.clipboard.writeText(finalMsg);
      toast.success("Copiado com sucesso!");
    }
    setSelectedVerses([]);
  };

  const markAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Entre para salvar seu progresso");
      return;
    }
    const { error } = await supabase
      .from("user_progress")
      .upsert({
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
      <div className="flex flex-col min-h-screen bg-background pb-32">
        {/* Header fixo e elegante */}
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-none tracking-tight">
                  {livroNome || <Skeleton className="h-5 w-24" />}
                </h1>
                <p className="text-[10px] uppercase font-bold text-primary mt-1">Capítulo {capitulo}</p>
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
                    <DrawerTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" /> Aparência
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6 space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Tamanho da Fonte</span>
                        <span className="font-bold">{fontSize}px</span>
                      </div>
                      <Slider value={[fontSize]} min={14} max={30} step={1} onValueChange={(v) => setFontSize(v[0])} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={fontFamily === "serif" ? "default" : "outline"}
                        onClick={() => setFontFamily("serif")}
                      >
                        Serifada
                      </Button>
                      <Button
                        variant={fontFamily === "sans" ? "default" : "outline"}
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

        {/* ÁREA DE LEITURA SEQUENCIAL (A MUDANÇA QUE VOCÊ QUERIA) */}
        <main className="flex-1 px-6 pt-8 max-w-2xl mx-auto w-full" ref={scrollRef}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
            </div>
          ) : (
            <div
              className={`
                ${fontFamily === "serif" ? "font-serif" : "font-sans"} 
                leading-relaxed text-justify text-foreground/90
              `}
              style={{ fontSize: `${fontSize}px` }}
            >
              {versiculos?.map((v) => (
                <span
                  key={v.id}
                  onClick={() => handleToggleVerse(v.versiculo)}
                  className={`
                    inline transition-colors duration-200 cursor-pointer rounded-sm px-0.5
                    ${selectedVerses.includes(v.versiculo) ? "bg-primary/20 ring-1 ring-primary/30" : "hover:bg-primary/5"}
                  `}
                >
                  <sup className="font-bold text-primary mr-1 text-[0.6em] opacity-70 select-none">{v.versiculo}</sup>
                  <span className="mr-1.5">{v.texto}</span>
                </span>
              ))}
            </div>
          )}

          {/* Botões de Ação e Navegação */}
          {!loading && (
            <div className="mt-16 space-y-10 pb-10">
              <Button
                variant={isRead ? "outline" : "default"}
                className="w-full py-7 rounded-2xl text-base font-bold transition-all"
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

              <Separator className="opacity-50" />

              <div className="flex justify-between items-center gap-4">
                <Button
                  variant="ghost"
                  disabled={!capituloAnterior}
                  onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}`)}
                  className="flex-1 flex flex-col h-auto py-4"
                >
                  <ChevronLeft className="h-5 w-5 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Anterior</span>
                </Button>

                <div className="h-10 w-px bg-border" />

                <Button
                  variant="ghost"
                  disabled={!proximoCapitulo}
                  onClick={() => navigate(`/biblia/${livroId}/${proximoCapitulo}`)}
                  className="flex-1 flex flex-col h-auto py-4 text-primary"
                >
                  <ChevronRight className="h-5 w-5 mb-1" />
                  <span className="text-[10px] uppercase font-bold">Próximo</span>
                </Button>
              </div>
            </div>
          )}
        </main>

        <div className="px-5 mb-10">
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-3 items-start text-muted-foreground">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs leading-relaxed">
              Toque nos versículos para selecionar e compartilhar. Ajuste o tamanho da letra no ícone de engrenagem.
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </PageContainer>
  );
};

export default LeituraCapitulo;
