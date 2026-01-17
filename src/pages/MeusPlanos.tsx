import { useState, useEffect, useMemo } from 'react';
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
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Flame,
  Play, 
  Target, 
  Trophy,
  Users,
  ChevronRight,
  Star,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, parseISO, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Plano {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  duracao_dias: number;
  total_inscritos: number;
  data_inicio: string;
  imagem_url: string | null;
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
  
  // Stats calculados
  const stats = useMemo(() => {
    const totalLeituras = minhasInscricoes.reduce((acc, i) => acc + (i.itens_concluidos || 0), 0);
    const planosAtivos = minhasInscricoes.filter(i => i.status !== 'concluido').length;
    const planosConcluidos = minhasInscricoes.filter(i => i.status === 'concluido').length;
    
    // Calcular streak (simplificado)
    const streakDias = Math.min(totalLeituras, 7); // Placeholder
    
    return { totalLeituras, planosAtivos, planosConcluidos, streakDias };
  }, [minhasInscricoes]);
  
  useEffect(() => {
    if (unidadeId && user) {
      fetchData();
    }
  }, [unidadeId, user]);
  
  const fetchData = async () => {
    setLoading(true);
    
    try {
      const { data: planos, error: planosError } = await supabase
        .from('planos_leitura')
        .select('*')
        .eq('unidade_id', unidadeId)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false });
      
      if (planosError) throw planosError;
      setPlanosDisponiveis(planos || []);
      
      const { data: inscricoes, error: inscricoesError } = await supabase
        .from('planos_leitura_inscricoes')
        .select(`*, plano:planos_leitura(*)`)
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
      const { data: itens, error } = await supabase
        .from('planos_leitura_itens')
        .select('*')
        .eq('plano_id', inscricao.plano_id)
        .order('dia_numero');
      
      if (error) throw error;
      
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
        await supabase
          .from('planos_leitura_progresso')
          .delete()
          .eq('id', item.progresso_id);
        
        setItensLeitura(prev => prev.map(i => 
          i.id === item.id ? { ...i, concluido: false, progresso_id: null } : i
        ));
        
        setInscricaoSelecionada(prev => prev ? {
          ...prev,
          itens_concluidos: prev.itens_concluidos - 1,
          percentual_concluido: ((prev.itens_concluidos - 1) / prev.total_itens) * 100,
        } : null);
        
      } else {
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
        
        setInscricaoSelecionada(prev => prev ? {
          ...prev,
          itens_concluidos: prev.itens_concluidos + 1,
          percentual_concluido: ((prev.itens_concluidos + 1) / prev.total_itens) * 100,
        } : null);
        
        toast.success('Leitura concluída! 🎉');
      }
      
    } catch (error) {
      console.error('Erro ao marcar leitura:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };
  
  const jaInscrito = (planoId: string) => {
    return minhasInscricoes.some(i => i.plano_id === planoId);
  };

  // ==================== VISUALIZAÇÃO DO PLANO SELECIONADO ====================
  if (inscricaoSelecionada) {
    const leituraHoje = itensLeitura.find(i => i.data_prevista && isToday(parseISO(i.data_prevista)));
    const leituraNaoFeitas = itensLeitura.filter(i => !i.concluido);
    const leiturasConcluidas = itensLeitura.filter(i => i.concluido);
    const diasRestantes = inscricaoSelecionada.total_itens - inscricaoSelecionada.itens_concluidos;
    
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-primary via-primary to-secondary text-white">
          <header className="sticky top-0 z-10 p-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setInscricaoSelecionada(null)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-bold text-lg">{inscricaoSelecionada.plano.titulo}</h1>
                <p className="text-sm text-white/80">
                  {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes
                </p>
              </div>
            </div>
          </header>
          
          {/* Progress Circle */}
          <div className="flex flex-col items-center pb-8 pt-2">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={352}
                  strokeDashoffset={352 - (352 * (inscricaoSelecionada.percentual_concluido || 0)) / 100}
                  className="text-white transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{Math.round(inscricaoSelecionada.percentual_concluido || 0)}%</span>
                <span className="text-xs text-white/80">concluído</span>
              </div>
            </div>
            
            {/* Stats row */}
            <div className="flex items-center gap-8 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-bold">{inscricaoSelecionada.itens_concluidos}</span>
                </div>
                <span className="text-xs text-white/70">Feitos</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="font-bold">{inscricaoSelecionada.total_itens}</span>
                </div>
                <span className="text-xs text-white/70">Total</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold">{stats.streakDias}</span>
                </div>
                <span className="text-xs text-white/70">Streak</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4 -mt-4">
          {/* Leitura de hoje - Card destacado */}
          {leituraHoje && !leituraHoje.concluido && (
            <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-full bg-amber-500 text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="font-semibold text-amber-700 dark:text-amber-400">Leitura de Hoje</span>
              </div>
              
              <h3 className="font-bold text-xl mb-1">{leituraHoje.referencia_texto}</h3>
              {leituraHoje.titulo_dia && (
                <p className="text-muted-foreground mb-4">{leituraHoje.titulo_dia}</p>
              )}
              
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => marcarLeitura(leituraHoje)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Concluído
              </Button>
            </Card>
          )}
          
          {loadingItens ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Próximas Leituras */}
              {leituraNaoFeitas.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Próximas Leituras
                  </h2>
                  
                  <div className="space-y-2">
                    {leituraNaoFeitas.slice(0, 7).map((item, index) => (
                      <Card
                        key={item.id}
                        className="p-4 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => marcarLeitura(item)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 && !leituraHoje
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {item.dia_numero}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{item.referencia_texto}</p>
                            {item.data_prevista && (
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(item.data_prevista), "EEEE, d 'de' MMMM", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Leituras Concluídas */}
              {leiturasConcluidas.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                    Concluídas ({leiturasConcluidas.length})
                  </h2>
                  
                  <div className="space-y-2">
                    {leiturasConcluidas.map(item => (
                      <Card
                        key={item.id}
                        className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                        onClick={() => marcarLeitura(item)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{item.referencia_texto}</p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Dia {item.dia_numero} - Concluído
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {leituraNaoFeitas.length === 0 && leiturasConcluidas.length === inscricaoSelecionada.total_itens && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl mb-2">Parabéns! 🎉</h3>
                  <p className="text-muted-foreground">
                    Você concluiu todas as leituras deste plano!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        <BottomNav />
      </div>
    );
  }

  // ==================== TELA PRINCIPAL - MEUS PLANOS (ESTILO BIBLE JOURNEY) ====================
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary text-white">
        <header className="p-4 pt-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Minha Jornada</h1>
              <p className="text-sm text-white/80">Planos de leitura bíblica</p>
            </div>
          </div>
        </header>
        
        {/* Stats Cards */}
        <div className="px-4 pb-6 pt-2">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Flame className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.streakDias}</p>
              <p className="text-[10px] text-white/70">Streak</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.totalLeituras}</p>
              <p className="text-[10px] text-white/70">Leituras</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.planosAtivos}</p>
              <p className="text-[10px] text-white/70">Ativos</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.planosConcluidos}</p>
              <p className="text-[10px] text-white/70">Concluídos</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="p-4 -mt-2">
        <Tabs defaultValue="meus" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="meus" className="gap-2">
              <Star className="h-4 w-4" />
              Meus Planos
            </TabsTrigger>
            <TabsTrigger value="disponiveis" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Explorar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="meus" className="space-y-4 mt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-3 w-full mb-3" />
                    <Skeleton className="h-8 w-24" />
                  </Card>
                ))}
              </div>
            ) : minhasInscricoes.length > 0 ? (
              minhasInscricoes.map(inscricao => (
                <Card
                  key={inscricao.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => abrirPlano(inscricao)}
                >
                  {/* Imagem ou gradiente do plano */}
                  <div className="h-24 bg-gradient-to-r from-primary/80 to-secondary/80 relative">
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div className="text-white">
                        <h3 className="font-bold text-lg">{inscricao.plano.titulo}</h3>
                        <p className="text-sm text-white/80">
                          {inscricao.itens_concluidos}/{inscricao.total_itens} leituras
                        </p>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {Math.round(inscricao.percentual_concluido)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <Progress value={inscricao.percentual_concluido} className="h-2 mb-3" />
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={inscricao.status === 'concluido' ? 'default' : 'secondary'}>
                        {inscricao.status === 'concluido' ? (
                          <>
                            <Trophy className="h-3 w-3 mr-1" />
                            Concluído
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Em andamento
                          </>
                        )}
                      </Badge>
                      
                      <Button variant="ghost" size="sm" className="text-primary group-hover:translate-x-1 transition-transform">
                        Continuar
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Comece sua Jornada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Escolha um plano na aba "Explorar" e comece a ler a Bíblia de forma organizada
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="disponiveis" className="space-y-4 mt-0">
            {/* Entrar com código */}
            <Card 
              className="p-4 bg-gradient-to-r from-muted/50 to-muted border-dashed cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate('/planos/entrar')}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Entrar com código</h4>
                  <p className="text-sm text-muted-foreground">
                    Recebeu um convite? Entre com o código do plano
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <Skeleton className="h-8 w-24" />
                  </Card>
                ))}
              </div>
            ) : planosDisponiveis.length > 0 ? (
              planosDisponiveis.map(plano => {
                const inscrito = jaInscrito(plano.id);
                
                return (
                  <Card key={plano.id} className="overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-secondary/70 to-primary/70 flex items-center px-4">
                      <div className="p-3 rounded-xl bg-white/20 backdrop-blur mr-4">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-white">
                        <h3 className="font-bold">{plano.titulo}</h3>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Clock className="h-3 w-3" />
                          <span>{plano.duracao_dias} dias</span>
                          <span>•</span>
                          <Users className="h-3 w-3" />
                          <span>{plano.total_inscritos || 0} participantes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {plano.descricao && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {plano.descricao}
                        </p>
                      )}
                      
                      {inscrito ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Já inscrito
                        </Badge>
                      ) : (
                        <Button className="w-full" onClick={() => inscreverNoPlano(plano)}>
                          <Play className="h-4 w-4 mr-2" />
                          Começar Agora
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhum plano disponível</h3>
                <p className="text-muted-foreground text-sm">
                  Em breve novos planos serão publicados
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
