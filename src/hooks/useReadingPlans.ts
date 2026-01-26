import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, startOfDay, parseISO, isToday, isBefore, isAfter } from 'date-fns';

// Constantes
export const MAX_SLOTS = 3;

// Planos prefixados do sistema
export const PRESET_PLANS = {
  ANNUAL_2026: {
    id: 'annual-2026',
    title: 'Bíblia em 1 Ano (2026)',
    description: 'Leia toda a Bíblia em 2026, do Gênesis ao Apocalipse',
    totalChapters: 1189,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    durationDays: 365,
    type: 'annual',
    icon: 'calendar',
    color: 'from-blue-500 to-indigo-600',
  },
  GOSPELS: {
    id: 'gospels',
    title: 'Evangelhos',
    description: 'Mateus, Marcos, Lucas e João - A vida de Jesus',
    totalChapters: 89, // Mt(28) + Mc(16) + Lc(24) + Jo(21)
    books: ['Mateus', 'Marcos', 'Lucas', 'João'],
    type: 'module',
    icon: 'book-heart',
    color: 'from-rose-500 to-pink-600',
    durations: [15, 30, 60],
  },
  PAULINE_LETTERS: {
    id: 'pauline-letters',
    title: 'Cartas Paulinas',
    description: 'Romanos a Filemom - Os ensinamentos de Paulo',
    totalChapters: 87, // Rm(16)+1Co(16)+2Co(13)+Gl(6)+Ef(6)+Fp(4)+Cl(4)+1Ts(5)+2Ts(3)+1Tm(6)+2Tm(4)+Tt(3)+Fm(1)
    books: ['Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom'],
    type: 'module',
    icon: 'scroll-text',
    color: 'from-amber-500 to-orange-600',
    durations: [15, 30, 60],
  },
  HISTORICAL_BOOKS: {
    id: 'historical-books',
    title: 'Livros Históricos',
    description: 'Josué a Ester - A história do povo de Deus',
    totalChapters: 249, // Js(24)+Jz(21)+Rt(4)+1Sm(31)+2Sm(24)+1Rs(22)+2Rs(25)+1Cr(29)+2Cr(36)+Ed(10)+Ne(13)+Et(10)
    books: ['Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester'],
    type: 'module',
    icon: 'landmark',
    color: 'from-emerald-500 to-teal-600',
    durations: [30, 60, 90],
  },
};

export interface ActivePlan {
  id: string;
  slotIndex: number;
  inscricaoId: string;
  planoId: string;
  title: string;
  description: string;
  type: string;
  color: string;
  icon: string;
  startDate: string;
  endDate: string | null;
  totalItems: number;
  completedItems: number;
  percentComplete: number;
  chaptersPerDay: number;
  daysRemaining: number;
  estimatedEndDate: string;
  status: 'active' | 'completed' | 'paused';
}

export interface TodayReading {
  id: string;
  planId: string;
  planTitle: string;
  planColor: string;
  itemId: string;
  dayNumber: number;
  reference: string;
  bookId: string;
  chapterStart: number;
  chapterEnd: number | null;
  isCompleted: boolean;
  progressId: string | null;
}

export interface DayProgress {
  date: string;
  totalReadings: number;
  completedReadings: number;
  isComplete: boolean;
}

