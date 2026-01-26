import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayProgress } from '@/hooks/useReadingPlans';

interface ProgressCalendarProps {
  progressMap: Map<string, DayProgress>;
  onMonthChange?: (year: number, month: number) => void;
}

export function ProgressCalendar({ progressMap, onMonthChange }: ProgressCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);
  
  const firstDayOfWeek = useMemo(() => {
    return startOfMonth(currentDate).getDay();
  }, [currentDate]);
  
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
  };
  
  const getDayStatus = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const progress = progressMap.get(dateKey);
    const today = startOfDay(new Date());
    const isPast = isBefore(date, today);
    
    if (progress?.isComplete) {
      return 'complete';
    } else if (progress && progress.completedReadings > 0) {
      return 'partial';
    } else if (isPast && isSameMonth(date, currentDate)) {
      return 'missed';
    }
    return 'none';
  };
  
  // Estatísticas do mês
  const monthStats = useMemo(() => {
    let completeDays = 0;
    let partialDays = 0;
    
    monthDays.forEach(day => {
      const status = getDayStatus(day);
      if (status === 'complete') completeDays++;
      else if (status === 'partial') partialDays++;
    });
    
    return { completeDays, partialDays };
  }, [monthDays, progressMap]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calendário de Progresso</CardTitle>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completo ({monthStats.completeDays})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Parcial ({monthStats.partialDays})</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Week days header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, i) => (
            <div 
              key={i} 
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Days of month */}
          {monthDays.map(day => {
            const status = getDayStatus(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg text-sm transition-colors relative",
                  isCurrentDay && "ring-2 ring-primary ring-offset-1",
                  status === 'complete' && "bg-green-500 text-white font-medium",
                  status === 'partial' && "bg-amber-400/80 text-white font-medium",
                  status === 'missed' && "bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400",
                  status === 'none' && "hover:bg-muted"
                )}
              >
                {format(day, 'd')}
                
                {status === 'complete' && (
                  <CheckCircle className="absolute -top-0.5 -right-0.5 h-3 w-3 text-white bg-green-600 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
