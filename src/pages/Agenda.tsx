import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// Eventos da Igreja
const events = [
  // FEVEREIRO 2025
  {
    id: 1,
    title: "Retorno dos Pastores e Família - Culto Ceia do Senhor",
    date: new Date(2025, 1, 1), // 01/02
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 2,
    title: "Culto de Celebração",
    date: new Date(2025, 1, 2), // Domingo 02/02
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 3,
    title: "Reunião de Pastores e Esposas",
    date: new Date(2025, 1, 5), // 05/02
    time: "17:00",
    location: "Sala de Reuniões",
    category: "reunião",
    color: "bg-agenda",
  },
  {
    id: 4,
    title: "CONEMAD Extraordinária - Barra do Garças",
    date: new Date(2025, 1, 6), // 06/02
    time: "08:00",
    location: "Barra do Garças",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 5,
    title: "CONEMAD Extraordinária - Barra do Garças",
    date: new Date(2025, 1, 7), // 07/02
    time: "08:00",
    location: "Barra do Garças",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 6,
    title: "Culto de Celebração",
    date: new Date(2025, 1, 9), // Domingo 09/02
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 7,
    title: "Reação Conectados",
    date: new Date(2025, 1, 14), // 14/02
    time: "19:30",
    location: "Templo Principal",
    category: "jovens",
    color: "bg-convertidos",
  },
  {
    id: 8,
    title: "Culto de Celebração",
    date: new Date(2025, 1, 16), // Domingo 16/02
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 9,
    title: "Culto de Celebração",
    date: new Date(2025, 1, 23), // Domingo 23/02
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 10,
    title: "Oficina de Deus Teens",
    date: new Date(2025, 1, 28), // 28/02
    time: "19:00",
    location: "Templo Principal",
    category: "teens",
    color: "bg-convertidos",
  },
  // MARÇO 2025
  {
    id: 11,
    title: "Oficina de Deus Teens",
    date: new Date(2025, 2, 1), // 01/03
    time: "19:00",
    location: "Templo Principal",
    category: "teens",
    color: "bg-convertidos",
  },
  {
    id: 12,
    title: "Culto de Celebração",
    date: new Date(2025, 2, 2), // Domingo 02/03
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 13,
    title: "Reunião de Obreiros e Batismo",
    date: new Date(2025, 2, 7), // 07/03
    time: "19:00",
    location: "Templo Principal",
    category: "reunião",
    color: "bg-agenda",
  },
  {
    id: 14,
    title: "Culto de Celebração",
    date: new Date(2025, 2, 9), // Domingo 09/03
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 15,
    title: "Batom Fashion",
    date: new Date(2025, 2, 14), // 14/03
    time: "19:00",
    location: "Templo Principal",
    category: "mulheres",
    color: "bg-pink-500",
  },
  {
    id: 16,
    title: "Culto de Celebração",
    date: new Date(2025, 2, 16), // Domingo 16/03
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 17,
    title: "Culto de Celebração",
    date: new Date(2025, 2, 23), // Domingo 23/03
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 18,
    title: "Culto de Celebração",
    date: new Date(2025, 2, 30), // Domingo 30/03
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  // ABRIL 2025
  {
    id: 19,
    title: "Connect 2026",
    date: new Date(2025, 3, 3), // 03/04
    time: "19:00",
    location: "Templo Principal",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 20,
    title: "Connect 2026",
    date: new Date(2025, 3, 4), // 04/04
    time: "19:00",
    location: "Templo Principal",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 21,
    title: "Ceia do Senhor",
    date: new Date(2025, 3, 5), // 05/04
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 22,
    title: "Culto de Celebração",
    date: new Date(2025, 3, 6), // Domingo 06/04
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 23,
    title: "Culto de Celebração",
    date: new Date(2025, 3, 13), // Domingo 13/04
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 24,
    title: "CONAMAD Goiânia",
    date: new Date(2025, 3, 14), // 14/04
    time: "08:00",
    location: "Goiânia - GO",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 25,
    title: "CONAMAD Goiânia",
    date: new Date(2025, 3, 15), // 15/04
    time: "08:00",
    location: "Goiânia - GO",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 26,
    title: "CONAMAD Goiânia",
    date: new Date(2025, 3, 16), // 16/04
    time: "08:00",
    location: "Goiânia - GO",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 27,
    title: "CONAMAD Goiânia",
    date: new Date(2025, 3, 17), // 17/04
    time: "08:00",
    location: "Goiânia - GO",
    category: "evento",
    color: "bg-harpa",
  },
  {
    id: 28,
    title: "Culto de Celebração",
    date: new Date(2025, 3, 20), // Domingo 20/04
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
  },
  {
    id: 29,
    title: "Vau de Jaboque Sede",
    date: new Date(2025, 3, 23), // 23/04
    time: "19:00",
    location: "Sede",
    category: "evento",
    color: "bg-agenda",
  },
  {
    id: 30,
    title: "Vau de Jaboque Sede",
    date: new Date(2025, 3, 24), // 24/04
    time: "19:00",
    location: "Sede",
    category: "evento",
    color: "bg-agenda",
  },
  {
    id: 31,
    title: "Vau de Jaboque Sede",
    date: new Date(2025, 3, 25), // 25/04
    time: "19:00",
    location: "Sede",
    category: "evento",
    color: "bg-agenda",
  },
  {
    id: 32,
    title: "Culto de Celebração",
    date: new Date(2025, 3, 27), // Domingo 27/04
    time: "19:00",
    location: "Templo Principal",
    category: "culto",
    color: "bg-primary",
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
