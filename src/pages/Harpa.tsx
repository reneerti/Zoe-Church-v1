import { useState } from "react";
import { ChevronLeft, Search, Heart, Music2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHarpaHymns, useFavoriteHymns, useToggleFavoriteHymn, HarpaHymn } from "@/hooks/useHarpaData";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Harpa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  const { data: hymns = [], isLoading } = useHarpaHymns();
  const { data: favoriteHymns = [] } = useFavoriteHymns(user?.id);
  const toggleFavorite = useToggleFavoriteHymn(user?.id);

  const favoriteHymnIds = favoriteHymns.map(f => f.hymn_id);

  const filteredHymns = hymns.filter((hymn) => {
    const matchesSearch = 
      hymn.title.toLowerCase().includes(search.toLowerCase()) ||
      hymn.hymn_number.toString().includes(search);
    
    if (activeTab === "favoritos") {
      return matchesSearch && favoriteHymnIds.includes(hymn.id);
    }
    return matchesSearch;
  });

  const handleToggleFavorite = (hymn: HarpaHymn, isFavorite: boolean) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar seus hinos favoritos",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    toggleFavorite.mutate({ hymnId: hymn.id, isFavorite });
  };

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
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hymns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum hino disponível</p>
                <p className="text-sm">Os hinos serão carregados em breve</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHymns.map((hymn, index) => (
                  <HymnCard 
                    key={hymn.id} 
                    hymn={hymn} 
                    isFavorite={favoriteHymnIds.includes(hymn.id)}
                    onToggleFavorite={handleToggleFavorite}
                    delay={index * 30}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favoritos" className="mt-0">
            <div className="space-y-2">
              {filteredHymns.map((hymn, index) => (
                <HymnCard 
                  key={hymn.id} 
                  hymn={hymn} 
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
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
            Mostrando {filteredHymns.length} de {hymns.length > 0 ? hymns.length : 640} hinos
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
  onToggleFavorite,
  delay 
}: { 
  hymn: HarpaHymn; 
  isFavorite: boolean;
  onToggleFavorite: (hymn: HarpaHymn, isFavorite: boolean) => void;
  delay: number;
}) {
  const navigate = useNavigate();

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
        <span className="font-bold text-harpa">{hymn.hymn_number}</span>
      </div>
      
      <button 
        className="flex-1 text-left"
        onClick={() => navigate(`/harpa/${hymn.hymn_number}`)}
      >
        <h3 className="font-medium">{hymn.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {hymn.author || "Harpa Cristã"}
        </p>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 flex-shrink-0"
        onClick={() => onToggleFavorite(hymn, isFavorite)}
      >
        <Heart 
          className={cn(
            "h-5 w-5 transition-colors",
            isFavorite ? "fill-ofertas text-ofertas" : "text-muted-foreground"
          )} 
        />
      </Button>
    </div>
  );
}
