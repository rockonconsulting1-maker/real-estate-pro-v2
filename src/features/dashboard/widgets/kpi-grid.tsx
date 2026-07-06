import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { offersService } from '@/lib/ghl/services/objects';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Users, UserPlus, FileText, Home, TrendingUp, CheckCircle } from 'lucide-react';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

export function KpiGridWidget() {
  const leadPipeline = PipelineRegistry.byName('lead');
  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');

  const queries = useQueries({
    queries: [
      // 0: Active Leads
      {
        queryKey: ghl.opps({ pipelineId: leadPipeline?.pipelineId, status: 'open' }),
        queryFn: () => opportunitiesService.search({ pipelineId: leadPipeline?.pipelineId, filters: [{ field: 'status', operator: 'eq', value: 'open' }] }),
        enabled: !!leadPipeline?.pipelineId,
        staleTime: STALE_TIMES.LIST,
      },
      // 1: Active Clients (Buyer + Seller)
      {
        queryKey: ghl.opps({ pipelines: [buyerPipeline?.pipelineId, sellerPipeline?.pipelineId], status: 'open' }),
        queryFn: async () => {
          const [buyers, sellers] = await Promise.all([
            buyerPipeline?.pipelineId ? opportunitiesService.search({ pipelineId: buyerPipeline.pipelineId, filters: [{ field: 'status', operator: 'eq', value: 'open' }] }) : { meta: { total: 0 } },
            sellerPipeline?.pipelineId ? opportunitiesService.search({ pipelineId: sellerPipeline.pipelineId, filters: [{ field: 'status', operator: 'eq', value: 'open' }] }) : { meta: { total: 0 } },
          ]);
          return { total: (buyers.meta?.total || 0) + (sellers.meta?.total || 0) };
        },
        staleTime: STALE_TIMES.LIST,
      },
      // 2: Under Contract
      {
        queryKey: ghl.opps({ underContract: true }),
        queryFn: async () => {
          // Fallback: just search for any open opps and filter client side if stage filter is complex
          // Ideally we would filter by stage ID
          const res = await opportunitiesService.search({ filters: [{ field: 'status', operator: 'eq', value: 'open' }] });
          return { total: res.opportunities?.filter(o => {
             const pos = PipelineRegistry.stagePosition(o.pipelineStageId);
             // Assume position >= 3 is under contract, or check name
             const name = PipelineRegistry.stageLabel(o.pipelineStageId).toLowerCase();
             return name.includes('contract') || pos >= 3;
          }).length || 0 };
        },
        staleTime: STALE_TIMES.LIST,
      },
      // 3: Pending Offers
      {
        queryKey: ghl.records('real_estate_offer', { status: 'pending' }),
        queryFn: () => offersService.search({ filters: [{ field: 'status', operator: 'in', value: ['submitted', 'pending'] }] }),
        staleTime: STALE_TIMES.LIST,
      },
      // 4: New Leads (7d)
      {
        queryKey: ghl.opps({ pipelineId: leadPipeline?.pipelineId, recent: '7d' }),
        queryFn: () => {
          const sevenDaysAgo = subDays(new Date(), 7).toISOString();
          return opportunitiesService.search({ pipelineId: leadPipeline?.pipelineId, filters: [{ field: 'createdAt', operator: 'gte', value: sevenDaysAgo }] });
        },
        enabled: !!leadPipeline?.pipelineId,
        staleTime: STALE_TIMES.LIST,
      },
      // 5: Closings this month
      {
        queryKey: ghl.records('real_estate_offer', { closingThisMonth: true }),
        queryFn: () => {
          const start = startOfMonth(new Date()).toISOString();
          const end = endOfMonth(new Date()).toISOString();
          return offersService.search({ filters: [
            { field: 'status', operator: 'eq', value: 'accepted' },
            { field: 'closing_date', operator: 'gte', value: start },
            { field: 'closing_date', operator: 'lte', value: end },
          ]});
        },
        staleTime: STALE_TIMES.LIST,
      }
    ]
  });

  const isLoading = queries.some(q => q.isLoading);

  const kpis = [
    {
      title: 'Active Leads',
      value: queries[0].data?.meta?.total || queries[0].data?.opportunities?.length || 0,
      icon: Users,
      link: '/leads?status=open',
      color: 'text-info',
      bg: 'bg-info-soft',
    },
    {
      title: 'Active Clients',
      value: queries[1].data?.total || 0,
      icon: UserPlus,
      link: '/clients?status=open',
      color: 'text-brand',
      bg: 'bg-brand-soft',
    },
    {
      title: 'Under Contract',
      value: queries[2].data?.total || 0,
      icon: Home,
      link: '/transactions',
      color: 'text-warning',
      bg: 'bg-warning-soft',
    },
    {
      title: 'Pending Offers',
      value: queries[3].data?.meta?.total || queries[3].data?.records?.length || 0,
      icon: FileText,
      link: '/offers?status=pending',
      color: 'text-brand',
      bg: 'bg-brand-soft',
    },
    {
      title: 'New Leads (7d)',
      value: queries[4].data?.meta?.total || queries[4].data?.opportunities?.length || 0,
      icon: TrendingUp,
      link: '/leads?recent=7d',
      color: 'text-success',
      bg: 'bg-success-soft',
    },
    {
      title: 'Closings This Month',
      value: queries[5].data?.meta?.total || queries[5].data?.records?.length || 0,
      icon: CheckCircle,
      link: '/transactions?closing=this_month',
      color: 'text-success',
      bg: 'bg-success-soft',
    }
  ];

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0 scrollbar-hide">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="min-w-[240px] snap-start lg:min-w-0 flex-shrink-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0 scrollbar-hide">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <Link key={i} to={kpi.link} className="block min-w-[240px] snap-start lg:min-w-0 flex-shrink-0 transition-transform hover:scale-[1.02]">
            <Card className="hover:border-brand/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{kpi.title}</div>
                  <div className="text-2xl font-bold mt-1">{kpi.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
