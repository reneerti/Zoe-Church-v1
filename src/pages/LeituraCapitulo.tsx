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
  Bookmark,
  Highlighter,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { useBibleData } from "@/hooks/useBibleData"; // Corrigido: Named Import conforme o teu ficheiro
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook de dados da bíblia
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  // ESTADOS DE UI E PREFERÊNCIAS (Para manter as 500+ linhas de lógica)
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // EFEITOS DE CARREGAMENTO E PERSISTÊNCIA
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const savedFontSize = localStorage.getItem("zoe-bible-font-size");
    const savedFontFamily = localStorage.getItem("zoe-bible-font-family");
    if (savedFontSize) setFontSize(Number(savedFontSize));
    if (savedFontFamily) setFontFamily(savedFontFamily as "serif" | "sans");

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

  // LÓGICA DE INTERAÇÃO COM VERSÍCULOS
  const handleToggleVerse = (num: number) => {
    setSelectedVerses((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b),
    );
  };

  const handleShare = async () => {
    const textToShare = versiculos
      ?.filter((v) => selectedVerses.includes(v.versiculo))
      .map((v) => `${v.versiculo}. ${v.texto}`)
      .join("\n");

    const finalMsg = `*${livroNome} ${capitulo}*\n\n${textToShare}\n\n_Lido no Zoe Church App_`;

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
      toast.error("Inicie sessão para guardar o progresso");
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
      toast.success("Capítulo concluído! Glória a Deus!");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen bg-background pb-40">
        {/* HEADER DINÂMICO */}
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-black text-primary">Capítulo {capitulo}</span>
                  <Separator orientation="vertical" className="h-2" />
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">Almeida</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <PlayCircle className="h-5 w-5" />
              </Button>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" /> Personalizar Leitura
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6 space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Tamanho da Letra</span>
                        <span className="font-bold text-primary">{fontSize}px</span>
                      </div>
                      <Slider
                        value={[fontSize]}
                        min={14}
                        max={32}
                        step={1}
                        onValueChange={(v) => {
                          setFontSize(v[0]);
                          localStorage.setItem("zoe-bible-font-size", v[0].toString());
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={fontFamily === "serif" ? "default" : "outline"}
                        onClick={() => setFontFamily("serif")}
                        className="font-serif"
                      >
                        Clássica
                      </Button>
                      <Button
                        variant={fontFamily === "sans" ? "default" : "outline"}
                        onClick={() => setFontFamily("sans")}
                        className="font-sans"
                      >
                        Moderna
                      </Button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </header>

        {/* ÁREA DE LEITURA SEQUENCIAL PROFISSIONAL */}
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
                text-justify subpixel-antialiased
              `}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                color: "var(--foreground)",
              }}
            >
              {/* Renderização Sequencial: O segredo está no span inline */}
              {versiculos?.map((v) => (
                <span
                  key={v.id}
                  onClick={() => handleToggleVerse(v.versiculo)}
                  className={`
                    inline transition-all duration-200 cursor-pointer rounded-sm
                    ${selectedVerses.includes(v.versiculo) ? "bg-primary/25 ring-2 ring-primary/20 mx-0.5 shadow-sm" : "hover:bg-primary/5"}
                  `}
                >
                  <sup className="font-bold text-primary mr-1 text-[0.6em] select-none opacity-80">{v.versiculo}</sup>
                  <span className="text-foreground/90 mr-1.5 leading-relaxed">{v.texto}</span>
                </span>
              ))}
            </div>
          )}

          {/* ACÇÕES DE FIM DE CAPÍTULO */}
          {!loading && (
            <div className="mt-20 space-y-12 pb-10">
              <Button
                variant={isRead ? "secondary" : "default"}
                className={`w-full py-8 rounded-3xl text-base font-bold transition-all shadow-xl ${!isRead && "bg-primary hover:scale-[1.02]"}`}
                onClick={markAsRead}
                disabled={isRead}
              >
                {isRead ? (
                  <>
                    <Check className="mr-2 h-6 w-6" /> Capítulo Lido
                  </>
                ) : (
                  "Concluir Leitura"
                )}
              </Button>

              <div className="flex justify-between items-center gap-6">
                <Button
                  variant="ghost"
                  disabled={!capituloAnterior}
                  onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}`)}
                  className="flex-1 flex flex-col h-auto py-6 rounded-2xl border border-primary/5 hover:bg-primary/5"
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
                  className="flex-1 flex flex-col h-auto py-6 rounded-2xl text-primary border border-primary/5 hover:bg-primary/5"
                >
                  <ChevronRight className="h-6 w-6 mb-2" />
                  <span className="text-[10px] uppercase font-black tracking-widest">Próximo</span>
                </Button>
              </div>

              {/* RODAPÉ DE ENCORAJAMENTO */}
              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-full text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tighter text-primary">Dica da Zoe</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sabias que podes selecionar vários versículos ao mesmo tempo? Basta tocar neles para partilhar com os
                  teus irmãos.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* BARRA FLUTUANTE DE SELECÇÃO (Aparece quando versículos são tocados) */}
        {selectedVerses.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-primary text-primary-foreground rounded-2xl p-2 shadow-2xl flex items-center justify-around">
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-white hover:bg-white/20">
                <Share2 className="h-4 w-4 mr-2" /> Partilhar
              </Button>
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVerses([])}
                className="text-white hover:bg-white/20"
              >
                Cancelar ({selectedVerses.length})
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
