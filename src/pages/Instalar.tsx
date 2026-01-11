import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Share, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Instalar() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O ZOE Church já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Abrir o App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/icons/icon-192x192.png" 
              alt="ZOE Church" 
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl">Instalar ZOE Church</CardTitle>
          <CardDescription>
            Tenha acesso rápido à Bíblia, Harpa e muito mais na tela inicial do seu celular
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-full bg-primary/10">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <span>Acesso rápido pela tela inicial</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-full bg-primary/10">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <span>Funciona mesmo sem internet</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-full bg-primary/10">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span>Notificações de devocionais</span>
            </div>
          </div>

          {/* Install Button or iOS Instructions */}
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no iPhone/iPad:
              </p>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Toque em</span>
                    <Share className="w-4 h-4" />
                    <span>(Compartilhar)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Role e toque em</span>
                    <Plus className="w-4 h-4" />
                    <span>"Adicionar à Tela de Início"</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Toque em "Adicionar"</span>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full gap-2" size="lg">
              <Download className="w-5 h-5" />
              Instalar Agora
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no Android:
              </p>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Toque em</span>
                    <MoreVertical className="w-4 h-4" />
                    <span>(Menu)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">"Instalar aplicativo" ou "Adicionar à tela inicial"</span>
                </div>
              </div>
            </div>
          )}

          <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
            Continuar no navegador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
