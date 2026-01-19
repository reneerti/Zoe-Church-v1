import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Highlighter, Check, BookOpen, Share2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBibleBooks, useBibleVersions } from '@/hooks/useBibleData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  const { bookId, chapter } = useParams<{ bookId: string; chapter: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: books } = useBibleBooks();
  const { data: versions } = useBibleVersions();
  
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('NVI');
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);

  const book = books?.find(b => b.abbreviation.toLowerCase() === bookId?.toLowerCase());
  const chapterNum = parseInt(chapter || '1', 10);
  const verseParam = searchParams.get('v');
  const verseToScroll = verseParam ? parseInt(verseParam.split('-')[0], 10) : null;

  // Fetch verses for the chapter
  const { data: verses, isLoading: versesLoading, error: versesError } = useQuery({
    queryKey: ['verses', book?.id, chapterNum, selectedVersion],
    queryFn: async () => {
      if (!book) return [];
      
      const { data: versionData, error: versionError } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('code', selectedVersion)
        .maybeSingle();
      
      if (versionError || !versionData) {
        console.error('Version not found:', selectedVersion);
        return [];
      }
      
      const { data, error } = await supabase
        .from('bible_verses')
        .select('id, verse, text')
        .eq('book_id', book.id)
        .eq('chapter', chapterNum)
        .eq('version_id', versionData.id)
        .order('verse');
      
      if (error) {
        console.error('Error fetching verses:', error);
        throw error;
      }
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

  const highlightMutation = useMutation({
    mutationFn: async ({ verseIds, color }: { verseIds: string[]; color: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      await supabase
        .from('verse_highlights')
        .delete()
        .eq('user_id', user.id)
        .in('verse_id', verseIds);

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

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !book) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('reading_progress')
        .select('id, read_count')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .eq('chapter', chapterNum)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reading_progress')
          .update({ 
            read_count: existing.read_count + 1,
            last_read_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
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
      navigate(`/biblia/${bookId}/${newChapter}`);
      setSelectedVerses([]);
      setSelectionMode(false);
    }
  };

  const handleShare = async () => {
    if (!book || !verses) return;
    
    const selectedTexts = selectedVerses.length > 0
      ? verses.filter(v => selectedVerses.includes(v.id))
          .map(v => `${v.verse}. ${v.text}`)
          .join('\n')
      : '';
    
    const shareText = selectedTexts 
      ? `${book.name} ${chapterNum}\n\n${selectedTexts}\n\n- ${selectedVersion}`
      : `${book.name} ${chapterNum} - ${selectedVersion}`;

    try {
      await navigator.share({
        title: `${book.name} ${chapterNum}`,
        text: shareText,
      });
    } catch {
      navigator.clipboard.writeText(shareText);
      toast({ title: 'Texto copiado!' });
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando livro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/biblia/${bookId}`)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">{book.name} {chapterNum}</h1>
                <p className="text-xs text-muted-foreground">
                  {book.testament === 'AT' ? 'Antigo' : 'Novo'} Testamento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-16 h-8 text-xs font-medium border-0 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(versions || [{ id: '1', code: 'NVI', name: 'NVI' }, { id: '2', code: 'ARA', name: 'ARA' }, { id: '3', code: 'NTLH', name: 'NTLH' }]).map((v) => (
                    <SelectItem key={v.code} value={v.code}>
                      {v.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl">
                  <SheetHeader>
                    <SheetTitle>Configurações de Leitura</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Tamanho da Fonte: {fontSize}px</Label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([v]) => setFontSize(v)}
                        min={14}
                        max={28}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Espaçamento: {lineHeight.toFixed(1)}</Label>
                      <Slider
                        value={[lineHeight * 10]}
                        onValueChange={([v]) => setLineHeight(v / 10)}
                        min={14}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Números dos versículos</Label>
                      <Switch
                        checked={showVerseNumbers}
                        onCheckedChange={setShowVerseNumbers}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={chapterNum <= 1}
              onClick={() => navigateChapter('prev')}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {chapterNum > 1 && `Cap. ${chapterNum - 1}`}
            </Button>
            <span className="text-sm font-bold text-primary px-4 py-1 bg-primary/10 rounded-full">
              Capítulo {chapterNum}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={chapterNum >= book.chapters_count}
              onClick={() => navigateChapter('next')}
              className="text-muted-foreground"
            >
              {chapterNum < book.chapters_count && `Cap. ${chapterNum + 1}`}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {versesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : versesError ? (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar versículos</p>
          </div>
        ) : verses && verses.length > 0 ? (
          <div
            className="space-y-2 text-foreground"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            {verses.map((verse) => {
              const highlight = getHighlightColor(verse.id);
              const isSelected = selectedVerses.includes(verse.id);
              const isTarget = highlightedVerse === verse.verse;

              return (
                <p
                  key={verse.id}
                  id={`verse-${verse.verse}`}
                  onClick={() => toggleVerseSelection(verse.id)}
                  className={
                    `rounded-lg px-2 py-1 transition-colors cursor-pointer ` +
                    `${highlight ? `${highlight.bg} ${highlight.text}` : ''} ` +
                    `${isSelected ? 'bg-primary/20 ring-2 ring-primary' : ''} ` +
                    `${!highlight && !isSelected ? 'hover:bg-muted/50' : ''} ` +
                    `${isTarget ? 'ring-2 ring-primary/60 bg-primary/10' : ''}`
                  }
                >
                  {showVerseNumbers && (
                    <sup className="text-xs text-primary font-bold mr-2 select-none">{verse.verse}</sup>
                  )}
                  <span className="tracking-[0.01em]">{verse.text}</span>
                </p>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-2xl">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">
              Versículos não disponíveis
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta tradução ({selectedVersion}) ainda não foi importada.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Livro: {book.name} (ID: {book.id}) | Capítulo: {chapterNum}
            </p>
          </div>
        )}
      </div>

      {selectionMode && selectedVerses.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <span className="text-sm text-muted-foreground">
              {selectedVerses.length} versículo(s)
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="default">
                    <Highlighter className="h-4 w-4 mr-2" />
                    Destacar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <p className="text-sm font-medium mb-2">Escolha uma cor</p>
                  <div className="flex gap-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => highlightMutation.mutate({ verseIds: selectedVerses, color: color.value })}
                        className={`w-10 h-10 rounded-full ${color.bg} hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-primary/30 hover:ring-offset-2`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-destructive"
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

      {!selectionMode && user && verses && verses.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full shadow-lg"
              size="lg"
              onClick={() => markAsReadMutation.mutate()}
              disabled={markAsReadMutation.isPending}
            >
              <Check className="h-5 w-5 mr-2" />
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