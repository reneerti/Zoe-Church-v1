import { useState, useMemo } from "react";
import { ChevronLeft, Settings, Search, BookOpen, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBibleBooks, useBibleVersions, useReadingProgress, getReadingIntensity, getIntensityColor, getIntensityBorder } from "@/hooks/useBibleData";

export default function Biblia() {
  const navigate = useNavigate();
  const [version, setVersion] = useState("NVI");
  const [selectedTestament, setSelectedTestament] = useState<"AT" | "NT" | null>(null);

  const { data: versions = [] } = useBibleVersions();
  const { data: books = [] } = useBibleBooks();
  const { data: progress = [] } = useReadingProgress(); // Will be empty without auth

  const testaments = [
    { id: "AT" as const, name: "Velho Testamento", books: books.filter(b => b.testament === "AT").length || 39 },
    { id: "NT" as const, name: "Novo Testamento", books: books.filter(b => b.testament === "NT").length || 27 },
  ];

  const filteredBooks = useMemo(() => {
    if (!selectedTestament) return [];
    return books.filter(b => b.testament === selectedTestament);
  }, [books, selectedTestament]);

  // Calculate progress by book
  const bookProgress = useMemo(() => {
    const progressMap: Record<string, { readChapters: number; totalReadCount: number }> = {};
    
    progress.forEach(p => {
      if (!progressMap[p.book_id]) {
        progressMap[p.book_id] = { readChapters: 0, totalReadCount: 0 };
      }
      progressMap[p.book_id].readChapters++;
      progressMap[p.book_id].totalReadCount += p.read_count;
    });
    
    return progressMap;
  }, [progress]);

  // Calculate total chapters read
  const totalChaptersRead = useMemo(() => {
    return progress.length;
  }, [progress]);

  const totalChapters = useMemo(() => {
    return books.reduce((sum, b) => sum + b.chapters_count, 0);
  }, [books]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Bíblia Sagrada</h1>
          </div>
          
          <div className="flex items-center gap-1">
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="w-20 h-8 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(versions.length > 0 ? versions : [
                  { code: "NVI", name: "NVI" },
                  { code: "NTLH", name: "NTLH" },
                  { code: "ARA", name: "ARA" },
                ]).map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    {v.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate('/busca-biblia')}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <PageContainer>
        {!selectedTestament ? (
          // Testament Selection
          <div className="py-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Escolha o Testamento</h2>
            
            {testaments.map((testament, index) => (
              <button
                key={testament.id}
                onClick={() => setSelectedTestament(testament.id)}
                className={cn(
                  "w-full p-5 rounded-2xl text-left transition-all duration-200",
                  "opacity-0 animate-fade-in hover:scale-[1.02] active:scale-[0.98]",
                  testament.id === "AT" 
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                    : "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{testament.name}</h3>
                    <p className="text-sm opacity-90">{testament.books} livros</p>
                  </div>
                </div>
              </button>
            ))}

            {/* Reading Progress */}
            <div className="mt-8 p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Seu Progresso</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capítulos lidos</span>
                  <span className="font-medium">{totalChaptersRead} / {totalChapters || 1189}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" 
                    style={{ width: `${(totalChaptersRead / (totalChapters || 1189)) * 100}%` }} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Os cards mudam de cor conforme você lê mais frequentemente cada livro
                </p>
              </div>

              {/* Color legend */}
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Frequência de leitura:</p>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-3 rounded bg-muted/30" />
                  <div className="flex-1 h-3 rounded bg-primary/20" />
                  <div className="flex-1 h-3 rounded bg-primary/40" />
                  <div className="flex-1 h-3 rounded bg-primary/60" />
                  <div className="flex-1 h-3 rounded bg-primary/80" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Nunca</span>
                  <span>Frequente</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Books List
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedTestament(null)}
                className="text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <h2 className="font-semibold">
                {selectedTestament === "AT" ? "Velho Testamento" : "Novo Testamento"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {filteredBooks.map((book, index) => {
                const bp = bookProgress[book.id];
                const readCount = bp?.totalReadCount || 0;
                const intensity = getReadingIntensity(readCount);
                const colorClass = getIntensityColor(intensity);
                const borderClass = getIntensityBorder(intensity);
                const chaptersRead = bp?.readChapters || 0;
                
                return (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/biblia/${book.name.toLowerCase().replace(/\s/g, "-")}`)}
                    className={cn(
                      "p-3 rounded-xl text-left transition-all duration-300",
                      "border-2 hover:shadow-md active:scale-[0.98]",
                      "opacity-0 animate-fade-in",
                      colorClass,
                      borderClass
                    )}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{book.book_number}</span>
                      {chaptersRead > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          {chaptersRead}/{book.chapters_count}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{book.name}</h3>
                    <p className="text-xs text-muted-foreground">{book.chapters_count} cap.</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PageContainer>

      <BottomNav />
    </>
  );
}
