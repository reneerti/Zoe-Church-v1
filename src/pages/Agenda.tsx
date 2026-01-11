import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// Sample events
const events = [
  {
    id: 1,
    title: "Culto de Celebração",
    date: new Date(),
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 2,
    title: "Escola Bíblica Dominical",
    date: addDays(new Date(), 3),
    time: "09:00",
    location: "Salas de EBD",
    category: "ensino",
    color: "bg-agenda",
  },
  {
    id: 3,
    title: "Culto de Oração",
    date: addDays(new Date(), 1),
    time: "19:30",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 4,
    title: "Ensaio do Louvor",
    date: addDays(new Date(), 2),
    time: "20:00",
    location: "Sala de Música",
    category: "ensaio",
    color: "bg-harpa",
  },
  {
    id: 5,
    title: "Reunião de Células",
    date: addDays(new Date(), 4),
    time: "20:00",
    location: "Casas",
    category: "célula",
    color: "bg-convertidos",
  },
];

export default function Agenda() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const dayEvents = events.filter((event) => 
    isSameDay(event.date, selectedDate)
  );

  const upcomingEvents = events
    .filter((event) => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Agenda</h1>
          </div>
          
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <PageContainer>
        {/* Month Navigation */}
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg capitalize">
            {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasEvents = events.some((e) => isSameDay(e.date, day));
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center py-2 rounded-xl transition-all",
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : isToday 
                      ? "bg-primary/10" 
                      : "hover:bg-muted"
                )}
              >
                <span className="text-[10px] uppercase opacity-70">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-lg font-semibold",
                  isSelected && "text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
                {hasEvents && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Events */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          
          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((event, index) => (
                <EventCard key={event.id} event={event} delay={index * 50} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum evento neste dia</p>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div>
          <h3 className="font-semibold mb-3">Próximos Eventos</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} showDate delay={index * 50} />
            ))}
          </div>
        </div>
      </PageContainer>

      <BottomNav />
    </>
  );
}

function EventCard({ 
  event, 
  showDate = false,
  delay 
}: { 
  event: typeof events[0]; 
  showDate?: boolean;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-xl bg-card border border-border",
        "transition-all duration-200 hover:shadow-md",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("w-1 rounded-full flex-shrink-0", event.color)} />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{event.title}</h4>
        
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
          {showDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(event.date, "dd/MM")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.time}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
        </div>
      </div>
    </div>
  );
}
