import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { format, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EventDetailModal, NewEventModal } from './components/event-modals';

export function DesktopCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day' | 'month'>('week');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  // Calculate range based on view
  let startDate = new Date();
  let endDate = new Date();
  
  if (view === 'week') {
    startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  } else if (view === 'day') {
    startDate = startOfDay(currentDate);
    endDate = endOfDay(currentDate);
  } else if (view === 'month') {
    startDate = startOfMonth(currentDate);
    endDate = endOfMonth(currentDate);
  }

  const { data: events, isLoading } = useQuery({
    queryKey: ghl.events({ start: startDate.toISOString(), end: endDate.toISOString() }),
    queryFn: () => calendarsService.eventsByRange(startDate.toISOString(), endDate.toISOString()),
    staleTime: 60000,
  });

  const conflicts = React.useMemo(() => {
    if (!events) return false;
    const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      if (new Date(sorted[i + 1].startTime).getTime() < new Date(sorted[i].endTime).getTime()) {
        return true;
      }
    }
    return false;
  }, [events]);

  const handlePrev = () => {
    if (view === 'week') setCurrentDate(subDays(currentDate, 7));
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    if (view === 'month') setCurrentDate(subDays(startOfMonth(currentDate), 1));
  };

  const handleNext = () => {
    if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    if (view === 'month') setCurrentDate(addDays(endOfMonth(currentDate), 1));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h1>
          <div className="flex items-center rounded-md border bg-background">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 rounded-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 rounded-none border-l border-r px-3 font-medium">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg mr-2">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors",
                  view === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsNewEventOpen(true)}>
            New Event
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {conflicts && (
          <Alert variant="destructive" className="shrink-0 bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scheduling Conflict Detected</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>You have overlapping appointments in the current view.</span>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid grid-cols-7 gap-4 h-full">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : view === 'week' ? (
          <WeekView 
            startDate={startDate} 
            events={events || []} 
            onEventClick={setSelectedEventId} 
          />
        ) : view === 'day' ? (
          <DayView 
            date={currentDate} 
            events={events || []} 
            onEventClick={setSelectedEventId} 
          />
        ) : (
          <MonthView 
            date={currentDate} 
            events={events || []} 
            onEventClick={setSelectedEventId} 
          />
        )}
      </div>

      <EventDetailModal 
        id={selectedEventId} 
        open={!!selectedEventId} 
        onOpenChange={(o) => !o && setSelectedEventId(null)} 
      />
      
      <NewEventModal 
        open={isNewEventOpen} 
        onOpenChange={setIsNewEventOpen} 
      />
    </div>
  );
}

function WeekView({ startDate, events, onEventClick }: { startDate: Date, events: any[], onEventClick: (id: string) => void }) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 8 AM to 8 PM
  
  return (
    <div className="flex h-full min-h-[600px] border rounded-lg bg-surface overflow-hidden">
      {/* Time column */}
      <div className="w-16 border-r shrink-0 flex flex-col">
        <div className="h-12 border-b"></div>
        {hours.map(hour => (
          <div key={hour} className="flex-1 border-b min-h-[60px] relative">
            <span className="absolute -top-3 right-2 text-xs text-muted-foreground bg-surface px-1">
              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
            </span>
          </div>
        ))}
      </div>
      
      {/* Days columns */}
      <div className="flex-1 grid grid-cols-7 divide-x">
        {days.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={i} className="flex flex-col">
              <div className="h-12 border-b flex flex-col items-center justify-center bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase">{format(day, 'EEE')}</span>
                <span className={cn(
                  "text-lg font-semibold h-7 w-7 flex items-center justify-center rounded-full mt-0.5",
                  isToday ? "bg-brand text-brand-foreground" : ""
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 relative">
                {hours.map(hour => (
                  <div key={hour} className="border-b min-h-[60px] border-dashed border-border/50"></div>
                ))}
                
                {dayEvents.map(event => {
                  const start = new Date(event.startTime);
                  const end = new Date(event.endTime);
                  
                  // Simple positioning logic for 8 AM to 8 PM grid
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;
                  
                  if (startHour < 8 || startHour > 20) return null; // Outside grid
                  
                  const top = (startHour - 8) * 60; // 60px per hour
                  const height = Math.max(20, (endHour - startHour) * 60);
                  
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick(event.id)}
                      className="absolute left-1 right-1 rounded-md p-1.5 text-xs overflow-hidden cursor-pointer shadow-sm border border-brand/20 bg-brand/10 hover:bg-brand/20 transition-colors"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="font-semibold text-brand-ink truncate">{event.title}</div>
                      {height >= 40 && (
                        <div className="text-brand-ink/80 truncate mt-0.5">
                          {format(start, 'h:mm a')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ date, events, onEventClick }: { date: Date, events: any[], onEventClick: (id: string) => void }) {
  const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), date));
  
  return (
    <div className="h-full border rounded-lg bg-surface overflow-hidden flex flex-col">
      <div className="h-14 border-b flex items-center px-4 bg-muted/30">
        <h2 className="font-semibold text-lg">{format(date, 'EEEE, MMMM d, yyyy')}</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {dayEvents.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No appointments scheduled for this day.
          </div>
        ) : (
          dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map(event => (
            <div 
              key={event.id}
              onClick={() => onEventClick(event.id)}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:border-brand/50 cursor-pointer transition-colors shadow-sm"
            >
              <div className="w-24 shrink-0 text-right">
                <div className="font-semibold text-foreground">{format(new Date(event.startTime), 'h:mm a')}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(event.endTime), 'h:mm a')}</div>
              </div>
              <div className="w-1.5 bg-brand rounded-full self-stretch shrink-0"></div>
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-base truncate">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">Client ID: {event.contactId}</span>
                  </div>
                  {event.status && (
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        event.status === 'confirmed' ? "bg-success" : 
                        event.status === 'noshow' ? "bg-destructive" : "bg-warning"
                      )} />
                      <span className="capitalize">{event.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MonthView({ date, events, onEventClick }: { date: Date, events: any[], onEventClick: (id: string) => void }) {
  // Simple month view
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = [];
  let current = startDate;
  while (current <= endDate) {
    days.push(current);
    current = addDays(current, 1);
  }
  
  return (
    <div className="h-full border rounded-lg bg-surface overflow-hidden flex flex-col min-h-[600px]">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-5 divide-x divide-y">
        {days.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
          const isCurrentMonth = day.getMonth() === date.getMonth();
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={i} className={cn(
              "p-1.5 min-h-[100px] flex flex-col gap-1",
              !isCurrentMonth && "bg-muted/20 opacity-60"
            )}>
              <div className="flex justify-end">
                <span className={cn(
                  "text-xs h-6 w-6 flex items-center justify-center rounded-full font-medium",
                  isToday ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onEventClick(event.id)}
                    className="text-[10px] px-1.5 py-1 rounded bg-brand/10 text-brand-ink truncate cursor-pointer hover:bg-brand/20 transition-colors"
                  >
                    {format(new Date(event.startTime), 'h:mm')} {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
