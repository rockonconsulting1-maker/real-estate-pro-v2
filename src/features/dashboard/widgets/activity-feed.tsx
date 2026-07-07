import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { conversationsService } from '@/lib/ghl/services/conversations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, MessageSquare, ArrowRightLeft, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ActivityItem = {
  id: string;
  type: 'task' | 'stage' | 'message';
  title: string;
  description: string;
  date: Date;
  icon: React.ElementType;
};

export function ActivityFeedWidget() {
  const [filter, setFilter] = useState<'all' | 'tasks' | 'stage' | 'message'>('all');

  const queries = useQueries({
    queries: [
      {
        queryKey: ghl.tasks({ completed: true, limit: 10 }),
        queryFn: () => tasksGlobalService.search({ completed: true }),
        staleTime: STALE_TIMES.LIST,
      },
      {
        queryKey: ghl.opps({ recent: '7d' }),
        queryFn: () => opportunitiesService.search({ limit: 50 }), // Fetch recent opportunities
        staleTime: STALE_TIMES.LIST,
      },
      {
        queryKey: ghl.conversations({ limit: 10 }),
        queryFn: () => conversationsService.list(),
        staleTime: STALE_TIMES.LIST,
      }
    ]
  });

  const isLoading = queries.some(q => q.isLoading);

  if (isLoading) {
    return (
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-card-header">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const tasks = queries[0].data?.tasks || [];
  const opps = queries[1].data?.opportunities || [];
  const convos = queries[2].data?.conversations || [];

  const activity: ActivityItem[] = [
    ...tasks.map(t => ({
      id: `task-${t.id}`,
      type: 'task' as const,
      title: 'Task Completed',
      description: t.title,
      date: new Date(t.dueDate || t.id), // Fallback
      icon: CheckSquare,
    })),
    ...opps.map(o => ({
      id: `opp-${o.id}`,
      type: 'stage' as const,
      title: 'Opportunity Updated',
      description: `${o.name} moved in pipeline`,
      date: new Date(o.updatedAt || o.createdAt),
      icon: ArrowRightLeft,
    })),
    ...convos.map(c => ({
      id: `msg-${c.id}`,
      type: 'message' as const,
      title: 'New Message',
      description: String(c.lastMessageBody || 'Message received'),
      date: new Date((c.lastMessageDate || c.dateUpdated || Date.now()) as string | number),
      icon: MessageSquare,
    }))
  ];

  activity.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const filteredActivity = filter === 'all' 
    ? activity 
    : activity.filter(a => a.type === filter);

  const displayActivity = filteredActivity.slice(0, 30);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-card-header flex items-center justify-between">
          <span>Activity Feed</span>
        </CardTitle>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <Badge 
            variant={filter === 'all' ? 'default' : 'outline'} 
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('all')}
          >
            All
          </Badge>
          <Badge 
            variant={filter === 'tasks' ? 'default' : 'outline'} 
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('tasks')}
          >
            Tasks
          </Badge>
          <Badge 
            variant={filter === 'stage' ? 'default' : 'outline'} 
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('stage')}
          >
            Stage
          </Badge>
          <Badge 
            variant={filter === 'message' ? 'default' : 'outline'} 
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('message')}
          >
            Messages
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="space-y-4">
          {displayActivity.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity found.
            </div>
          ) : (
            displayActivity.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-0.5 bg-muted rounded-full p-1.5 h-max">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(item.date, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
