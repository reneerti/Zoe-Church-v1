import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBibleBooks, useReadingProgress, getReadingIntensity, getIntensityColor, getIntensityBorder } from '@/hooks/useBibleData';
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/biblia')}
            className="rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{book.name}</h1>
            <p className="text-xs text-muted-foreground">
              {book.chapters_count} capítulos • {book.testament === 'AT' ? 'Antigo' : 'Novo'} Testamento
            </p>
          </div>
        </div>
      </header>

      {/* Chapters Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {Array.from({ length: book.chapters_count }, (_, i) => i + 1).map((chapter) => {
            const readCount = getChapterProgress(chapter);
            const intensity = getReadingIntensity(readCount);
            const colorClass = getIntensityColor(intensity);
            const borderClass = getIntensityBorder(intensity);

            return (
              <button
                key={chapter}
                onClick={() => navigate(`/biblia/${book.abbreviation.toLowerCase()}/${chapter}`)}
                className={`
                  aspect-square rounded-lg flex items-center justify-center
                  font-medium text-sm transition-all duration-200
                  hover:scale-105 active:scale-95
                  ${colorClass} ${borderClass} border
                  ${intensity > 0 ? 'text-primary-foreground' : 'text-foreground'}
                `}
              >
                {chapter}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-3">Legenda de Progresso</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted border border-border" />
              <span className="text-xs text-muted-foreground">Não lido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30" />
              <span className="text-xs text-muted-foreground">1x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/40 border border-primary/50" />
              <span className="text-xs text-muted-foreground">2-3x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/70 border border-primary/80" />
              <span className="text-xs text-muted-foreground">4-6x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary border border-primary" />
              <span className="text-xs text-muted-foreground">7+</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LivroCapitulos;
