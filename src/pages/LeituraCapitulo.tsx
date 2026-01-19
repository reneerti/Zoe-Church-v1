import React, { useState, useEffect, useRef } from "react";
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
  Bookmark,
  Highlighter,
  MessageSquare,
  PlayCircle,
  PauseCircle,
  Volume2,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import useBibleData from "@/hooks/useBibleData"; // IMPORT DEFAULT (Corrigindo o erro)
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook de dados da bíblia
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  // ESTADOS DE PREFERÊNCIAS E CUSTOMIZAÇÃO (Mantendo a densidade de lógica)
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [lineHeight, setLineHeight] = useState(1.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState<"sepia" | "dark" | "light">("light");

  // EFEITOS DE PERSISTÊNCIA E CARREGAMENTO
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    const savedFontSize = localStorage.getItem("zoe-font-size");
    const savedTheme = localStorage.getItem("zoe-theme") as any;
    if (savedFontSize) setFontSize(Number(savedFontSize));
    if (savedTheme) setTheme(savedTheme);

    const checkStatus = async () => {
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
    checkStatus();
    setSelectedVerses([]);
  }, [livroId, capitulo]);

  const handleToggleVerse = (num: number) => {
    setSelectedVerses((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b),
    );
  };

  const markAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Acesse sua conta para salvar o progresso.");
      return;
    }
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

  const handleShare = async () => {
    const text = versiculos
      ?.filter((v) => selectedVerses.includes(v.versiculo))
      .map((v) => `[${v.versiculo}] ${v.texto}`)
      .join("\n");

    const msg = `*${livroNome} ${capitulo}*\n\n${text}\n\n_Bíblia Zoe Church_`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Palavra de Deus", text: msg });
      } catch {}
    } else {
      navigator.clipboard.writeText(msg);
      toast.success("Copiado!");
    }
    setSelectedVerses([]);
  };

  return (
    <PageContainer>
      <div
        className={`flex flex-col min-h-screen pb-40 transition-colors duration-300 ${
          theme === "sepia" ? "bg-[#f4ecd8]" : theme === "dark" ? "bg-[#121212]" : "bg-background"
        }`}
      >
        {/* HEADER SUPERIOR ESTRUTURADO */}
        <header className="sticky top-0 z-50 w-full border-b bg-inherit/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-none">{livroNome || "Buscando..."}</h1>
                <p className="text-[10px] uppercase font-black text-primary mt-1 tracking-widest">
                  Capítulo {capitulo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className={isPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}
              >
                {isPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
              </Button>

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
                  <div className="p-6 space-y-8">
                    <Tabs defaultValue="text">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">Texto</TabsTrigger>
                        <TabsTrigger value="style">Estilo</TabsTrigger>
                      </TabsList>
                      <TabsContent value="text" className="space-y-6 pt-4">
                        <div className="space-y-4">
                          <label className="text-sm font-medium">Tamanho da Fonte: {fontSize}px</label>
                          <Slider
                            value={[fontSize]}
                            min={14}
                            max={32}
                            step={1}
                            onValueChange={(v) => setFontSize(v[0])}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-sm font-medium">Espaçamento entre linhas</label>
                          <Slider
                            value={[lineHeight]}
                            min={1.4}
                            max={2.5}
                            step={0.1}
                            onValueChange={(v) => setLineHeight(v[0])}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="style" className="space-y-6 pt-4">
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
                            Claro
                          </Button>
                          <Button
                            variant={theme === "sepia" ? "default" : "outline"}
                            onClick={() => setTheme("sepia")}
                            className="bg-[#f4ecd8] text-[#5b4636]"
                          >
                            Sépia
                          </Button>
                          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
                            Escuro
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={fontFamily === "serif" ? "secondary" : "outline"}
                            onClick={() => setFontFamily("serif")}
                            className="font-serif"
                          >
                            Serifada
                          </Button>
                          <Button
                            variant={fontFamily === "sans" ? "secondary" : "outline"}
                            onClick={() => setFontFamily("sans")}
                            className="font-sans"
                          >
                            Moderna
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </header>

        {/* ÁREA DE LEITURA SEQUENCIAL (O CORAÇÃO DO AJUSTE) */}
        <main className="flex-1 px-6 pt-10 max-w-2xl mx-auto w-full" ref={containerRef}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[90%]" />
            </div>
          ) : (
            <div
              className={`
                ${fontFamily === "serif" ? "font-serif" : "font-sans"} 
                text-justify subpixel-antialiased select-none
                ${theme === "sepia" ? "text-[#5b4636]" : theme === "dark" ? "text-gray-300" : "text-foreground/90"}
              `}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
            >
              {versiculos?.map((v) => (
                <span
                  key={v.id}
                  onClick={() => handleToggleVerse(v.versiculo)}
                  className={`
                    inline transition-all duration-300 cursor-pointer rounded-sm px-0.5
                    ${
                      selectedVerses.includes(v.versiculo)
                        ? "bg-primary/25 ring-2 ring-primary/20 mx-0.5 shadow-sm"
                        : "hover:bg-primary/10"
                    }
                  `}
                >
                  <sup className="font-bold text-primary mr-1 text-[0.6em] select-none opacity-80">{v.versiculo}</sup>
                  <span className="mr-1.5 leading-relaxed">{v.texto}</span>
                </span>
              ))}
            </div>
          )}

          {/* NAVEGAÇÃO ENTRE CAPÍTULOS */}
          {!loading && (
            <div className="mt-20 space-y-12 pb-10">
              <Button
                variant={isRead ? "secondary" : "default"}
                className={`w-full py-8 rounded-3xl text-base font-bold shadow-xl transition-all ${!isRead && "bg-primary hover:scale-[1.01]"}`}
                onClick={markAsRead}
                disabled={isRead}
              >
                {isRead ? (
                  <>
                    <Check className="mr-2 h-6 w-6" /> Capítulo Lido
                  </>
                ) : (
                  "Finalizar Leitura"
                )}
              </Button>

              <div className="flex justify-between items-center gap-6">
                <Button
                  variant="ghost"
                  disabled={!capituloAnterior}
                  onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}`)}
                  className="flex-1 flex flex-col h-auto py-6 rounded-2xl border border-primary/5"
                >
                  <ChevronLeft className="h-6 w-6 mb-2" />
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    Anterior
                  </span>
                </Button>

                <div className="h-12 w-px bg-primary/10" />

                <Button
                  variant="ghost"
                  disabled={!proximoCapitulo}
                  onClick={() => navigate(`/biblia/${livroId}/${proximoCapitulo}`)}
                  className="flex-1 flex flex-col h-auto py-6 rounded-2xl text-primary border border-primary/5"
                >
                  <ChevronRight className="h-6 w-6 mb-2" />
                  <span className="text-[10px] uppercase font-black tracking-widest">Próximo</span>
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* BARRA FLUTUANTE DE SELEÇÃO */}
        {selectedVerses.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-2xl flex items-center justify-around px-4">
              <div className="text-xs font-bold mr-2">{selectedVerses.length} selecionados</div>
              <Separator orientation="vertical" className="h-6 bg-white/20 mx-2" />
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-white">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedVerses([])} className="text-white">
                <Copy className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedVerses([])} className="text-white">
                <Highlighter className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </PageContainer>
  );
};

export default LeituraCapitulo;
