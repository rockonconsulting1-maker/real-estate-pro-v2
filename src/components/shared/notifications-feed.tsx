import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';
import { objectsService } from '@/lib/ghl/services/objects';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { conversationsService } from '@/lib/ghl/services/conversations';
import { format, isToday, isPast, addDays } from 'date-fns';
import { Bell, CheckSquare, FileText, MessageSquare, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationsFeed({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('rc-crm-read-notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('rc-crm-read-notifications', JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  // Fetch data
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['notifications-tasks'],
    queryFn: () => tasksGlobalService.search({}),
  });

  const { data: offers, isLoading: loadingOffers } = useQuery({
    queryKey: ['notifications-offers'],
    queryFn: () => objectsService.searchRecords('real_estate_offer', { pageLimit: 100 }),
  });

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['notifications-events'],
    queryFn: () => calendarsService.eventsByRange(
      new Date().toISOString(),
      addDays(new Date(), 1).toISOString()
    ),
  });

  const { data: conversations, isLoading: loadingConv } = useQuery({
    queryKey: ['notifications-conversations'],
    queryFn: () => conversationsService.list(),
  });

  const isLoading = loadingTasks || loadingOffers || loadingEvents || loadingConv;

  const notifications = React.useMemo(() => {
    const items: any[] = [];

    // Overdue tasks
    tasks?.tasks?.forEach((t: any) => {
      if (!t.completed && t.dueDate && isPast(new Date(t.dueDate))) {
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: 'Overdue Task',
          message: t.title,
          date: new Date(t.dueDate),
          icon: CheckSquare,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          onClick: () => navigate('/tasks')
        });
      }
    });

    // Expiring offers (< 24h)
    offers?.records?.forEach((o: any) => {
      if (o.status === 'submitted' && o.irrevocable_until) {
        const until = new Date(o.irrevocable_until);
        const hoursLeft = (until.getTime() - new Date().getTime()) / (1000 * 60 * 60);
        if (hoursLeft > 0 && hoursLeft <= 24) {
          items.push({
            id: `offer-${o.id}`,
            type: 'offer',
            title: 'Offer Expiring Soon',
            message: o.property_address || 'Unknown Property',
            date: until,
            icon: FileText,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            onClick: () => navigate(`/offers/${o.id}`)
          });
        }
      }
    });

    // Today's appointments
    (events || [])?.forEach((e: any) => {
      if (isToday(new Date(e.startTime)) && e.status !== 'noshow') {
        items.push({
          id: `event-${e.id}`,
          type: 'event',
          title: 'Appointment Today',
          message: e.title,
          date: new Date(e.startTime),
          icon: CalendarIcon,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          onClick: () => navigate('/calendar')
        });
      }
    });

    // Unread messages
    conversations?.conversations?.forEach((c: any) => {
      if (c.unreadCount > 0) {
        items.push({
          id: `msg-${c.id}`,
          type: 'message',
          title: 'New Message',
          message: c.lastMessageBody || 'New message received',
          date: new Date(c.lastMessageDate),
          icon: MessageSquare,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          onClick: () => navigate(`/conversations/${c.id}`)
        });
      }
    });

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [tasks, offers, events, conversations, navigate]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const handleMarkAllRead = () => {
    const newRead = new Set(readIds);
    notifications.forEach(n => newRead.add(n.id));
    setReadIds(newRead);
  };

  const handleItemClick = (item: any) => {
    const newRead = new Set(readIds);
    newRead.add(item.id);
    setReadIds(newRead);
    item.onClick();
    if (onClose) onClose();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-brand text-brand-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-8 px-2 text-xs">
            <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <Bell className="h-8 w-8 mb-3 opacity-20" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left p-4 flex gap-3 hover:bg-muted/50 transition-colors ${!isRead ? 'bg-brand/5' : ''}`}
                >
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.bg} ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`text-sm truncate ${!isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {isToday(item.date) ? format(item.date, 'h:mm a') : format(item.date, 'MMM d')}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.message}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="shrink-0 flex items-center justify-center w-2">
                      <div className="h-2 w-2 rounded-full bg-brand" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
