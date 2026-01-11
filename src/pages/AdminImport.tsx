import { useState } from "react";
import { ChevronLeft, Database, RefreshCw, Check, AlertCircle, BookOpen, Music, Library, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ImportStatus {
  livros: number;
  versoes: number;
  versiculos: number;
  hinos: number;
}

export default function AdminImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [importing, setImporting] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-database', {
        body: { action: 'status' }
      });
      if (error) throw error;
      setStatus(data.status);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const importData = async (action: string, description: string, options?: { batch?: number; version?: string }) => {
    setImporting(action);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 300);

      const { data, error } = await supabase.functions.invoke('populate-database', {
        body: { action, ...options }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResults(prev => ({
        ...prev,
        [action]: { success: true, message: data.message || 'Importação concluída!' }
      }));

      toast({
        title: "Sucesso!",
        description: data.message || `${description} importado(s) com sucesso.`,
      });

      // Se tem próximo batch, continua automaticamente
      if (data.nextBatch) {
        setTimeout(() => {
          importData(action, description, { ...options, batch: data.nextBatch });
        }, 500);
      } else {
        fetchStatus();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setResults(prev => ({
        ...prev,
        [action]: { success: false, message }
      }));

      toast({
        title: "Erro na importação",
        description: message,
        variant: "destructive",
      });
    } finally {
      if (!results[action]?.message?.includes('nextBatch')) {
        setImporting(null);
        setProgress(0);
      }
    }
  };

  const importAllData = async () => {
    setImporting('import-all');
    setProgress(0);

    try {
      // 1. Importar base (versões, livros, hinos)
      setProgress(10);
      await supabase.functions.invoke('populate-database', {
        body: { action: 'import-all' }
      });

      // 2. Importar versículos NVI
      setProgress(20);
      for (let batch = 1; batch <= 14; batch++) {
        await supabase.functions.invoke('populate-database', {
          body: { action: 'import-verses', batch, version: 'NVI' }
        });
        setProgress(20 + (batch * 5));
      }

      // 3. Importar versículos ARA
      setProgress(50);
      for (let batch = 1; batch <= 14; batch++) {
        await supabase.functions.invoke('populate-database', {
          body: { action: 'import-verses', batch, version: 'ARA' }
        });
        setProgress(50 + (batch * 3));
      }

      // 4. Importar versículos NTLH
      setProgress(80);
      for (let batch = 1; batch <= 14; batch++) {
        await supabase.functions.invoke('populate-database', {
          body: { action: 'import-verses', batch, version: 'NTLH' }
        });
        setProgress(80 + (batch * 1.5));
      }

      setProgress(100);
      toast({
        title: "Importação Completa!",
        description: "Bíblia (3 versões) e Harpa Cristã (640 hinos) importados com sucesso!",
      });

      fetchStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro na importação",
        description: message,
        variant: "destructive",
      });
    } finally {
      setImporting(null);
      setProgress(0);
    }
  };

  if (!user) {
    return (
      <>
        <header className="sticky top-0 z-40 glass safe-area-inset-top">
          <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg ml-2">Administração</h1>
          </div>
        </header>
        <PageContainer>
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">Faça login para acessar esta área.</p>
            <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const importActions = [
    {
      action: 'import-all',
      title: 'Importação Rápida',
      description: 'Importa versões, livros e todos os 640 hinos da Harpa',
      icon: Zap,
      color: 'text-yellow-500',
    },
    {
      action: 'import-versions',
      title: 'Versões da Bíblia',
      description: 'Importa NVI, ARA, NTLH, ACF, KJV',
      icon: Library,
      color: 'text-blue-500',
    },
    {
      action: 'import-books',
      title: 'Livros da Bíblia',
      description: 'Importa os 66 livros (AT e NT)',
      icon: BookOpen,
      color: 'text-green-500',
    },
    {
      action: 'import-harpa',
      title: 'Harpa Cristã Completa',
      description: 'Importa todos os 640 hinos em batches',
      icon: Music,
      color: 'text-purple-500',
    },
  ];

  const versesImport = [
    { version: 'NVI', name: 'Nova Versão Internacional' },
    { version: 'ARA', name: 'Almeida Revista e Atualizada' },
    { version: 'NTLH', name: 'Nova Tradução na Linguagem de Hoje' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg ml-2">Popular Banco de Dados</h1>
        </div>
      </header>

      <PageContainer>
        <div className="py-4 space-y-4">
          {/* Status Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Status do Banco
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loadingStatus}>
                  <RefreshCw className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {status ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status.versoes}</Badge>
                    <span className="text-sm text-muted-foreground">Versões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status.livros}</Badge>
                    <span className="text-sm text-muted-foreground">Livros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status.versiculos.toLocaleString()}</Badge>
                    <span className="text-sm text-muted-foreground">Versículos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status.hinos}</Badge>
                    <span className="text-sm text-muted-foreground">Hinos</span>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={fetchStatus} className="w-full">
                  Verificar Status
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Importação Completa */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Importação Completa Automática
              </CardTitle>
              <CardDescription>
                Importa tudo: 66 livros, 3 versões, ~31.000 versículos e 640 hinos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importing === 'import-all' && (
                <div className="mb-3">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% concluído</p>
                </div>
              )}
              <Button
                onClick={importAllData}
                disabled={importing !== null}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {importing === 'import-all' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Importar Tudo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cards de importação individual */}
          {importActions.slice(1).map((item) => {
            const result = results[item.action];
            const isImporting = importing === item.action;

            return (
              <Card key={item.action}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isImporting && (
                    <Progress value={progress} className="mb-3" />
                  )}
                  
                  {result && (
                    <div className={`flex items-center gap-2 text-sm mb-3 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {result.message}
                    </div>
                  )}

                  <Button
                    onClick={() => importData(item.action, item.title)}
                    disabled={importing !== null}
                    className="w-full"
                    variant="outline"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      'Importar'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {/* Importação de versículos por versão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versículos por Versão</CardTitle>
              <CardDescription>
                Importa versículos em batches de 5 livros por vez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {versesImport.map((v) => (
                <Button
                  key={v.version}
                  onClick={() => importData('import-verses', `Versículos ${v.version}`, { version: v.version, batch: 1 })}
                  disabled={importing !== null}
                  className="w-full"
                  variant="outline"
                >
                  Importar {v.version}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
