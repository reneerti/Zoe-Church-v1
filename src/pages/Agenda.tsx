import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvents, Event } from "@/hooks/useEvents";
import { EventModal } from "@/components/agenda/EventModal";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";


export default function Agenda() {
  const navigate = useNavigate();
  const { isMaster } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Fetch events from database
  const { data: allEvents = [], isLoading } = useEvents();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter events for selected day
  const dayEvents = allEvents.filter((event) =>
    isSameDay(new Date(event.date), selectedDate)
  );

  // Get upcoming events (next 5)
  const upcomingEvents = allEvents
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setSelectedDate(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setSelectedDate(newMonth);
  };

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

          {isMaster && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleAddEvent}
              title="Adicionar evento"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <PageContainer>
        {/* Month Navigation */}
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasEvents = allEvents.some((e) => isSameDay(new Date(e.date), day));

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

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  delay={index * 50}
                  onClick={() => isMaster && handleEditEvent(event)}
                  clickable={isMaster}
                />
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
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showDate
                  delay={index * 50}
                  onClick={() => isMaster && handleEditEvent(event)}
                  clickable={isMaster}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum evento próximo</p>
            </div>
          )}
        </div>
      </PageContainer>

      <EventModal
        event={editingEvent}
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
      />

      <BottomNav />
    </>
  );
}

function EventCard({
  event,
  showDate = false,
  delay,
  onClick,
  clickable = false
}: {
  event: Event;
  showDate?: boolean;
  delay: number;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const eventDate = new Date(event.date);

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-xl bg-card border border-border",
        "transition-all duration-200 hover:shadow-md",
        "opacity-0 animate-fade-in",
        clickable && "cursor-pointer hover:bg-muted/50"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className={cn("w-1 rounded-full flex-shrink-0", event.color)} />

      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{event.title}</h4>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
          {showDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(eventDate, "dd/MM")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.time}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
