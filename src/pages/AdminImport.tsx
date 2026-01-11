import { useState } from "react";
import { ChevronLeft, Database, RefreshCw, Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

export default function AdminImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [importing, setImporting] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const importData = async (action: string, description: string) => {
    setImporting(action);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('import-bible', {
        body: { action }
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
        description: `${description} importado(s) com sucesso.`,
      });
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
      action: 'import-sample-verses',
      title: 'Versículos de Exemplo',
      description: 'Importa Gênesis 1 (NVI) como amostra',
      icon: Database,
    },
    {
      action: 'import-sample-hymns',
      title: 'Hinos de Exemplo',
      description: 'Importa os primeiros 3 hinos da Harpa',
      icon: Database,
    },
    {
      action: 'import-harpa-batch-1',
      title: 'Harpa Cristã (1-50)',
      description: 'Importa os hinos 1 a 50',
      icon: Database,
    },
    {
      action: 'import-harpa-batch-2',
      title: 'Harpa Cristã (51-100)',
      description: 'Importa os hinos 51 a 100',
      icon: Database,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg ml-2">Importar Dados</h1>
        </div>
      </header>

      <PageContainer>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Use esta página para popular o banco de dados com os dados da Bíblia e Harpa Cristã.
          </p>

          {importActions.map((item) => {
            const result = results[item.action];
            const isImporting = importing === item.action;

            return (
              <Card key={item.action}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
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

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Importação Completa via SQL</CardTitle>
              <CardDescription>
                Para importar a Bíblia completa (NVI, NTLH, ARA) e todos os 640 hinos, 
                use o SQL Editor do Supabase Dashboard com scripts SQL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://supabase.com/dashboard/project/allfhenlhsjkuatczato/sql/new', '_blank')}
              >
                Abrir SQL Editor
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
