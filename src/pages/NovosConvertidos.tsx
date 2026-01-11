import { ChevronLeft, Heart, Play, BookOpen, Users, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const welcomeContent = {
  title: "Bem-vindo à Família ZOE!",
  message: "Estamos muito felizes pela sua decisão de entregar sua vida a Jesus. Este é apenas o começo de uma jornada maravilhosa. Queremos caminhar ao seu lado nessa nova fase!",
  pastorMessage: "Querido(a) irmão(ã), que alegria saber que você decidiu seguir Jesus! Aqui na ZOE Church, você encontrará uma família pronta para acolhê-lo e ajudá-lo a crescer na fé. Conte conosco!",
  pastorName: "Pr. João e Pra. Maria Silva",
};

const songs = [
  { id: 1, title: "Oceanos", artist: "Hillsong", platform: "spotify" },
  { id: 2, title: "Todavia Me Alegrarei", artist: "Isaías Saad", platform: "spotify" },
  { id: 3, title: "Não Pare", artist: "Midian Lima", platform: "youtube" },
  { id: 4, title: "A Casa É Sua", artist: "Casa Worship", platform: "spotify" },
];

const growthSteps = [
  { id: 1, title: "Aceitar Jesus", description: "Você já fez isso! Parabéns!", completed: true },
  { id: 2, title: "Batismo nas Águas", description: "Próximo passo: declare publicamente sua fé", completed: false },
  { id: 3, title: "Participar de uma Célula", description: "Conecte-se com outros irmãos", completed: false },
  { id: 4, title: "Curso de Novos Convertidos", description: "Fundamentos da fé cristã", completed: false },
  { id: 5, title: "Descobrir seu Chamado", description: "Encontre seu lugar no Corpo de Cristo", completed: false },
];

const beliefs = [
  "Cremos em um só Deus, eternamente existente em três pessoas: Pai, Filho e Espírito Santo.",
  "Cremos na inspiração divina da Bíblia como única regra infalível de fé.",
  "Cremos na salvação pela graça, mediante a fé em Jesus Cristo.",
  "Cremos na necessidade do novo nascimento e na vida eterna.",
];

export default function NovosConvertidos() {
  const navigate = useNavigate();

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
            <h1 className="font-bold text-lg">Novos Convertidos</h1>
          </div>
        </div>
      </header>

      <PageContainer>
        {/* Welcome Card */}
        <div className="py-4">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-convertidos to-convertidos/80 text-convertidos-foreground opacity-0 animate-fade-in">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 fill-current" />
                <span className="font-medium">Boas-vindas</span>
              </div>
              
              <h2 className="text-2xl font-bold mb-3">{welcomeContent.title}</h2>
              <p className="text-sm opacity-95 leading-relaxed">{welcomeContent.message}</p>
            </div>
          </div>
        </div>

        {/* Pastor's Message */}
        <Card className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Carta do Pastor</h3>
            <blockquote className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
              "{welcomeContent.pastorMessage}"
            </blockquote>
            <p className="text-sm font-medium text-primary mt-2">— {welcomeContent.pastorName}</p>
          </CardContent>
        </Card>

        {/* Growth Steps */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Trilha de Crescimento
          </h3>
          
          <div className="space-y-3">
            {growthSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl",
                  "bg-card border border-border",
                  "opacity-0 animate-fade-in",
                  step.completed && "bg-convertidos/5 border-convertidos/30"
                )}
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  step.completed 
                    ? "bg-convertidos text-convertidos-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold text-sm">{step.id}</span>
                  )}
                </div>
                
                <div>
                  <h4 className={cn(
                    "font-medium",
                    step.completed && "text-convertidos"
                  )}>{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Songs for New Believers */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Play className="h-5 w-5 text-harpa" />
            Canções para Você
          </h3>
          
          <div className="space-y-2">
            {songs.map((song, index) => (
              <button
                key={song.id}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl",
                  "bg-card border border-border text-left",
                  "hover:shadow-md transition-all",
                  "opacity-0 animate-fade-in"
                )}
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-harpa/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-harpa" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{song.title}</h4>
                  <p className="text-xs text-muted-foreground">{song.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* What We Believe */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-bible" />
            O que Cremos
          </h3>
          
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "600ms" }}>
            <CardContent className="p-4 space-y-3">
              {beliefs.map((belief, index) => (
                <p key={index} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  {belief}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <BottomNav />
    </>
  );
}
