import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { offersService } from '@/lib/ghl/services/objects';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckSquare, Clock, FileWarning, Calendar } from 'lucide-react';
import { subDays, startOfDay, endOfDay, addDays, format, isPast } from 'date-fns';
import { useGhlCredentials } from '@/hooks/use-ghl-credentials';
import { useBootstrap } from '@/hooks/use-bootstrap';

export function NeedsAttentionWidget() {
  const { defaultCalendarId } = useGhlCredentials();
  const { data: bootstrapData } = useBootstrap();
  const leadPipeline = PipelineRegistry.byName('lead');

  const queries = useQueries({
    queries: [
      // 0: Overdue tasks
      {
        queryKey: ghl.tasks({ overdue: true }),
        queryFn: () => {
          return tasksGlobalService.search({ completed: false });
        },
        staleTime: STALE_TIMES.LIST,
      },
      // 1: Stale Leads
      {
        queryKey: ghl.opps({ pipelineId: leadPipeline?.pipelineId, stale: true }),
        queryFn: () => {
          const sevenDaysAgo = subDays(new Date(), 7);
          return opportunitiesService.search({ pipelineId: leadPipeline?.pipelineId, status: 'open', limit: 100 }).then(res => {
            return {
              opportunities: res.opportunities.filter(o => o.updatedAt && new Date(o.updatedAt) <= sevenDaysAgo)
            };
          });
        },
        enabled: !!leadPipeline?.pipelineId,
        staleTime: STALE_TIMES.LIST,
      },
      // 2: Expiring Offers
      {
        queryKey: ghl.records('real_estate_offer', { expiring: true }),
        queryFn: async () => {
          const in48Hours = addDays(new Date(), 2);
          const res = await offersService.search({ pageLimit: 100 });
          return {
            ...res,
            records: res.records.filter(o => {
              const status = (o.customFields as any)?.status || o.name?.toLowerCase();
              const irrevocable = (o.customFields as any)?.irrevocable_until;
              if (!irrevocable || (status !== 'submitted' && status !== 'pending')) return false;
              return new Date(irrevocable) <= in48Hours;
            })
          };
        },
        staleTime: STALE_TIMES.LIST,
      },
      // 3: Today's unconfirmed appts
      {
        queryKey: ghl.events({ range: 'today-unconfirmed' }),
        queryFn: () => {
          const calendarId = defaultCalendarId || (bootstrapData?.calendars?.[0] as any)?.id;
          if (!calendarId) return [];
          const start = startOfDay(new Date());
          const end = endOfDay(new Date());
          return calendarsService.eventsByRange({ start, end, calendarId });
        },
        staleTime: STALE_TIMES.LIST,
        enabled: !!defaultCalendarId || !!(bootstrapData?.calendars?.[0] as any)?.id,
      }
    ]
  });

  const isLoading = queries.some(q => q.isLoading);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" /> Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Process data
  const overdueTasks = (queries[0].data?.tasks || []).filter(t => t.status !== 'completed' && t.dueDate && isPast(new Date(t.dueDate)));
  const staleLeads = queries[1].data?.opportunities || [];
  const expiringOffers = queries[2].data?.records || [];
  const unconfirmedAppts = (queries[3].data || []).filter(e => e.status === 'new' || e.status === 'unconfirmed');

  const totalItems = overdueTasks.length + staleLeads.length + expiringOffers.length + unconfirmedAppts.length;

  if (totalItems === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" /> Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">
            <p>You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-header flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning" /> Needs Attention
          <span className="bg-warning-soft text-warning px-2 py-0.5 rounded-full text-xs ml-auto">
            {totalItems}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {overdueTasks.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                <CheckSquare className="w-4 h-4" /> Overdue Tasks ({overdueTasks.length})
              </div>
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-4">{task.title}</span>
                    <Link to={`/tasks`} className="text-brand hover:underline whitespace-nowrap text-xs">View</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staleLeads.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                <Clock className="w-4 h-4" /> Stale Leads ({staleLeads.length})
              </div>
              <div className="space-y-2">
                {staleLeads.slice(0, 3).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-4">{lead.name}</span>
                    <Link to={`/leads/${lead.id}`} className="text-brand hover:underline whitespace-nowrap text-xs">Follow up</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiringOffers.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                <FileWarning className="w-4 h-4" /> Expiring Offers ({expiringOffers.length})
              </div>
              <div className="space-y-2">
                {expiringOffers.slice(0, 3).map(offer => (
                  <div key={offer.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-4">{offer.name}</span>
                    <Link to={`/offers/${offer.id}`} className="text-brand hover:underline whitespace-nowrap text-xs">Review</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unconfirmedAppts.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                <Calendar className="w-4 h-4" /> Unconfirmed Appts ({unconfirmedAppts.length})
              </div>
              <div className="space-y-2">
                {unconfirmedAppts.slice(0, 3).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-4">{appt.title} at {format(new Date(appt.startTime), 'h:mm a')}</span>
                    <Link to={`/calendar`} className="text-brand hover:underline whitespace-nowrap text-xs">Confirm</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
