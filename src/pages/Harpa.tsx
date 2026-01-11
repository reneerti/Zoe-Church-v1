import { useState } from "react";
import { ChevronLeft, Search, Heart, Music2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample hymns data
const hymns = [
  { number: 1, title: "Chuvas de Graça", category: "Adoração" },
  { number: 2, title: "Saudai o Nome de Jesus", category: "Louvor" },
  { number: 13, title: "Bendito Seja o Cordeiro", category: "Adoração" },
  { number: 15, title: "Eis o Pendão", category: "Louvor" },
  { number: 21, title: "Tudo Entregarei", category: "Consagração" },
  { number: 25, title: "Cristo Já Ressuscitou", category: "Páscoa" },
  { number: 56, title: "Mais Perto Quero Estar", category: "Comunhão" },
  { number: 77, title: "Castelo Forte", category: "Louvor" },
  { number: 100, title: "Santo! Santo! Santo!", category: "Adoração" },
  { number: 155, title: "Grandioso És Tu", category: "Adoração" },
  { number: 212, title: "Rude Cruz", category: "Páscoa" },
  { number: 291, title: "Ao Deus de Abraão Louvai", category: "Louvor" },
  { number: 300, title: "Fala, Jesus Querido", category: "Comunhão" },
  { number: 400, title: "Quão Bondoso Amigo", category: "Comunhão" },
  { number: 525, title: "Deixa a Luz do Céu Entrar", category: "Louvor" },
];

const favoriteHymns = [1, 56, 155, 212, 400];

export default function Harpa() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  const filteredHymns = hymns.filter((hymn) => {
    const matchesSearch = 
      hymn.title.toLowerCase().includes(search.toLowerCase()) ||
      hymn.number.toString().includes(search);
    
    if (activeTab === "favoritos") {
      return matchesSearch && favoriteHymns.includes(hymn.number);
    }
    return matchesSearch;
  });

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
            <h1 className="font-bold text-lg">Harpa Cristã</h1>
          </div>
          
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <PageContainer>
        {/* Search */}
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favoritos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-0">
            <div className="space-y-2">
              {filteredHymns.map((hymn, index) => (
                <HymnCard 
                  key={hymn.number} 
                  hymn={hymn} 
                  isFavorite={favoriteHymns.includes(hymn.number)}
                  delay={index * 30}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favoritos" className="mt-0">
            <div className="space-y-2">
              {filteredHymns.map((hymn, index) => (
                <HymnCard 
                  key={hymn.number} 
                  hymn={hymn} 
                  isFavorite={true}
                  delay={index * 30}
                />
              ))}
              {filteredHymns.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum hino favorito ainda</p>
                  <p className="text-sm">Toque no coração para adicionar</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Total Count */}
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredHymns.length} de 640 hinos
          </p>
        </div>
      </PageContainer>

      <BottomNav />
    </>
  );
}

function HymnCard({ 
  hymn, 
  isFavorite,
  delay 
}: { 
  hymn: { number: number; title: string; category: string }; 
  isFavorite: boolean;
  delay: number;
}) {
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(isFavorite);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "bg-card border border-border",
        "transition-all duration-200 hover:shadow-md",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-harpa/10 flex items-center justify-center">
        <span className="font-bold text-harpa">{hymn.number}</span>
      </div>
      
      <button 
        className="flex-1 text-left"
        onClick={() => navigate(`/harpa/${hymn.number}`)}
      >
        <h3 className="font-medium">{hymn.title}</h3>
        <p className="text-xs text-muted-foreground">{hymn.category}</p>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 flex-shrink-0"
        onClick={() => setFavorite(!favorite)}
      >
        <Heart 
          className={cn(
            "h-5 w-5 transition-colors",
            favorite ? "fill-ofertas text-ofertas" : "text-muted-foreground"
          )} 
        />
      </Button>
    </div>
  );
}
