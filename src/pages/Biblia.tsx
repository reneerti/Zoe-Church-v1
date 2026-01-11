import { useState } from "react";
import { ChevronLeft, Settings, Search, BookOpen } from "lucide-react";
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

const bibleVersions = [
  { id: "nvi", name: "NVI" },
  { id: "ntlh", name: "NTLH" },
  { id: "ara", name: "ARA" },
];

const testaments = [
  { id: "old", name: "Velho Testamento", books: 39 },
  { id: "new", name: "Novo Testamento", books: 27 },
];

const oldTestamentBooks = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
  "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel",
  "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras",
  "Neemias", "Ester", "Jó", "Salmos", "Provérbios",
  "Eclesiastes", "Cantares", "Isaías", "Jeremias", "Lamentações",
  "Ezequiel", "Daniel", "Oséias", "Joel", "Amós",
  "Obadias", "Jonas", "Miquéias", "Naum", "Habacuque",
  "Sofonias", "Ageu", "Zacarias", "Malaquias"
];

const newTestamentBooks = [
  "Mateus", "Marcos", "Lucas", "João", "Atos",
  "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios",
  "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo",
  "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago",
  "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João",
  "Judas", "Apocalipse"
];

export default function Biblia() {
  const navigate = useNavigate();
  const [version, setVersion] = useState("nvi");
  const [selectedTestament, setSelectedTestament] = useState<"old" | "new" | null>(null);

  const books = selectedTestament === "old" ? oldTestamentBooks : 
                selectedTestament === "new" ? newTestamentBooks : [];

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
                {bibleVersions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-9 w-9">
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
                onClick={() => setSelectedTestament(testament.id as "old" | "new")}
                className={cn(
                  "w-full p-5 rounded-2xl text-left transition-all duration-200",
                  "opacity-0 animate-fade-in hover:scale-[1.02] active:scale-[0.98]",
                  testament.id === "old" 
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
              <h3 className="font-semibold mb-3">Seu Progresso</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Versículos lidos</span>
                  <span className="font-medium">0 / 31.102</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
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
                {selectedTestament === "old" ? "Velho Testamento" : "Novo Testamento"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {books.map((book, index) => (
                <button
                  key={book}
                  onClick={() => navigate(`/biblia/${book.toLowerCase().replace(/\s/g, "-")}`)}
                  className={cn(
                    "p-3 rounded-xl text-left transition-all duration-200",
                    "bg-card border border-border hover:border-primary/50",
                    "hover:shadow-md active:scale-[0.98]",
                    "opacity-0 animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                  <h3 className="font-medium text-sm truncate">{book}</h3>
                </button>
              ))}
            </div>
          </div>
        )}
      </PageContainer>

      <BottomNav />
    </>
  );
}
