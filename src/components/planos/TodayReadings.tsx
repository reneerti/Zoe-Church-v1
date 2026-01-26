import { useState } from 'react';
import { CheckCircle, Circle, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TodayReading } from '@/hooks/useReadingPlans';
import { useNavigate } from 'react-router-dom';

interface TodayReadingsProps {
  readings: TodayReading[];
  onMarkComplete: (reading: TodayReading) => Promise<boolean>;
  stats: {
    todayCompleted: number;
    todayTotal: number;
    todayProgress: number;
  };
}

export function TodayReadings({ readings, onMarkComplete, stats }: TodayReadingsProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingReadings = readings.filter(r => !r.isCompleted);
  const completedReadings = readings.filter(r => r.isCompleted);
  const allCompleted = pendingReadings.length === 0 && completedReadings.length > 0;

  const handleMarkComplete = async (reading: TodayReading) => {
    setLoadingId(reading.id);
    await onMarkComplete(reading);
    setLoadingId(null);
  };

  // Função para navegar para o capítulo
  const goToChapter = (reading: TodayReading) => {
    // Parse reference to get book name and chapter
    const ref = reading.reference;
    // Simplified navigation - in a real app, would need proper parsing
    navigate('/biblia');
  };

  if (readings.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-muted/50 to-muted">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Nenhuma leitura pendente</h3>
          <p className="text-sm text-muted-foreground">
            Adicione um plano de leitura para começar sua jornada bíblica
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      allCompleted && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {allCompleted ? (
              <>
                <Sparkles className="h-5 w-5 text-amber-500" />
                Parabéns! Leituras do dia concluídas!
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5 text-primary" />
                Para Hoje
              </>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={allCompleted ? "default" : "outline"} 
              className={cn(
                allCompleted && "bg-green-500 hover:bg-green-600"
              )}
            >
              {stats.todayCompleted}/{stats.todayTotal}
            </Badge>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div 
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              allCompleted ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${stats.todayProgress}%` }}
          />
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          {/* Pending readings */}
          {pendingReadings.map(reading => (
            <div
              key={reading.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:border-primary/50 transition-colors group"
            >
              <Checkbox
                checked={reading.isCompleted}
                disabled={loadingId === reading.id}
                onCheckedChange={() => handleMarkComplete(reading)}
                className="h-5 w-5"
              />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{reading.reference}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs py-0 h-5",
                      reading.planColor?.includes('blue') && "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400",
                      reading.planColor?.includes('rose') && "border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400",
                      reading.planColor?.includes('amber') && "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400",
                      reading.planColor?.includes('emerald') && "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    {reading.planTitle.length > 20 ? reading.planTitle.substring(0, 20) + '...' : reading.planTitle}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Dia {reading.dayNumber}</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  goToChapter(reading);
                }}
              >
                Ler
              </Button>
            </div>
          ))}
          
          {/* Completed readings */}
          {completedReadings.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Concluídas ({completedReadings.length})
              </p>
              
              {completedReadings.map(reading => (
                <div
                  key={reading.id}
                  className="flex items-center gap-3 p-2 rounded-lg opacity-60"
                >
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleMarkComplete(reading)}
                    className="h-4 w-4"
                  />
                  
                  <span className="text-sm line-through">{reading.reference}</span>
                  
                  <Badge variant="secondary" className="text-xs py-0 h-5 ml-auto">
                    {reading.planTitle.length > 15 ? reading.planTitle.substring(0, 15) + '...' : reading.planTitle}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
