import { Plus, BookOpen, Calendar, Target, ChevronRight, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ActivePlan } from '@/hooks/useReadingPlans';

interface PlanSlotCardProps {
  plan?: ActivePlan;
  slotIndex: number;
  isEmpty?: boolean;
  onAddPlan?: () => void;
  onOpenPlan?: (plan: ActivePlan) => void;
}

export function PlanSlotCard({ 
  plan, 
  slotIndex, 
  isEmpty = false, 
  onAddPlan,
  onOpenPlan,
}: PlanSlotCardProps) {
  if (isEmpty || !plan) {
    return (
      <Card 
        className="relative overflow-hidden border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition-all cursor-pointer group min-h-[180px] flex items-center justify-center"
        onClick={onAddPlan}
      >
        <div className="text-center p-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
            <Plus className="h-7 w-7 text-primary" />
          </div>
          <p className="font-medium text-muted-foreground">Adicionar Plano</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Slot {slotIndex + 1} disponível</p>
        </div>
      </Card>
    );
  }

  const progressCircumference = 2 * Math.PI * 36;
  const progressOffset = progressCircumference - (progressCircumference * plan.percentComplete) / 100;

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
      onClick={() => onOpenPlan?.(plan)}
    >
      {/* Gradient header */}
      <div className={cn(
        "h-3 bg-gradient-to-r",
        plan.color || "from-primary to-secondary"
      )} />
      
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Circular progress */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressOffset}
                className={cn(
                  "transition-all duration-500",
                  plan.color?.includes('blue') ? 'text-blue-500' :
                  plan.color?.includes('rose') ? 'text-rose-500' :
                  plan.color?.includes('amber') ? 'text-amber-500' :
                  plan.color?.includes('emerald') ? 'text-emerald-500' :
                  'text-primary'
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{Math.round(plan.percentComplete)}%</span>
            </div>
          </div>
          
          {/* Plan info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">{plan.title}</h3>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <BookOpen className="h-3 w-3" />
              <span>{plan.completedItems}/{plan.totalItems} leituras</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                {plan.chaptersPerDay} cap/dia
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {plan.daysRemaining}d restantes
              </Badge>
            </div>
          </div>
          
          {/* Action button */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Status badge */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <Badge 
            variant={plan.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {plan.status === 'active' ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Em andamento
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pausado
              </>
            )}
          </Badge>
          
          <span className="text-xs text-muted-foreground">
            Previsão: {new Date(plan.estimatedEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>
    </Card>
  );
}
