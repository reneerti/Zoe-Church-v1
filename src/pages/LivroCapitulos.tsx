import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Highlighter, Check, BookOpen, Share2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { useBibleBooks, useBibleVersions } from "@/hooks/useBibleData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/sheet"; // Ajuste o path conforme o seu projeto (ex: @/components/ui/sheet)
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const HIGHLIGHT_COLORS = [
  { name: "Amarelo", value: "yellow", bg: "bg-yellow-200", text: "text-yellow-900" },
  { name: "Verde", value: "green", bg: "bg-green-200", text: "text-green-900" },
  { name: "Azul", value: "blue", bg: "bg-blue-200", text: "text-blue-900" },
  { name: "Rosa", value: "pink", bg: "bg-pink-200", text: "text-pink-900" },
  { name: "Laranja", value: "orange", bg: "bg-orange-200", text: "text-orange-900" },
];

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados de Preferência
  const [fontSize, setFontSize] = useState(18);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const versionId = searchParams.get("version") || "ara";
  const { data: books } = useBibleBooks();

  const livro = books?.find((b) => b.id === livroId);

  // --- LÓGICA DE NAVEGAÇÃO SEGURA ---
  const numCapitulo = parseInt(capitulo || "1", 10);
  const capituloAnterior = numCapitulo > 1 ? numCapitulo - 1 : null;
  const proximoCapitulo = livro && numCapitulo < (livro.chapters_count || 0) ? numCapitulo + 1 : null;

  // Busca de versículos (Supabase)
  const {
    data: verses,
    isLoading: loadingVerses,
    isError,
  } = useQuery({
    queryKey: ["verses", versionId, livroId, capitulo],
    queryFn: async () => {
      // Importante: Verifique se a coluna é 'versao_id' ou 'versao' na sua DB
      const { data, error } = await supabase
        .from("biblia")
        .select("*")
        .eq("versao_id", versionId.toLowerCase())
        .eq("livro_id", livroId)
        .eq("capitulo", numCapitulo)
        .order("versiculo", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Busca de destaques (Highlights)
  const { data: userHighlights } = useQuery({
    queryKey: ["highlights", user?.id, livroId, capitulo],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_highlights")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", livroId)
        .eq("chapter", numCapitulo);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Funções de Ação (Mutations)
  const highlightMutation = useMutation({
    mutationFn: async ({ color }: { color: string }) => {
      if (!user || selectedVerses.length === 0) return;
      const highlights = selectedVerses.map((vn) => ({
        user_id: user.id,
        book_id: livroId,
        chapter: numCapitulo,
        verse_number: vn,
        color,
      }));
      const { error } = await supabase.from("user_highlights").upsert(highlights);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights"] });
      setSelectedVerses([]);
      setSelectionMode(false);
      toast({ title: "Destaque salvo!" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        book_id: livroId,
        chapter: numCapitulo,
        completed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => toast({ title: "Progresso salvo!" }),
  });

  const handleVerseClick = (verseNumber: number) => {
    setSelectedVerses((prev) => {
      const isAlreadySelected = prev.includes(verseNumber);
      const newSelection = isAlreadySelected ? prev.filter((v) => v !== verseNumber) : [...prev, verseNumber];
      setSelectionMode(newSelection.length > 0);
      return newSelection;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">{livro?.nome || "Carregando..."}</h1>
              <p className="text-[10px] uppercase font-bold text-primary mt-1">Capítulo {capitulo}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[40vh]">
                <SheetHeader>
                  <SheetTitle>Configurações de Leitura</SheetTitle>
                </SheetHeader>
                <div className="py-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Tamanho do Texto</span>
                      <span>{fontSize}px</span>
                    </div>
                    <Slider value={[fontSize]} min={14} max={32} onValueChange={(v) => setFontSize(v[0])} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Números</Label>
                    <Switch checked={showVerseNumbers} onCheckedChange={setShowVerseNumbers} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ÁREA DE TEXTO SEQUENCIAL */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-6">
        {loadingVerses ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : isError || (verses && verses.length === 0) ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Texto não disponível nesta versão.</p>
          </div>
        ) : (
          <div
            className="text-foreground leading-relaxed text-justify font-serif"
            style={{ fontSize: `${fontSize}px` }}
          >
            {verses?.map((verse) => {
              const highlight = userHighlights?.find((h) => h.verse_number === verse.versiculo);
              const color = HIGHLIGHT_COLORS.find((c) => c.value === highlight?.color);
              const isSelected = selectedVerses.includes(verse.versiculo);

              return (
                <span
                  key={verse.id}
                  onClick={() => handleVerseClick(verse.versiculo)}
                  className={`
                    inline transition-colors duration-200 cursor-pointer rounded-sm px-0.5
                    ${color ? `${color.bg} ${color.text}` : ""}
                    ${isSelected ? "bg-primary/30 ring-2 ring-primary/20 mx-0.5" : "hover:bg-primary/5"}
                  `}
                >
                  {showVerseNumbers && (
                    <sup className="text-primary font-bold mr-1 text-[0.6em] select-none opacity-70">
                      {verse.versiculo}
                    </sup>
                  )}
                  <span className="mr-1.5">{verse.texto}</span>
                </span>
              );
            })}
          </div>
        )}
      </main>

      {/* Navegação de Capítulos no Rodapé */}
      <nav className="max-w-2xl mx-auto px-6 py-10 flex justify-between items-center border-t mt-10 mb-20 w-full">
        <Button
          variant="ghost"
          disabled={!capituloAnterior}
          onClick={() => navigate(`/biblia/${livroId}/${capituloAnterior}?version=${versionId}`)}
          className="flex flex-col h-auto py-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[10px] uppercase font-black text-muted-foreground mt-1">Anterior</span>
        </Button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Zoe Church</span>
          <div className="h-1 w-1 bg-primary rounded-full mt-1" />
        </div>

        <Button
          variant="ghost"
          disabled={!proximoCapitulo}
          onClick={() => navigate(`/biblia/${livroId}/${proximoCapitulo}?version=${versionId}`)}
          className="flex flex-col h-auto py-2 text-primary"
        >
          <ChevronRight className="h-6 w-6" />
          <span className="text-[10px] uppercase font-black mt-1">Próximo</span>
        </Button>
      </nav>

      {/* Toolbar de Seleção Flutuante */}
      {selectionMode && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="max-w-md mx-auto bg-card border shadow-2xl rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-primary">{selectedVerses.length} selecionados</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const text = verses
                    ?.filter((v) => selectedVerses.includes(v.versiculo))
                    .map((v) => `${v.versiculo}. ${v.texto}`)
                    .join("\n");
                  await navigator.clipboard.writeText(text || "");
                  toast({ title: "Copiado!" });
                  setSelectedVerses([]);
                  setSelectionMode(false);
                }}
              >
                Copiar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedVerses([]);
                  setSelectionMode(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {!selectionMode && (
        <div className="fixed bottom-20 left-0 right-0 p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full shadow-lg rounded-full py-6 font-bold"
              onClick={() => markAsReadMutation.mutate()}
            >
              <Check className="h-5 w-5 mr-2" /> Finalizar Leitura
            </Button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
};

export default LeituraCapitulo;
