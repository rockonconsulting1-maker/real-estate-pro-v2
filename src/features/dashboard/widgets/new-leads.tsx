import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { TempBadge, Avatar } from '@/components/shared/primitives';
import { formatDistanceToNow } from 'date-fns';

export function NewLeadsWidget() {
  const leadPipeline = PipelineRegistry.byName('lead');

  const { data, isLoading } = useQuery({
    queryKey: ghl.opps({ pipelineId: leadPipeline?.pipelineId, sort: 'createdAt_desc', limit: 5 }),
    queryFn: () => opportunitiesService.search({ pipelineId: leadPipeline?.pipelineId }), // GHL doesn't have a direct sort, we'll sort client side
    enabled: !!leadPipeline?.pipelineId,
    staleTime: STALE_TIMES.LIST,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">New Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const leads = (data?.opportunities || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">New Leads</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          No recent leads.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-header">New Leads</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {leads.map(lead => (
            <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar name={lead.name} className="w-8 h-8" />
                <div>
                  <Link to={`/leads/${lead.id}`} className="font-medium text-sm hover:underline">
                    {String(lead.name)}
                  </Link>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{String(lead.source || 'Direct')}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <TempBadge temp="warm" /> {/* Defaulting to warm as we don't have a temp field in standard opp */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