export function useReadingPlans() {
  const { user, unidadeId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [todayReadings, setTodayReadings] = useState<TodayReading[]>([]);
  const [monthProgress, setMonthProgress] = useState<Map<string, DayProgress>>(new Map());
  const [allPlanosDisponiveis, setAllPlanosDisponiveis] = useState<any[]>([]);

  // Buscar dados iniciais
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // 1. Buscar inscrições ativas do usuário (máximo 3)
      const { data: inscricoes, error: inscricoesError } = await supabase
        .from('planos_leitura_inscricoes')
        .select(`
          *,
          plano:planos_leitura(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['ativo', 'em_andamento'])
        .order('inscrito_em', { ascending: true })
        .limit(MAX_SLOTS);
      
      if (inscricoesError) throw inscricoesError;
      
      // 2. Processar planos ativos
      const plans: ActivePlan[] = (inscricoes || []).map((inscricao, index) => {
        const plano = inscricao.plano;
        const startDate = inscricao.data_inicio_usuario;
        const today = startOfDay(new Date());
        const start = startOfDay(parseISO(startDate));
        const daysPassed = Math.max(0, differenceInDays(today, start));
        const totalItems = inscricao.total_itens || plano.duracao_dias;
        const completedItems = inscricao.itens_concluidos || 0;
        const remainingItems = totalItems - completedItems;
        const chaptersPerDay = remainingItems > 0 ? Math.ceil(remainingItems / Math.max(1, plano.duracao_dias - daysPassed)) : 0;
        const estimatedEnd = addDays(today, Math.ceil(remainingItems / Math.max(chaptersPerDay, 1)));
        
        // Determinar cor do plano
        const presetPlan = Object.values(PRESET_PLANS).find(p => 
          plano.titulo?.toLowerCase().includes(p.title.toLowerCase().split(' ')[0])
        );
        
        return {
          id: inscricao.id,
          slotIndex: index,
          inscricaoId: inscricao.id,
          planoId: inscricao.plano_id,
          title: plano.titulo,
          description: plano.descricao || '',
          type: plano.tipo,
          color: presetPlan?.color || 'from-primary to-secondary',
          icon: presetPlan?.icon || 'book-open',
          startDate: startDate,
          endDate: plano.data_fim,
          totalItems,
          completedItems,
          percentComplete: inscricao.percentual_concluido || (completedItems / totalItems * 100),
          chaptersPerDay,
          daysRemaining: plano.duracao_dias - daysPassed,
          estimatedEndDate: format(estimatedEnd, 'yyyy-MM-dd'),
          status: inscricao.status === 'concluido' ? 'completed' : 'active',
        };
      });
      
      setActivePlans(plans);
      
      // 3. Buscar leituras de hoje para todos os planos ativos
      await fetchTodayReadings(plans);
      
      // 4. Buscar planos disponíveis
      if (unidadeId) {
        const { data: disponiveis } = await supabase
          .from('planos_leitura')
          .select('*')
          .eq('unidade_id', unidadeId)
          .eq('status', 'publicado')
          .order('created_at', { ascending: false });
        
        setAllPlanosDisponiveis(disponiveis || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar seus planos');
    } finally {
      setLoading(false);
    }
  }, [user?.id, unidadeId]);
  
  // Buscar leituras de hoje
  const fetchTodayReadings = useCallback(async (plans: ActivePlan[]) => {
    if (!user?.id || plans.length === 0) {
      setTodayReadings([]);
      return;
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const readings: TodayReading[] = [];
    
    for (const plan of plans) {
      try {
        // Buscar itens de hoje ou próximos não concluídos
        const { data: itens } = await supabase
          .from('planos_leitura_itens')
          .select('*')
          .eq('plano_id', plan.planoId)
          .order('dia_numero');
        
        if (!itens) continue;
        
        // Buscar progresso do usuário neste plano
        const { data: progresso } = await supabase
          .from('planos_leitura_progresso')
          .select('item_id, id, concluido')
          .eq('inscricao_id', plan.inscricaoId);
        
        const progressoMap = new Map(progresso?.map(p => [p.item_id, p]));
        
        // Calcular qual item corresponde a "hoje" baseado no dia_numero e data_inicio
        const startDate = parseISO(plan.startDate);
        const daysSinceStart = differenceInDays(new Date(), startDate) + 1;
        
        // Pegar itens do dia atual ou próximos não concluídos
        const todayItems = itens.filter(item => {
          const prog = progressoMap.get(item.id);
          const isCompleted = prog?.concluido || false;
          
          // Item do dia atual ou próximos não lidos
          return item.dia_numero <= daysSinceStart + 1 && !isCompleted;
        }).slice(0, 3); // Máximo 3 leituras por plano
        
        for (const item of todayItems) {
          const prog = progressoMap.get(item.id);
          readings.push({
            id: `${plan.id}-${item.id}`,
            planId: plan.id,
            planTitle: plan.title,
            planColor: plan.color,
            itemId: item.id,
            dayNumber: item.dia_numero,
            reference: item.referencia_texto,
            bookId: item.livro_id || '',
            chapterStart: item.capitulo_inicio,
            chapterEnd: item.capitulo_fim,
            isCompleted: prog?.concluido || false,
            progressId: prog?.id || null,
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar leituras do plano ${plan.title}:`, error);
      }
    }
    
    setTodayReadings(readings);
  }, [user?.id]);
  
  // Buscar progresso do mês para calendário
  const fetchMonthProgress = useCallback(async (year: number, month: number) => {
    if (!user?.id || activePlans.length === 0) return;
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const progressMap = new Map<string, DayProgress>();
    
    for (const plan of activePlans) {
      try {
        const { data: progresso } = await supabase
          .from('planos_leitura_progresso')
          .select('marcado_em, concluido')
          .eq('inscricao_id', plan.inscricaoId)
          .gte('marcado_em', format(startDate, 'yyyy-MM-dd'))
          .lte('marcado_em', format(endDate, 'yyyy-MM-dd'));
        
        if (progresso) {
          for (const p of progresso) {
            if (!p.marcado_em) continue;
            const dateKey = p.marcado_em.split('T')[0];
            const existing = progressMap.get(dateKey) || {
              date: dateKey,
              totalReadings: 0,
              completedReadings: 0,
              isComplete: false,
            };
            existing.totalReadings++;
            if (p.concluido) existing.completedReadings++;
            existing.isComplete = existing.completedReadings >= existing.totalReadings;
            progressMap.set(dateKey, existing);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar progresso do mês:', error);
      }
    }
    
    setMonthProgress(progressMap);
  }, [user?.id, activePlans]);
  
  // Marcar leitura como concluída (com sincronização entre planos)
  const markReadingComplete = useCallback(async (reading: TodayReading) => {
    if (!user?.id) return false;
    
    try {
      const plan = activePlans.find(p => p.id === reading.planId);
      if (!plan) return false;
      
      if (reading.isCompleted && reading.progressId) {
        // Desmarcar
        await supabase
          .from('planos_leitura_progresso')
          .delete()
          .eq('id', reading.progressId);
        
        setTodayReadings(prev => prev.map(r => 
          r.id === reading.id ? { ...r, isCompleted: false, progressId: null } : r
        ));
        
        setActivePlans(prev => prev.map(p => 
          p.id === plan.id ? { 
            ...p, 
            completedItems: p.completedItems - 1,
            percentComplete: ((p.completedItems - 1) / p.totalItems) * 100,
          } : p
        ));
        
      } else {
        // Marcar como concluído
        const { data, error } = await supabase
          .from('planos_leitura_progresso')
          .insert({
            inscricao_id: plan.inscricaoId,
            item_id: reading.itemId,
            user_id: user.id,
            concluido: true,
            fonte: 'app',
            marcado_em: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setTodayReadings(prev => prev.map(r => 
          r.id === reading.id ? { ...r, isCompleted: true, progressId: data.id } : r
        ));
        
        setActivePlans(prev => prev.map(p => 
          p.id === plan.id ? { 
            ...p, 
            completedItems: p.completedItems + 1,
            percentComplete: ((p.completedItems + 1) / p.totalItems) * 100,
          } : p
        ));
        
        // Sincronizar com outros planos que tenham o mesmo capítulo
        await syncChapterAcrossPlans(reading);
        
        toast.success('Leitura concluída! 📖');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar leitura:', error);
      toast.error('Erro ao atualizar progresso');
      return false;
    }
  }, [user?.id, activePlans]);
  
  // Sincronizar capítulo entre planos
  const syncChapterAcrossPlans = useCallback(async (reading: TodayReading) => {
    // Encontrar se algum outro plano ativo tem o mesmo capítulo
    const otherReadings = todayReadings.filter(r => 
      r.id !== reading.id && 
      r.bookId === reading.bookId && 
      r.chapterStart === reading.chapterStart &&
      !r.isCompleted
    );
    
    for (const otherReading of otherReadings) {
      const otherPlan = activePlans.find(p => p.id === otherReading.planId);
      if (!otherPlan) continue;
      
      try {
        const { data } = await supabase
          .from('planos_leitura_progresso')
          .insert({
            inscricao_id: otherPlan.inscricaoId,
            item_id: otherReading.itemId,
            user_id: user?.id,
            concluido: true,
            fonte: 'sync',
            marcado_em: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (data) {
          setTodayReadings(prev => prev.map(r => 
            r.id === otherReading.id ? { ...r, isCompleted: true, progressId: data.id } : r
          ));
          
          setActivePlans(prev => prev.map(p => 
            p.id === otherPlan.id ? { 
              ...p, 
              completedItems: p.completedItems + 1,
              percentComplete: ((p.completedItems + 1) / p.totalItems) * 100,
            } : p
          ));
          
          toast.success(`Sincronizado com "${otherPlan.title}"`, { duration: 2000 });
        }
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
      }
    }
  }, [todayReadings, activePlans, user?.id]);
  
  // Verificar se pode adicionar mais planos
  const canAddPlan = useMemo(() => activePlans.length < MAX_SLOTS, [activePlans]);
  
  // Slots vazios disponíveis
  const emptySlots = useMemo(() => {
    const slots: number[] = [];
    for (let i = activePlans.length; i < MAX_SLOTS; i++) {
      slots.push(i);
    }
    return slots;
  }, [activePlans]);
  
  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalCompleted = activePlans.reduce((acc, p) => acc + p.completedItems, 0);
    const totalItems = activePlans.reduce((acc, p) => acc + p.totalItems, 0);
    const todayCompleted = todayReadings.filter(r => r.isCompleted).length;
    const todayTotal = todayReadings.length;
    
    return {
      totalCompleted,
      totalItems,
      overallProgress: totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0,
      todayCompleted,
      todayTotal,
      todayProgress: todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0,
      activePlansCount: activePlans.length,
    };
  }, [activePlans, todayReadings]);
  
  // Inicializar
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Buscar progresso do mês atual
  useEffect(() => {
    const now = new Date();
    fetchMonthProgress(now.getFullYear(), now.getMonth());
  }, [fetchMonthProgress]);
  
  return {
    loading,
    activePlans,
    todayReadings,
    monthProgress,
    allPlanosDisponiveis,
    stats,
    canAddPlan,
    emptySlots,
    maxSlots: MAX_SLOTS,
    presetPlans: PRESET_PLANS,
    markReadingComplete,
    fetchData,
    fetchMonthProgress,
  };
}
