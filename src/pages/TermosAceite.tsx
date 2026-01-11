import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, FileText, Shield, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function TermosAceite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [termosUso, setTermosUso] = useState<any>(null);
  const [termosPrivacidade, setTermosPrivacidade] = useState<any>(null);
  const [aceitouUso, setAceitouUso] = useState(false);
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTermos();
  }, []);

  const fetchTermos = async () => {
    // Buscar termos ativos
    const { data: termos, error } = await supabase
      .from("termos_versoes")
      .select("*")
      .eq("ativo", true);

    if (error) {
      console.error("Erro ao buscar termos:", error);
      setLoading(false);
      return;
    }

    const uso = termos?.find(t => t.tipo === "uso");
    const privacidade = termos?.find(t => t.tipo === "privacidade");

    setTermosUso(uso);
    setTermosPrivacidade(privacidade);
    setLoading(false);
  };

  const handleAceitar = async () => {
    if (!aceitouUso || !aceitouPrivacidade) {
      toast.error("Você precisa aceitar todos os termos para continuar");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setSubmitting(true);

    try {
      // Registrar aceites
      const aceites = [];
      
      if (termosUso) {
        aceites.push({
          user_id: user.id,
          termo_id: termosUso.id,
          ip_address: null, // Seria obtido via API
          user_agent: navigator.userAgent
        });
      }
      
      if (termosPrivacidade) {
        aceites.push({
          user_id: user.id,
          termo_id: termosPrivacidade.id,
          ip_address: null,
          user_agent: navigator.userAgent
        });
      }

      if (aceites.length > 0) {
        const { error: aceiteError } = await supabase
          .from("aceites_termos")
          .insert(aceites);

        if (aceiteError) throw aceiteError;
      }

      // Atualizar usuario
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          aceite_termos: true,
          aceite_termos_em: new Date().toISOString(),
          aceite_privacidade: true,
          aceite_privacidade_em: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) {
        // Tentar atualizar em masters se não encontrou em usuarios
        await supabase
          .from("masters")
          .update({
            is_active: true // Masters não têm campo de aceite separado
          })
          .eq("user_id", user.id);
      }

      toast.success("Termos aceitos com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
      toast.error("Erro ao registrar aceite. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando termos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Termos e Privacidade</h1>
          <p className="text-muted-foreground mt-2">
            Antes de continuar, você precisa aceitar nossos termos
          </p>
        </div>

        {/* Termos de Uso */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Termos de Uso
            </CardTitle>
            <CardDescription>
              {termosUso ? `Versão ${termosUso.versao}` : "Carregando..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 rounded-lg border p-4 mb-4">
              {termosUso ? (
                <div className="prose prose-sm dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: termosUso.conteudo.replace(/\n/g, '<br/>') }} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <h3 className="font-semibold mb-2">TERMOS DE USO DO APLICATIVO</h3>
                  <p className="mb-2">
                    1. ACEITAÇÃO DOS TERMOS<br/>
                    Ao acessar e usar este aplicativo, você aceita e concorda em cumprir estes termos.
                  </p>
                  <p className="mb-2">
                    2. USO DO APLICATIVO<br/>
                    O aplicativo é destinado ao uso por membros da igreja para acesso a conteúdos bíblicos, 
                    participação em comunidade e acompanhamento de atividades eclesiásticas.
                  </p>
                  <p className="mb-2">
                    3. CONTA DO USUÁRIO<br/>
                    Você é responsável por manter a confidencialidade de suas credenciais de acesso.
                  </p>
                  <p className="mb-2">
                    4. CONDUTA DO USUÁRIO<br/>
                    Você concorda em usar o aplicativo de forma ética, respeitosa e em conformidade com 
                    os princípios cristãos.
                  </p>
                  <p>
                    5. MODIFICAÇÕES<br/>
                    Reservamo-nos o direito de modificar estes termos a qualquer momento.
                  </p>
                </div>
              )}
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="termos-uso" 
                checked={aceitouUso}
                onCheckedChange={(checked) => setAceitouUso(checked as boolean)}
              />
              <label 
                htmlFor="termos-uso" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Li e aceito os Termos de Uso
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Política de Privacidade */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Política de Privacidade
            </CardTitle>
            <CardDescription>
              {termosPrivacidade ? `Versão ${termosPrivacidade.versao}` : "Carregando..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 rounded-lg border p-4 mb-4">
              {termosPrivacidade ? (
                <div className="prose prose-sm dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: termosPrivacidade.conteudo.replace(/\n/g, '<br/>') }} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <h3 className="font-semibold mb-2">POLÍTICA DE PRIVACIDADE</h3>
                  <p className="mb-2">
                    1. COLETA DE DADOS<br/>
                    Coletamos informações que você nos fornece diretamente, como nome, email e 
                    dados de uso do aplicativo.
                  </p>
                  <p className="mb-2">
                    2. USO DAS INFORMAÇÕES<br/>
                    Utilizamos suas informações para fornecer e melhorar nossos serviços, 
                    personalizar sua experiência e comunicar novidades.
                  </p>
                  <p className="mb-2">
                    3. COMPARTILHAMENTO<br/>
                    Não compartilhamos suas informações pessoais com terceiros, exceto quando 
                    necessário para fornecer o serviço ou por exigência legal.
                  </p>
                  <p className="mb-2">
                    4. SEGURANÇA<br/>
                    Implementamos medidas de segurança para proteger suas informações contra 
                    acesso não autorizado.
                  </p>
                  <p>
                    5. SEUS DIREITOS<br/>
                    Você tem direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento.
                  </p>
                </div>
              )}
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="termos-privacidade" 
                checked={aceitouPrivacidade}
                onCheckedChange={(checked) => setAceitouPrivacidade(checked as boolean)}
              />
              <label 
                htmlFor="termos-privacidade" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Li e aceito a Política de Privacidade
              </label>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full" 
          size="lg"
          disabled={!aceitouUso || !aceitouPrivacidade || submitting}
          onClick={handleAceitar}
        >
          {submitting ? (
            "Processando..."
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Aceitar e Continuar
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Ao clicar em "Aceitar e Continuar", você confirma que leu e concorda com nossos 
          Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
