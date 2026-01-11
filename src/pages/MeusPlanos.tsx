import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/layout/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Calendar, CheckCircle, Clock, Play, Target, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Plano {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  duracao_dias: number;
  total_inscritos: number;
  data_inicio: string;
}

interface Inscricao {
  id: string;
  plano_id: string;
  data_inicio_usuario: string;
  total_itens: number;
  itens_concluidos: number;
  percentual_concluido: number;
  status: string;
  plano: Plano;
}

interface ItemLeitura {
  id: string;
  dia_numero: number;
  data_prevista: string;
  referencia_texto: string;
  titulo_dia: string | null;
  concluido: boolean;
  progresso_id: string | null;
}

export default function MeusPlanos() {
  const navigate = useNavigate();
  const { user, unidadeId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<Plano[]>([]);
  const [minhasInscricoes, setMinhasInscricoes] = useState<Inscricao[]>([]);
  const [inscricaoSelecionada, setInscricaoSelecionada] = useState<Inscricao | null>(null);
  const [itensLeitura, setItensLeitura] = useState<ItemLeitura[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  
  useEffect(() => {
    if (unidadeId && user) {
      fetchData();
    }
  }, [unidadeId, user]);
  
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Buscar planos disponíveis da unidade
      const { data: planos, error: planosError } = await supabase
        .from('planos_leitura')
        .select('*')
        .eq('unidade_id', unidadeId)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false });
      
      if (planosError) throw planosError;
      setPlanosDisponiveis(planos || []);
      
      // Buscar minhas inscrições
      const { data: inscricoes, error: inscricoesError } = await supabase
        .from('planos_leitura_inscricoes')
        .select(`
          *,
          plano:planos_leitura(*)
        `)
        .eq('user_id', user?.id);
      
      if (inscricoesError) throw inscricoesError;
      setMinhasInscricoes(inscricoes || []);
      
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };
  
  const inscreverNoPlano = async (plano: Plano) => {
    if (!user) return;
    
    try {
      // Buscar total de itens do plano
      const { count } = await supabase
        .from('planos_leitura_itens')
        .select('id', { count: 'exact', head: true })
        .eq('plano_id', plano.id);
      
      const { data, error } = await supabase
        .from('planos_leitura_inscricoes')
        .insert({
          plano_id: plano.id,
          user_id: user.id,
          unidade_id: unidadeId,
          data_inicio_usuario: new Date().toISOString().split('T')[0],
          total_itens: count || 0,
        })
        .select(`*, plano:planos_leitura(*)`)
        .single();
      
      if (error) throw error;
      
      setMinhasInscricoes(prev => [...prev, data]);
      toast.success('Inscrição realizada com sucesso!');
      
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Você já está inscrito neste plano');
      } else {
        console.error('Erro ao inscrever:', error);
        toast.error('Erro ao se inscrever no plano');
      }
    }
  };
  
  const abrirPlano = async (inscricao: Inscricao) => {
    setInscricaoSelecionada(inscricao);
    setLoadingItens(true);
    
    try {
      // Buscar itens do plano com progresso
      const { data: itens, error } = await supabase
        .from('planos_leitura_itens')
        .select('*')
        .eq('plano_id', inscricao.plano_id)
        .order('dia_numero');
      
      if (error) throw error;
      
      // Buscar progresso do usuário
      const { data: progresso } = await supabase
        .from('planos_leitura_progresso')
        .select('item_id, id, concluido')
        .eq('inscricao_id', inscricao.id);
      
      const progressoMap = new Map(progresso?.map(p => [p.item_id, p]));
      
      const itensComProgresso: ItemLeitura[] = (itens || []).map(item => ({
        id: item.id,
        dia_numero: item.dia_numero,
        data_prevista: item.data_prevista,
        referencia_texto: item.referencia_texto,
        titulo_dia: item.titulo_dia,
        concluido: progressoMap.get(item.id)?.concluido || false,
        progresso_id: progressoMap.get(item.id)?.id || null,
      }));
      
      setItensLeitura(itensComProgresso);
      
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar leituras');
    } finally {
      setLoadingItens(false);
    }
  };
  
  const marcarLeitura = async (item: ItemLeitura) => {
    if (!inscricaoSelecionada || !user) return;
    
    try {
      if (item.concluido && item.progresso_id) {
        // Desmarcar
        await supabase
          .from('planos_leitura_progresso')
          .delete()
          .eq('id', item.progresso_id);
        
        setItensLeitura(prev => prev.map(i => 
          i.id === item.id ? { ...i, concluido: false, progresso_id: null } : i
        ));
        
        // Atualizar contagem na inscrição
        setInscricaoSelecionada(prev => prev ? {
          ...prev,
          itens_concluidos: prev.itens_concluidos - 1,
          percentual_concluido: ((prev.itens_concluidos - 1) / prev.total_itens) * 100,
        } : null);
        
      } else {
        // Marcar como lido
        const { data, error } = await supabase
          .from('planos_leitura_progresso')
          .insert({
            inscricao_id: inscricaoSelecionada.id,
            item_id: item.id,
            user_id: user.id,
            concluido: true,
            fonte: 'app',
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setItensLeitura(prev => prev.map(i => 
          i.id === item.id ? { ...i, concluido: true, progresso_id: data.id } : i
        ));
        
        // Atualizar contagem na inscrição
        setInscricaoSelecionada(prev => prev ? {
          ...prev,
          itens_concluidos: prev.itens_concluidos + 1,
          percentual_concluido: ((prev.itens_concluidos + 1) / prev.total_itens) * 100,
        } : null);
        
        toast.success('Leitura marcada como concluída!');
      }
      
    } catch (error) {
      console.error('Erro ao marcar leitura:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };
  
  const jaInscrito = (planoId: string) => {
    return minhasInscricoes.some(i => i.plano_id === planoId);
  };
  
  if (inscricaoSelecionada) {
    const leituraHoje = itensLeitura.find(i => i.data_prevista && isToday(parseISO(i.data_prevista)));
    const proximasLeituras = itensLeitura.filter(i => !i.concluido).slice(0, 7);
    
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setInscricaoSelecionada(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold">{inscricaoSelecionada.plano.titulo}</h1>
              <p className="text-sm text-muted-foreground">
                {inscricaoSelecionada.itens_concluidos} de {inscricaoSelecionada.total_itens} leituras
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress value={inscricaoSelecionada.percentual_concluido} className="h-2" />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {Math.round(inscricaoSelecionada.percentual_concluido)}% concluído
            </p>
          </div>
        </header>
        
        <div className="p-4 space-y-4">
          {/* Leitura de hoje */}
          {leituraHoje && (
            <Card className="p-4 border-primary bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Leitura de Hoje</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{leituraHoje.referencia_texto}</p>
                  {leituraHoje.titulo_dia && (
                    <p className="text-sm text-muted-foreground">{leituraHoje.titulo_dia}</p>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant={leituraHoje.concluido ? 'outline' : 'default'}
                  onClick={() => marcarLeitura(leituraHoje)}
                >
                  {leituraHoje.concluido ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluído
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Marcar como lido
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
          
          {/* Lista de leituras */}
          {loadingItens ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </Card>
              ))}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-lg">Próximas Leituras</h2>
              
              {proximasLeituras.map(item => (
                <Card
                  key={item.id}
                  className={`p-4 ${item.concluido ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.concluido ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.concluido ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{item.dia_numero}</span>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">{item.referencia_texto}</p>
                        {item.data_prevista && (
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(item.data_prevista), "d 'de' MMMM", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => marcarLeitura(item)}
                    >
                      {item.concluido ? 'Desmarcar' : 'Marcar'}
                    </Button>
                  </div>
                </Card>
              ))}
              
              {proximasLeituras.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold text-lg">Parabéns!</h3>
                  <p className="text-muted-foreground">Você concluiu todas as leituras!</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Planos de Leitura</h1>
            <p className="text-sm text-muted-foreground">Acompanhe sua jornada bíblica</p>
          </div>
        </div>
      </header>
      
      <div className="p-4">
        <Tabs defaultValue="meus" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meus">Meus Planos</TabsTrigger>
            <TabsTrigger value="disponiveis">Disponíveis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meus" className="mt-4 space-y-4">
            {loading ? (
              <>
                {[1, 2].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-3 w-full mb-3" />
                    <Skeleton className="h-8 w-24" />
                  </Card>
                ))}
              </>
            ) : minhasInscricoes.length > 0 ? (
              minhasInscricoes.map(inscricao => (
                <Card
                  key={inscricao.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => abrirPlano(inscricao)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{inscricao.plano.titulo}</h3>
                      <p className="text-sm text-muted-foreground">
                        {inscricao.itens_concluidos} de {inscricao.total_itens} leituras
                      </p>
                    </div>
                    <Badge variant={inscricao.status === 'concluido' ? 'default' : 'secondary'}>
                      {inscricao.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                    </Badge>
                  </div>
                  
                  <Progress value={inscricao.percentual_concluido} className="h-2 mb-2" />
                  <p className="text-xs text-right text-muted-foreground">
                    {Math.round(inscricao.percentual_concluido)}%
                  </p>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="font-medium text-muted-foreground">Você ainda não está em nenhum plano</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha um plano na aba "Disponíveis"
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="disponiveis" className="mt-4 space-y-4">
            {loading ? (
              <>
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <Skeleton className="h-8 w-24" />
                  </Card>
                ))}
              </>
            ) : planosDisponiveis.length > 0 ? (
              planosDisponiveis.map(plano => (
                <Card key={plano.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{plano.titulo}</h3>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {plano.duracao_dias} dias
                    </Badge>
                  </div>
                  
                  {plano.descricao && (
                    <p className="text-sm text-muted-foreground mb-3">{plano.descricao}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      <Target className="h-3 w-3 inline mr-1" />
                      {plano.total_inscritos} inscritos
                    </span>
                    
                    {jaInscrito(plano.id) ? (
                      <Badge variant="secondary">Já inscrito</Badge>
                    ) : (
                      <Button size="sm" onClick={() => inscreverNoPlano(plano)}>
                        Participar
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="font-medium text-muted-foreground">Nenhum plano disponível</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aguarde a criação de planos pela liderança
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  );
}