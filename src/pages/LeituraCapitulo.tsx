import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, Highlighter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBibleBooks } from '@/hooks/useBibleData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-200', text: 'text-yellow-900' },
  { name: 'Verde', value: 'green', bg: 'bg-green-200', text: 'text-green-900' },
  { name: 'Azul', value: 'blue', bg: 'bg-blue-200', text: 'text-blue-900' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-200', text: 'text-pink-900' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-200', text: 'text-purple-900' },
];

interface Verse {
  id: string;
  verse: number;
  text: string;
}

interface Highlight {
  id: string;
  verse_id: string;
  color: string;
  note: string | null;
}

const LeituraCapitulo = () => {
  const { livro, capitulo } = useParams<{ livro: string; capitulo: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: books } = useBibleBooks();
  
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const book = books?.find(b => b.abbreviation.toLowerCase() === livro?.toLowerCase());
  const chapterNum = parseInt(capitulo || '1', 10);

  // Fetch verses for the chapter (default to NVI version)
  const { data: verses, isLoading: versesLoading } = useQuery({
    queryKey: ['verses', book?.id, chapterNum],
    queryFn: async () => {
      if (!book) return [];
      
      // First get the NVI version id
      const { data: versionData } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('code', 'NVI')
        .single();
      
      if (!versionData) return [];
      
      const { data, error } = await supabase
        .from('bible_verses')
        .select('id, verse, text')
        .eq('book_id', book.id)
        .eq('chapter', chapterNum)
        .eq('version_id', versionData.id)
        .order('verse');
      
      if (error) throw error;
      return data as Verse[];
    },
    enabled: !!book,
  });

  // Fetch user highlights for this chapter
  const { data: highlights } = useQuery({
    queryKey: ['highlights', book?.id, chapterNum, user?.id],
    queryFn: async () => {
      if (!user || !verses) return [];
      const verseIds = verses.map(v => v.id);
      const { data, error } = await supabase
        .from('verse_highlights')
        .select('id, verse_id, color, note')
        .eq('user_id', user.id)
        .in('verse_id', verseIds);
      
      if (error) throw error;
      return data as Highlight[];
    },
    enabled: !!user && !!verses && verses.length > 0,
  });

  // Mutation to add/update highlight
  const highlightMutation = useMutation({
    mutationFn: async ({ verseIds, color }: { verseIds: string[]; color: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Remove existing highlights for these verses
      await supabase
        .from('verse_highlights')
        .delete()
        .eq('user_id', user.id)
        .in('verse_id', verseIds);

      // Add new highlights
      const inserts = verseIds.map(verse_id => ({
        user_id: user.id,
        verse_id,
        color,
      }));

      const { error } = await supabase
        .from('verse_highlights')
        .insert(inserts);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      setSelectedVerses([]);
      setSelectionMode(false);
      toast({ title: 'Destaque adicionado!' });
    },
  });

  // Mutation to remove highlight
  const removeHighlightMutation = useMutation({
    mutationFn: async (verseIds: string[]) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('verse_highlights')
        .delete()
        .eq('user_id', user.id)
        .in('verse_id', verseIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      setSelectedVerses([]);
      setSelectionMode(false);
      toast({ title: 'Destaque removido!' });
    },
  });

  // Mark chapter as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !book) throw new Error('Not authenticated');
      
      // Check if progress exists
      const { data: existing } = await supabase
        .from('reading_progress')
        .select('id, read_count')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .eq('chapter', chapterNum)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('reading_progress')
          .update({ 
            read_count: existing.read_count + 1,
            last_read_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('reading_progress')
          .insert({
            user_id: user.id,
            book_id: book.id,
            chapter: chapterNum,
            read_count: 1,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingProgress'] });
      toast({ 
        title: 'Capítulo marcado como lido!',
        description: 'Seu progresso foi atualizado.'
      });
    },
  });

  const toggleVerseSelection = (verseId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Faça login',
        description: 'Entre na sua conta para destacar versículos.',
      });
      return;
    }
    
    setSelectionMode(true);
    setSelectedVerses(prev => 
      prev.includes(verseId) 
        ? prev.filter(id => id !== verseId)
        : [...prev, verseId]
    );
  };

  const getHighlightColor = (verseId: string) => {
    const highlight = highlights?.find(h => h.verse_id === verseId);
    return highlight ? HIGHLIGHT_COLORS.find(c => c.value === highlight.color) : null;
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!book) return;
    const newChapter = direction === 'next' ? chapterNum + 1 : chapterNum - 1;
    if (newChapter >= 1 && newChapter <= book.chapters_count) {
      navigate(`/biblia/${livro}/${newChapter}`);
      setSelectedVerses([]);
      setSelectionMode(false);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/biblia/${livro}`)}
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{book.name} {chapterNum}</h1>
            <p className="text-xs text-muted-foreground">
              {book.testament === 'AT' ? 'Antigo' : 'Novo'} Testamento
            </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={chapterNum <= 1}
              onClick={() => navigateChapter('prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium min-w-[3ch] text-center">{chapterNum}</span>
            <Button
              variant="ghost"
              size="icon"
              disabled={chapterNum >= book.chapters_count}
              onClick={() => navigateChapter('next')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Verses */}
      <div className="p-4 max-w-2xl mx-auto">
        {versesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : verses && verses.length > 0 ? (
          <div className="space-y-1">
            {verses.map((verse) => {
              const highlight = getHighlightColor(verse.id);
              const isSelected = selectedVerses.includes(verse.id);
              
              return (
                <span
                  key={verse.id}
                  onClick={() => toggleVerseSelection(verse.id)}
                  className={`
                    inline cursor-pointer transition-colors
                    ${highlight ? `${highlight.bg} ${highlight.text} px-1 rounded` : ''}
                    ${isSelected ? 'bg-primary/20 ring-2 ring-primary rounded' : ''}
                    ${!highlight && !isSelected ? 'hover:bg-muted/50' : ''}
                  `}
                >
                  <sup className="text-xs text-muted-foreground mr-1 font-medium">{verse.verse}</sup>
                  {verse.text}{' '}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Versículos não disponíveis para este capítulo.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              O banco de dados ainda precisa ser populado.
            </p>
          </div>
        )}
      </div>

      {/* Selection Actions Bar */}
      {selectionMode && selectedVerses.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <span className="text-sm text-muted-foreground">
              {selectedVerses.length} versículo(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Highlighter className="h-4 w-4 mr-2" />
                    Destacar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="flex gap-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => highlightMutation.mutate({ verseIds: selectedVerses, color: color.value })}
                        className={`w-8 h-8 rounded-full ${color.bg} hover:scale-110 transition-transform`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-destructive"
                    onClick={() => removeHighlightMutation.mutate(selectedVerses)}
                  >
                    Remover destaque
                  </Button>
                </PopoverContent>
              </Popover>
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

      {/* Mark as Read Button */}
      {!selectionMode && user && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full"
              onClick={() => markAsReadMutation.mutate()}
              disabled={markAsReadMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Marcar como lido
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default LeituraCapitulo;
