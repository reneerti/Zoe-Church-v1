import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBibleBooks, useReadingProgress, getReadingIntensity } from '@/hooks/useBibleData';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const LivroCapitulos = () => {
  const { livro } = useParams<{ livro: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: books, isLoading: booksLoading } = useBibleBooks();
  const { data: readingProgress } = useReadingProgress(user?.id);

  const book = books?.find(b => b.abbreviation.toLowerCase() === livro?.toLowerCase());

  if (booksLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="p-4 grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Livro não encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">Parâmetro: {livro}</p>
          <Button variant="link" onClick={() => navigate('/biblia')}>
            Voltar à Bíblia
          </Button>
        </div>
      </div>
    );
  }

  // Calculate reading intensity for each chapter
  const getChapterProgress = (chapter: number) => {
    if (!readingProgress) return 0;
    const progress = readingProgress.find(
      p => p.book_id === book.id && p.chapter === chapter
    );
    return progress?.read_count || 0;
  };

  // Get color classes based on reading intensity
  const getChapterStyles = (readCount: number) => {
    const intensity = getReadingIntensity(readCount);
    switch (intensity) {
      case 0:
        return 'bg-muted/50 hover:bg-muted text-foreground border-border';
      case 1:
        return 'bg-primary/20 hover:bg-primary/30 text-primary-foreground border-primary/30';
      case 2:
        return 'bg-primary/40 hover:bg-primary/50 text-white border-primary/50';
      case 3:
        return 'bg-primary/70 hover:bg-primary/80 text-white border-primary/70';
      case 4:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary';
      default:
        return 'bg-muted/50 hover:bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header com gradiente */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/biblia')}
              className="rounded-full bg-background/80 hover:bg-background"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-xl">{book.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {book.chapters_count} capítulos • {book.testament === 'AT' ? 'Antigo' : 'Novo'} Testamento
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Grid de Capítulos */}
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Selecione um capítulo
          </h2>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {Array.from({ length: book.chapters_count }, (_, i) => i + 1).map((chapter) => {
            const readCount = getChapterProgress(chapter);
            const styles = getChapterStyles(readCount);

            return (
              <button
                key={chapter}
                onClick={() => navigate(`/biblia/${book.abbreviation.toLowerCase()}/${chapter}`)}
                className={`
                  aspect-square rounded-xl flex items-center justify-center
                  font-semibold text-sm transition-all duration-200 border
                  hover:scale-105 active:scale-95 shadow-sm hover:shadow-md
                  ${styles}
                `}
              >
                {chapter}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-gradient-to-br from-card to-muted/30 rounded-2xl border border-border/50">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Legenda de Progresso
          </h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border shadow-sm" />
              <span className="text-[10px] text-muted-foreground">Não lido</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 shadow-sm" />
              <span className="text-[10px] text-muted-foreground">1x</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-primary/40 border border-primary/50 shadow-sm" />
              <span className="text-[10px] text-muted-foreground">2-3x</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-primary/70 border border-primary/70 shadow-sm" />
              <span className="text-[10px] text-muted-foreground">4-6x</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-primary border border-primary shadow-sm" />
              <span className="text-[10px] text-muted-foreground">7+</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LivroCapitulos;
