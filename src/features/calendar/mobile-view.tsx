import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { format, startOfDay, endOfDay, addDays, subDays, isSameDay } from 'date-fns';
import { MobileShell } from '@/components/mobile/shell';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EventDetailModal, NewEventModal } from './components/event-modals';
import { cn } from '@/lib/utils';

export function MobileCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  const startDate = startOfDay(currentDate);
  const endDate = endOfDay(addDays(currentDate, 6)); // Fetch a week to allow swiping

  const { data: events, isLoading } = useQuery({
    queryKey: ghl.events({ start: startDate.toISOString(), end: endDate.toISOString() }),
    queryFn: () => calendarsService.eventsByRange(startDate.toISOString(), endDate.toISOString()),
    staleTime: 60000,
  });

  const dayEvents = (events || []).filter(e => isSameDay(new Date(e.startTime), currentDate));

  const conflicts = React.useMemo(() => {
    const sorted = [...dayEvents].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      if (new Date(sorted[i + 1].startTime).getTime() < new Date(sorted[i].endTime).getTime()) {
        return true;
      }
    }
    return false;
  }, [dayEvents]);

  // Generate week days for the top selector
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay() + i); // Sunday to Saturday of current week
    return d;
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (dayEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">No Appointments</h3>
          <p className="text-sm text-muted-foreground mt-1">You're all clear for this day.</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsNewEventOpen(true)}>
            Schedule Event
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {[...dayEvents]
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .map(event => (
            <div 
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className="bg-surface border rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold leading-tight">{event.title}</h3>
                {event.status && (
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ml-2",
                    event.status === 'confirmed' ? "bg-success/10 text-success" : 
                    event.status === 'noshow' ? "bg-destructive/10 text-destructive" : 
                    "bg-warning/10 text-warning"
                  )}>
                    {event.status}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">Contact ID: {event.contactId}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <MobileShell>
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 flex items-center justify-between bg-surface border-b shrink-0">
          <h1 className="text-xl font-bold">Calendar</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsNewEventOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 py-3 flex items-center justify-between bg-surface border-b shrink-0">
          <h2 className="font-bold text-lg">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-3 bg-surface border-b shrink-0">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, currentDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={i}
                onClick={() => setCurrentDate(day)}
                className="flex flex-col items-center justify-center w-12 h-14 rounded-xl gap-1 transition-colors relative"
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase",
                  isSelected ? "text-brand" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full",
                  isSelected ? "bg-brand text-brand-foreground" : 
                  isToday ? "bg-muted text-foreground" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
                {(events || []).some(e => isSameDay(new Date(e.startTime), day)) && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-background">
          <div className="space-y-4 pb-20">
            {conflicts && (
              <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Conflict Detected</AlertTitle>
                <AlertDescription>
                  You have overlapping appointments today.
                </AlertDescription>
              </Alert>
            )}
            {renderContent()}
          </div>
        </div>
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
    </MobileShell>
  );
}
