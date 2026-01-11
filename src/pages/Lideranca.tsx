import { ChevronLeft, Phone, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Leader = {
  id: number;
  name: string;
  role: string;
  photo: string;
  phone: string;
  email?: string;
  whatsapp: string;
  ministry?: string;
};

const diretoria: Leader[] = [
  { id: 1, name: "Pr. João Silva", role: "Pastor Presidente", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format", phone: "(11) 99999-0001", email: "pr.joao@zoechurch.com.br", whatsapp: "5511999990001" },
  { id: 2, name: "Pra. Maria Silva", role: "Pastora Presidente", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format", phone: "(11) 99999-0002", email: "pra.maria@zoechurch.com.br", whatsapp: "5511999990002" },
  { id: 3, name: "Pr. Carlos Santos", role: "Vice-Presidente", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format", phone: "(11) 99999-0003", email: "pr.carlos@zoechurch.com.br", whatsapp: "5511999990003" },
];

const lideresMinisterio: Leader[] = [
  { id: 4, name: "Pedro Oliveira", role: "Líder de Louvor", ministry: "Ministério de Louvor", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format", phone: "(11) 99999-0004", whatsapp: "5511999990004" },
  { id: 5, name: "Ana Costa", role: "Líder de Jovens", ministry: "Ministério de Jovens", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format", phone: "(11) 99999-0005", whatsapp: "5511999990005" },
  { id: 6, name: "Lucas Ferreira", role: "Líder de Mídia", ministry: "Ministério de Mídia", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format", phone: "(11) 99999-0006", whatsapp: "5511999990006" },
  { id: 7, name: "Juliana Mendes", role: "Líder Infantil", ministry: "Ministério Infantil", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format", phone: "(11) 99999-0007", whatsapp: "5511999990007" },
];

export default function Lideranca() {
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Liderança</h1>
          </div>
        </div>
      </header>

      <PageContainer>
        <Tabs defaultValue="diretoria" className="w-full pt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="diretoria">Diretoria</TabsTrigger>
            <TabsTrigger value="ministerios">Ministérios</TabsTrigger>
          </TabsList>

          <TabsContent value="diretoria" className="mt-0 space-y-4">
            {diretoria.map((leader, index) => (
              <LeaderCard key={leader.id} leader={leader} delay={index * 50} />
            ))}
          </TabsContent>

          <TabsContent value="ministerios" className="mt-0 space-y-4">
            {lideresMinisterio.map((leader, index) => (
              <LeaderCard key={leader.id} leader={leader} delay={index * 50} />
            ))}
          </TabsContent>
        </Tabs>
      </PageContainer>

      <BottomNav />
    </>
  );
}

function LeaderCard({ leader, delay }: { leader: Leader; delay: number }) {
  return (
    <div className={cn("p-4 rounded-2xl bg-card border border-border transition-all duration-200 hover:shadow-md opacity-0 animate-fade-in")} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{leader.name}</h3>
          <p className="text-sm text-primary">{leader.role}</p>
          {leader.ministry && <p className="text-xs text-muted-foreground">{leader.ministry}</p>}
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => window.open(`https://wa.me/${leader.whatsapp}`, "_blank")}>
              <MessageCircle className="h-4 w-4 mr-1 text-convertidos" />WhatsApp
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => window.open(`tel:${leader.phone}`, "_self")}>
              <Phone className="h-4 w-4" />
            </Button>
            {leader.email && (
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => window.open(`mailto:${leader.email}`, "_self")}>
                <Mail className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
