import { ChevronLeft, Copy, QrCode, Heart, Target, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

// Church PIX info
const pixInfo = {
  key: "00.000.000/0001-00",
  keyType: "CNPJ",
  bankName: "Banco do Brasil",
};

// Sample campaigns
const campaigns = [
  {
    id: 1,
    title: "Reforma do Templo",
    description: "Estamos reformando nosso templo para melhor acomodar a família ZOE.",
    goal: 50000,
    current: 32500,
    endDate: "31/03/2026",
    pixKey: "reforma@zoechurch.com.br",
  },
  {
    id: 2,
    title: "Missões 2026",
    description: "Apoie nossos missionários no campo e ajude a levar o evangelho.",
    goal: 20000,
    current: 15800,
    endDate: "30/06/2026",
    pixKey: "missoes@zoechurch.com.br",
  },
];

export default function Ofertas() {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, label: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(`${label} copiada!`);
    setTimeout(() => setCopiedKey(null), 2000);
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
            <h1 className="font-bold text-lg">Ofertas e Dízimos</h1>
          </div>
        </div>
      </header>

      <PageContainer>
        {/* Main PIX Card */}
        <div className="py-4">
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-ofertas to-ofertas/80 text-ofertas-foreground opacity-0 animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5" />
                <span className="font-medium">PIX da Igreja</span>
              </div>

              {/* QR Code Placeholder */}
              <div className="w-48 h-48 mx-auto bg-white rounded-xl p-3 mb-4">
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="h-20 w-20 text-muted-foreground" />
                </div>
              </div>

              {/* PIX Key */}
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-xs opacity-80 mb-1">{pixInfo.keyType}</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold flex-1">{pixInfo.key}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-ofertas-foreground hover:bg-white/20"
                    onClick={() => handleCopy(pixInfo.key, "Chave PIX")}
                  >
                    {copiedKey === pixInfo.key ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs opacity-80 mt-1">{pixInfo.bankName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="py-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Campanhas Ativas
          </h2>

          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onCopy={handleCopy}
                copiedKey={copiedKey}
                delay={index * 100}
              />
            ))}
          </div>
        </div>

        {/* Info Text */}
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria."
          </p>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            2 Coríntios 9:7
          </p>
        </div>
      </PageContainer>

      <BottomNav />
    </>
  );
}

function CampaignCard({ 
  campaign, 
  onCopy,
  copiedKey,
  delay 
}: { 
  campaign: typeof campaigns[0];
  onCopy: (key: string, label: string) => void;
  copiedKey: string | null;
  delay: number;
}) {
  const progress = (campaign.current / campaign.goal) * 100;

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-card border border-border",
        "transition-all duration-200 hover:shadow-md",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="font-semibold">{campaign.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">
            R$ {campaign.current.toLocaleString('pt-BR')}
          </span>
          <span className="text-muted-foreground">
            Meta: R$ {campaign.goal.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-ofertas to-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Até {campaign.endDate}
        </p>
      </div>

      {/* Campaign PIX */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">PIX da Campanha</p>
            <p className="font-mono text-sm">{campaign.pixKey}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onCopy(campaign.pixKey, "Chave PIX")}
          >
            {copiedKey === campaign.pixKey ? (
              <Check className="h-4 w-4 text-convertidos" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
