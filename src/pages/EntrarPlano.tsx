import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookOpen, Users, Calendar, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PlanoInfo {
  id: string;
  titulo: string;
  descricao: string;
  duracao_dias: number;
  total_inscritos: number;
  unidade_nome: string;
  codigo_convite: string;
}

export default function EntrarPlano() {
  const navigate = useNavigate();
  const { codigo: codigoUrl } = useParams<{ codigo?: string }>();
  const { user, profile } = useAuth();
  
  const [codigo, setCodigo] = useState(codigoUrl || '');
  const [plano, setPlano] = useState<PlanoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [jaInscrito, setJaInscrito] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (codigoUrl) {
      buscarPlano(codigoUrl);
    }
  }, [codigoUrl]);

  const buscarPlano = async (codigoBusca: string) => {
    if (!codigoBusca.trim()) return;
    
    setLoading(true);
    setErro('');
    setPlano(null);
    
    try {
      // Buscar plano pelo código
      const { data, error } = await supabase.rpc('buscar_plano_por_codigo', {
        p_codigo: codigoBusca.toUpperCase().trim()
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const planoEncontrado = data[0] as PlanoInfo;
        setPlano(planoEncontrado);
        
        // Verificar se já está inscrito
        if (user) {
          const { data: inscricao } = await supabase
            .from('planos_leitura_inscricoes')
            .select('id')
            .eq('plano_id', planoEncontrado.id)
            .eq('user_id', user.id)
            .single();
          
          setJaInscrito(!!inscricao);
        }
      } else {
        setErro('Plano não encontrado ou não está mais disponível');
      }
      
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      setErro('Erro ao buscar plano. Verifique o código e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inscrever = async () => {
    if (!plano || !user) return;
    
    setInscrevendo(true);
    
    try {
      // Contar itens do plano
      const { count } = await supabase
        .from('planos_leitura_itens')
        .select('*', { count: 'exact', head: true })
        .eq('plano_id', plano.id);
      
      const hoje = new Date().toISOString().split('T')[0];
      
      // Criar inscrição
      const { error } = await supabase
        .from('planos_leitura_inscricoes')
        .insert({
          plano_id: plano.id,
          user_id: user.id,
          unidade_id: profile?.unidadeId,
          data_inicio_usuario: hoje,
          total_itens: count || 0,
          status: 'ativo',
        });
      
      if (error) throw error;
      
      // Atualizar contador de inscritos
      await supabase
        .from('planos_leitura')
        .update({ total_inscritos: (plano.total_inscritos || 0) + 1 })
        .eq('id', plano.id);
      
      toast.success('Inscrição realizada com sucesso!');
      navigate('/planos');
      
    } catch (error: any) {
      console.error('Erro ao inscrever:', error);
      if (error.code === '23505') {
        toast.error('Você já está inscrito neste plano');
        setJaInscrito(true);
      } else {
        toast.error('Erro ao realizar inscrição');
      }
    } finally {
      setInscrevendo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      navigate(`/planos/entrar/${codigo.toUpperCase().trim()}`);
      buscarPlano(codigo);
    }
  };

  return (
    <>
      <Header title="Entrar em um Plano" />
      
      <PageContainer>
        <div className="py-6">
          {/* Formulário de busca */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Plano
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Digite o código do plano
                </label>
                <div className="flex gap-2">
                  <Input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="font-mono text-lg uppercase tracking-widest"
                    maxLength={10}
                  />
                  <Button type="submit" disabled={loading || !codigo.trim()}>
                    {loading ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Erro */}
          {erro && (
            <Card className="p-4 mb-6 border-destructive/50 bg-destructive/5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">{erro}</p>
              </div>
            </Card>
          )}

          {/* Plano encontrado */}
          {plano && (
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{plano.titulo}</h3>
                <p className="text-muted-foreground text-sm">{plano.unidade_nome}</p>
              </div>

              {plano.descricao && (
                <p className="text-center text-muted-foreground mb-6">{plano.descricao}</p>
              )}

              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="font-semibold">{plano.duracao_dias}</p>
                  <p className="text-xs text-muted-foreground">dias</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="font-semibold">{plano.total_inscritos}</p>
                  <p className="text-xs text-muted-foreground">participantes</p>
                </div>
              </div>

              {jaInscrito ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Você já está inscrito neste plano!</span>
                  </div>
                  <Button onClick={() => navigate('/planos')} className="w-full">
                    Ver Meus Planos
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={inscrever} 
                  disabled={inscrevendo}
                  className="w-full"
                  size="lg"
                >
                  {inscrevendo ? 'Inscrevendo...' : 'Participar deste Plano'}
                </Button>
              )}
            </Card>
          )}

          {/* Instruções */}
          {!plano && !erro && !loading && (
            <Card className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium mb-2">Como funciona?</h3>
              <p className="text-sm text-muted-foreground">
                Peça o código do plano ao líder da sua igreja e digite acima para participar 
                de um plano de leitura bíblica com sua comunidade.
              </p>
            </Card>
          )}
        </div>
      </PageContainer>
      
      <BottomNav />
    </>
  );
}