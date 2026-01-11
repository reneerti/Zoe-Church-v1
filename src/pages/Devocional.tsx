import { useState } from "react";
import { ChevronLeft, Plus, BookHeart, Sparkles, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Sample devotionals
const churchDevotionals = [
  {
    id: 1,
    title: "A Força da Fé em Tempos Difíceis",
    verse: "Hebreus 11:1",
    verseText: "Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.",
    content: "Em tempos de incerteza, a fé se torna nossa âncora. Quando tudo ao nosso redor parece instável, é a fé que nos mantém firmes...",
    author: "Pr. João Silva",
    date: new Date(),
    isToday: true,
  },
  {
    id: 2,
    title: "O Poder da Gratidão",
    verse: "1 Tessalonicenses 5:18",
    verseText: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.",
    content: "A gratidão transforma nossa perspectiva. Quando escolhemos ser gratos, mesmo nas dificuldades, abrimos nosso coração...",
    author: "Pra. Maria Santos",
    date: subDays(new Date(), 1),
    isToday: false,
  },
  {
    id: 3,
    title: "Confiança no Senhor",
    verse: "Provérbios 3:5-6",
    verseText: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
    content: "Confiar no Senhor requer humildade. Precisamos reconhecer que não temos todas as respostas...",
    author: "Pr. João Silva",
    date: subDays(new Date(), 2),
    isToday: false,
  },
];

const myDevotionals = [
  {
    id: 101,
    title: "Minha reflexão sobre Salmos 23",
    verse: "Salmos 23:1",
    date: subDays(new Date(), 3),
  },
  {
    id: 102,
    title: "O amor de Deus",
    verse: "João 3:16",
    date: subDays(new Date(), 5),
  },
];

export default function Devocional() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("igreja");

  const todayDevotional = churchDevotionals.find((d) => d.isToday);

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
            <h1 className="font-bold text-lg">Devocional</h1>
          </div>
          
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <PageContainer>
        {/* Today's Devotional Highlight */}
        {todayDevotional && (
          <div className="py-4">
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-devocional to-devocional/80 text-devocional-foreground opacity-0 animate-fade-in">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider opacity-90">
                    Devocional do Dia
                  </span>
                </div>
                
                <h2 className="font-semibold text-lg mb-2">{todayDevotional.title}</h2>
                
                <blockquote className="font-serif text-sm leading-relaxed mb-3 opacity-95">
                  "{todayDevotional.verseText}"
                </blockquote>
                
                <p className="text-sm opacity-90">
                  {todayDevotional.verse} • {todayDevotional.author}
                </p>
                
                <Button 
                  className="mt-4 bg-white/20 hover:bg-white/30 text-devocional-foreground"
                  size="sm"
                >
                  Ler Completo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="igreja" className="flex items-center gap-2">
              <BookHeart className="h-4 w-4" />
              Da Igreja
            </TabsTrigger>
            <TabsTrigger value="meus" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Meus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="igreja" className="mt-0 space-y-3">
            {churchDevotionals.filter((d) => !d.isToday).map((devotional, index) => (
              <DevotionalCard key={devotional.id} devotional={devotional} delay={index * 50} />
            ))}
          </TabsContent>

          <TabsContent value="meus" className="mt-0">
            {myDevotionals.length > 0 ? (
              <div className="space-y-3">
                {myDevotionals.map((devotional, index) => (
                  <div
                    key={devotional.id}
                    className={cn(
                      "p-4 rounded-xl bg-card border border-border",
                      "transition-all duration-200 hover:shadow-md",
                      "opacity-0 animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <h3 className="font-medium">{devotional.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {devotional.verse} • {format(devotional.date, "dd/MM/yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookHeart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum devocional pessoal ainda</p>
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Devocional
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Generate Button */}
        <div className="fixed bottom-24 right-4 z-40">
          <Button 
            className="rounded-full shadow-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar com IA
          </Button>
        </div>
      </PageContainer>

      <BottomNav />
    </>
  );
}

function DevotionalCard({ 
  devotional, 
  delay 
}: { 
  devotional: typeof churchDevotionals[0]; 
  delay: number;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-card border border-border",
        "transition-all duration-200 hover:shadow-md",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-devocional/10 flex items-center justify-center flex-shrink-0">
          <BookHeart className="h-5 w-5 text-devocional" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{devotional.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{devotional.verse}</p>
          
          <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
            {devotional.content}
          </p>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{devotional.author}</span>
            <span>•</span>
            <span>{format(devotional.date, "dd/MM", { locale: ptBR })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
