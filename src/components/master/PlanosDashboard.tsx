import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, Users, TrendingUp, CheckCircle, 
  Trophy, Flame, Target, BarChart3 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanoStats {
  id: string;
  titulo: string;
  total_inscritos: number;
  total_concluidos: number;
  duracao_dias: number;
  status: string;
  inscricoes: InscricaoStats[];
}

interface InscricaoStats {
  id: string;
  user_id: string;
  usuario_nome: string;
  percentual_concluido: number;
  itens_concluidos: number;
  total_itens: number;
  ultima_leitura: string | null;
  status: string;
}

interface DashboardStats {
  total_planos_ativos: number;
  total_inscricoes: number;
  media_progresso: number;
  total_concluidos: number;
  leituras_hoje: number;
  leituras_semana: number;
}

interface PlanosDashboardProps {
  unidadeId: string;
}

export function PlanosDashboard({ unidadeId }: PlanosDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_planos_ativos: 0,
    total_inscricoes: 0,
    media_progresso: 0,
    total_concluidos: 0,
    leituras_hoje: 0,
    leituras_semana: 0,
  });
  const [planos, setPlanos] = useState<PlanoStats[]>([]);
  const [topLeitores, setTopLeitores] = useState<any[]>([]);
  
  useEffect(() => {
    if (unidadeId) {
      fetchData();
    }
  }, [unidadeId]);
  
  const fetchData = async () => {
    try {
      // Buscar planos da unidade
      const { data: planosData, error: planosError } = await supabase
        .from('planos_leitura')
        .select('*')
        .eq('unidade_id', unidadeId)
        .eq('status', 'publicado');
      
      if (planosError) throw planosError;
      
      // Buscar todas as inscrições
      const planoIds = planosData?.map(p => p.id) || [];
      
      if (planoIds.length > 0) {
        const { data: inscricoes, error: inscricoesError } = await supabase
          .from('planos_leitura_inscricoes')
          .select('*')
          .in('plano_id', planoIds);
        
        if (inscricoesError) throw inscricoesError;
        
        // Buscar nomes dos usuários
        const userIds = inscricoes?.map(i => i.user_id).filter(Boolean) || [];
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('user_id, nome')
          .in('user_id', userIds);
        
        const usuariosMap = new Map(usuarios?.map(u => [u.user_id, u.nome]));
        
        // Calcular estatísticas
        const totalInscricoes = inscricoes?.length || 0;
        const totalConcluidos = inscricoes?.filter(i => i.status === 'concluido').length || 0;
        const mediaProgresso = totalInscricoes > 0 
          ? Math.round((inscricoes?.reduce((acc, i) => acc + (i.percentual_concluido || 0), 0) || 0) / totalInscricoes)
          : 0;
        
        // Buscar leituras de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const { count: leiturasHoje } = await supabase
          .from('planos_leitura_progresso')
          .select('*', { count: 'exact', head: true })
          .gte('marcado_em', `${hoje}T00:00:00`);
        
        // Buscar leituras da semana
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        const { count: leiturasSemana } = await supabase
          .from('planos_leitura_progresso')
          .select('*', { count: 'exact', head: true })
          .gte('marcado_em', seteDiasAtras.toISOString());
        
        setStats({
          total_planos_ativos: planosData?.length || 0,
          total_inscricoes: totalInscricoes,
          media_progresso: mediaProgresso,
          total_concluidos: totalConcluidos,
          leituras_hoje: leiturasHoje || 0,
          leituras_semana: leiturasSemana || 0,
        });
        
        // Montar dados dos planos
        const planosComStats: PlanoStats[] = (planosData || []).map(plano => {
          const inscricoesPlano = inscricoes?.filter(i => i.plano_id === plano.id) || [];
          
          return {
            id: plano.id,
            titulo: plano.titulo,
            total_inscritos: plano.total_inscritos || inscricoesPlano.length,
            total_concluidos: inscricoesPlano.filter(i => i.status === 'concluido').length,
            duracao_dias: plano.duracao_dias,
            status: plano.status,
            inscricoes: inscricoesPlano.map(i => ({
              id: i.id,
              user_id: i.user_id,
              usuario_nome: usuariosMap.get(i.user_id) || 'Usuário',
              percentual_concluido: i.percentual_concluido || 0,
              itens_concluidos: i.itens_concluidos || 0,
              total_itens: i.total_itens || 0,
              ultima_leitura: null, // TODO: buscar última leitura
              status: i.status || 'ativo',
            })),
          };
        });
        
        setPlanos(planosComStats);
        
        // Top leitores
        const leitoresPorProgresso = inscricoes
          ?.sort((a, b) => (b.percentual_concluido || 0) - (a.percentual_concluido || 0))
          .slice(0, 5)
          .map(i => ({
            nome: usuariosMap.get(i.user_id) || 'Usuário',
            progresso: i.percentual_concluido || 0,
            leituras: i.itens_concluidos || 0,
          })) || [];
        
        setTopLeitores(leitoresPorProgresso);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard de planos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Planos Ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_planos_ativos}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Inscrições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.total_inscricoes}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progresso Médio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{stats.media_progresso}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Concluídos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_concluidos}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Leituras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Atividade de Leitura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Leituras hoje</span>
                  <span className="font-medium">{stats.leituras_hoje}</span>
                </div>
                <Progress value={Math.min(stats.leituras_hoje * 10, 100)} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Leituras esta semana</span>
                  <span className="font-medium">{stats.leituras_semana}</span>
                </div>
                <Progress value={Math.min(stats.leituras_semana * 2, 100)} className="bg-primary/20" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Leitores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLeitores.map((leitor, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{leitor.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {leitor.leituras} leituras
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {Math.round(leitor.progresso)}%
                  </Badge>
                </div>
              ))}
              {topLeitores.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma leitura registrada ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de Planos com Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progresso por Plano
          </CardTitle>
          <CardDescription>
            Acompanhe o engajamento de cada plano de leitura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {planos.map(plano => {
                const taxaConclusao = plano.total_inscritos > 0 
                  ? Math.round((plano.total_concluidos / plano.total_inscritos) * 100)
                  : 0;
                
                return (
                  <div key={plano.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{plano.titulo}</h4>
                        <p className="text-sm text-muted-foreground">
                          {plano.duracao_dias} dias • {plano.total_inscritos} inscritos
                        </p>
                      </div>
                      <Badge variant={plano.total_concluidos > 0 ? 'default' : 'secondary'}>
                        {plano.total_concluidos} concluídos
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Taxa de conclusão</span>
                        <span className="font-medium">{taxaConclusao}%</span>
                      </div>
                      <Progress value={taxaConclusao} />
                    </div>
                    
                    {/* Membros do plano */}
                    {plano.inscricoes.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          Participantes ({plano.inscricoes.length})
                        </p>
                        <div className="space-y-2">
                          {plano.inscricoes.slice(0, 5).map(inscricao => (
                            <div key={inscricao.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {inscricao.usuario_nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm flex-1 truncate">
                                {inscricao.usuario_nome}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {inscricao.itens_concluidos}/{inscricao.total_itens}
                              </span>
                              <Progress 
                                value={inscricao.percentual_concluido} 
                                className="w-16 h-1.5"
                              />
                            </div>
                          ))}
                          {plano.inscricoes.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{plano.inscricoes.length - 5} outros
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {planos.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum plano publicado ainda
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
