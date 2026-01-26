import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/layout/BottomNav';
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
  ChevronRight,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Components
import { PlanSlotCard } from '@/components/planos/PlanSlotCard';
import { TodayReadings } from '@/components/planos/TodayReadings';
import { ProgressCalendar } from '@/components/planos/ProgressCalendar';
import { AddPlanModal } from '@/components/planos/AddPlanModal';

// Hooks
import { useReadingPlans, ActivePlan, PRESET_PLANS, MAX_SLOTS } from '@/hooks/useReadingPlans';

export default function MeusPlanos() {
  const navigate = useNavigate();
  const { user, unidadeId } = useAuth();
  
  const {
    loading,
    activePlans,
    todayReadings,
    monthProgress,
    allPlanosDisponiveis,
    stats,
    canAddPlan,
    emptySlots,
    markReadingComplete,
    fetchData,
    fetchMonthProgress,
  } = useReadingPlans();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<ActivePlan | null>(null);
  const [loadingPlanItems, setLoadingPlanItems] = useState(false);
  const [planItems, setPlanItems] = useState<any[]>([]);

  // Handler para adicionar plano preset
  const handleAddPresetPlan = useCallback(async (presetId: string, duration?: number) => {
    if (!user?.id || !unidadeId) {
      toast.error('Você precisa estar logado');
      return;
    }
    
    const preset = Object.values(PRESET_PLANS).find(p => p.id === presetId);
    if (!preset) return;
    
    try {
      // Criar o plano no banco (simulação - normalmente seria criado pelo master)
      toast.info(`Plano "${preset.title}" será implementado em breve!`);
      setShowAddModal(false);
    } catch (error) {
      console.error('Erro ao adicionar plano:', error);
      toast.error('Erro ao adicionar plano');
    }
  }, [user?.id, unidadeId]);

  // Handler para adicionar plano disponível
  const handleAddAvailablePlan = useCallback(async (plano: any) => {
    if (!user?.id || !unidadeId) return;
    
    try {
      const { count } = await supabase
        .from('planos_leitura_itens')
        .select('id', { count: 'exact', head: true })
        .eq('plano_id', plano.id);
      
      const { error } = await supabase
        .from('planos_leitura_inscricoes')
        .insert({
          plano_id: plano.id,
          user_id: user.id,
          unidade_id: unidadeId,
          data_inicio_usuario: new Date().toISOString().split('T')[0],
          total_itens: count || 0,
        });
      
      if (error) throw error;
      
      toast.success('Inscrito com sucesso!');
      setShowAddModal(false);
      fetchData();
      
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Você já está inscrito neste plano');
      } else {
        toast.error('Erro ao se inscrever');
      }
    }
  }, [user?.id, unidadeId, fetchData]);

  // Abrir detalhes de um plano
  const handleOpenPlan = useCallback(async (plan: ActivePlan) => {
    setSelectedPlanDetail(plan);
    setLoadingPlanItems(true);
    
    try {
      const { data: itens } = await supabase
        .from('planos_leitura_itens')
        .select('*')
        .eq('plano_id', plan.planoId)
        .order('dia_numero');
      
      const { data: progresso } = await supabase
        .from('planos_leitura_progresso')
        .select('item_id, id, concluido')
        .eq('inscricao_id', plan.inscricaoId);
      
      const progressoMap = new Map(progresso?.map(p => [p.item_id, p]));
      
      const itensComProgresso = (itens || []).map(item => ({
        ...item,
        concluido: progressoMap.get(item.id)?.concluido || false,
        progresso_id: progressoMap.get(item.id)?.id || null,
      }));
      
      setPlanItems(itensComProgresso);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar leituras');
    } finally {
      setLoadingPlanItems(false);
    }
  }, []);

  // Marcar leitura no detalhe do plano
  const handleMarkPlanItem = useCallback(async (item: any) => {
    if (!selectedPlanDetail || !user?.id) return;
    
    try {
      if (item.concluido && item.progresso_id) {
        await supabase
          .from('planos_leitura_progresso')
          .delete()
          .eq('id', item.progresso_id);
        
        setPlanItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, concluido: false, progresso_id: null } : i
        ));
      } else {
        const { data } = await supabase
          .from('planos_leitura_progresso')
          .insert({
            inscricao_id: selectedPlanDetail.inscricaoId,
            item_id: item.id,
            user_id: user.id,
            concluido: true,
            fonte: 'app',
          })
          .select()
          .single();
        
        if (data) {
          setPlanItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, concluido: true, progresso_id: data.id } : i
          ));
          toast.success('Leitura concluída! 🎉');
        }
      }
    } catch (error) {
      console.error('Erro ao marcar leitura:', error);
      toast.error('Erro ao atualizar progresso');
    }
  }, [selectedPlanDetail, user?.id]);

  // ============ Visualização de detalhe do plano ============
  if (selectedPlanDetail) {
    const completedItems = planItems.filter(i => i.concluido);
    const pendingItems = planItems.filter(i => !i.concluido);
    const percentComplete = planItems.length > 0 
      ? (completedItems.length / planItems.length) * 100 
      : 0;
    
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header com gradiente */}
        <div className={`bg-gradient-to-br ${selectedPlanDetail.color || 'from-primary to-secondary'} text-white`}>
          <header className="sticky top-0 z-10 p-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setSelectedPlanDetail(null);
                  fetchData();
                }}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-bold text-lg">{selectedPlanDetail.title}</h1>
                <p className="text-sm text-white/80">
                  {selectedPlanDetail.daysRemaining} dias restantes
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
                  strokeDashoffset={352 - (352 * percentComplete) / 100}
                  className="text-white transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{Math.round(percentComplete)}%</span>
                <span className="text-xs text-white/80">concluído</span>
              </div>
            </div>
            
            {/* Stats row */}
            <div className="flex items-center gap-8 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-bold">{completedItems.length}</span>
                </div>
                <span className="text-xs text-white/70">Feitos</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="font-bold">{planItems.length}</span>
                </div>
                <span className="text-xs text-white/70">Total</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold">{selectedPlanDetail.chaptersPerDay}</span>
                </div>
                <span className="text-xs text-white/70">Cap/dia</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4 -mt-4">
          {loadingPlanItems ? (
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
              {pendingItems.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Próximas Leituras
                  </h2>
                  
                  <div className="space-y-2">
                    {pendingItems.slice(0, 10).map((item, index) => (
                      <Card
                        key={item.id}
                        className="p-4 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleMarkPlanItem(item)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
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
              {completedItems.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                    Concluídas ({completedItems.length})
                  </h2>
                  
                  <div className="space-y-2">
                    {completedItems.slice(-5).reverse().map(item => (
                      <Card
                        key={item.id}
                        className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 cursor-pointer"
                        onClick={() => handleMarkPlanItem(item)}
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
              
              {pendingItems.length === 0 && completedItems.length === planItems.length && planItems.length > 0 && (
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

  // ============ Tela Principal - Dashboard com Slots ============
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
              <LayoutGrid className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{activePlans.length}/{MAX_SLOTS}</p>
              <p className="text-[10px] text-white/70">Slots</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.totalCompleted}</p>
              <p className="text-[10px] text-white/70">Leituras</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.todayCompleted}/{stats.todayTotal}</p>
              <p className="text-[10px] text-white/70">Hoje</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Sparkles className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{Math.round(stats.overallProgress)}%</p>
              <p className="text-[10px] text-white/70">Progresso</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="p-4 space-y-6 -mt-2">
        {/* Seção: Para Hoje (Consolidado) */}
        <section>
          <TodayReadings
            readings={todayReadings}
            onMarkComplete={markReadingComplete}
            stats={{
              todayCompleted: stats.todayCompleted,
              todayTotal: stats.todayTotal,
              todayProgress: stats.todayProgress,
            }}
          />
        </section>
        
        {/* Seção: Meus Planos (Slots) */}
        <section>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Meus Planos ({activePlans.length}/{MAX_SLOTS})
          </h2>
          
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Planos ativos */}
              {activePlans.map((plan) => (
                <PlanSlotCard
                  key={plan.id}
                  plan={plan}
                  slotIndex={plan.slotIndex}
                  onOpenPlan={handleOpenPlan}
                />
              ))}
              
              {/* Slots vazios */}
              {emptySlots.map((slotIndex) => (
                <PlanSlotCard
                  key={`empty-${slotIndex}`}
                  slotIndex={slotIndex}
                  isEmpty
                  onAddPlan={() => setShowAddModal(true)}
                />
              ))}
            </div>
          )}
        </section>
        
        {/* Seção: Calendário de Progresso */}
        <section>
          <ProgressCalendar
            progressMap={monthProgress}
            onMonthChange={fetchMonthProgress}
          />
        </section>
      </div>
      
      {/* Modal para adicionar plano */}
      <AddPlanModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectPreset={handleAddPresetPlan}
        availablePlans={allPlanosDisponiveis}
        onSelectAvailable={handleAddAvailablePlan}
      />
      
      <BottomNav />
    </div>
  );
}
