import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { useBibleBooks, getReadingIntensity, getIntensityColor, getIntensityBorder } from "@/hooks/useBibleData";
import { useReadingProgressData } from "@/hooks/useReadingProgressData";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function LivroCapitulos() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: books, isLoading: booksLoading } = useBibleBooks();
  const { data: readingProgress } = useReadingProgressData();

  const book = books?.find(
    (b) => b.abbreviation.toLowerCase() === bookId?.toLowerCase()
  );

  const getChapterProgress = (chapter: number) => {
    if (!book || !readingProgress) return 0;
    const progress = readingProgress.find(
      (p) => p.book_id === book.id && p.chapter === chapter
    );
    return progress?.read_count || 0;
  };

  if (booksLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="p-4 grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Livro não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O livro "{bookId}" não existe na Bíblia.
          </p>
          <Button onClick={() => navigate("/biblia")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Bíblia
          </Button>
        </div>
      </div>
    );
  }

  const chapters = Array.from({ length: book.chapters_count }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/biblia")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{book.name}</h1>
            <p className="text-sm text-muted-foreground">
              {book.testament === "AT" ? "Antigo" : "Novo"} Testamento • {book.chapters_count} capítulo{book.chapters_count > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="px-4 py-3 flex items-center gap-3 text-xs text-muted-foreground border-b bg-muted/30">
        <span className="font-medium">Progresso:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-muted/30 border" />
          <span>Não lido</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-primary/40" />
          <span>Lido</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-primary/80" />
          <span>Relido</span>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {chapters.map((chapter) => {
            const readCount = getChapterProgress(chapter);
            const intensity = getReadingIntensity(readCount);
            const bgColor = getIntensityColor(intensity);
            const borderColor = getIntensityBorder(intensity);

            return (
              <button
                key={chapter}
                onClick={() => navigate(`/biblia/${bookId}/${chapter}`)}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center font-bold text-lg border-2 transition-all duration-200",
                  "hover:scale-105 active:scale-95 hover:shadow-md",
                  bgColor,
                  borderColor,
                  intensity > 1 ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {chapter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reading Stats */}
      {readingProgress && readingProgress.length > 0 && (
        <div className="px-4 py-6">
          <div className="bg-muted/30 rounded-2xl p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Seu progresso em {book.name}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {readingProgress.filter((p) => p.book_id === book.id).length}
              </span>
              <span className="text-muted-foreground">
                de {book.chapters_count} capítulos lidos
              </span>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
