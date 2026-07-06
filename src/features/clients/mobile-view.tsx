import React, { useState } from 'react';
import { Opportunity } from '@/types/ghl';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { useDebounce } from '@/hooks/use-query-helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Search, LayoutGrid, Filter } from 'lucide-react';
import MobileKanban from './components/mobile-kanban';
import { MobileClientDetail } from './components/mobile-client-detail';
import { useParams } from 'react-router-dom';
import { NewClientSheet } from './components/new-client-sheet';
import { Button } from '@/components/ui/button';

interface MobileViewProps {
  pipelineType: 'buyer' | 'seller';
  setPipelineType: (val: 'buyer' | 'seller') => void;
}

export default function MobileView({ pipelineType, setPipelineType }: MobileViewProps) {
  const { id } = useParams();
  const pipeline = PipelineRegistry.byName(pipelineType);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const queryParams = {
    pipelineId: pipeline?.id,
    q: debouncedSearch || undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useGhlInfinite<Opportunity>(
    Array.from(ghl.opps(queryParams)),
    async (pageParam) => {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const res = await opportunitiesService.search({
        ...queryParams,
        pipelineId: queryParams.pipelineId!,
        limit: 50,
        page
      });
      const nextCursor = res.meta?.nextPageUrl ? String(page + 1) : null;
      return { data: res.opportunities, nextCursor };
    }
  );

  const items = data?.pages.flatMap(p => p.data) || [];
  const totalValue = items.reduce((sum, item) => sum + ((item as any).monetaryValue || 0), 0);

  if (!pipeline) {
    return <EmptyState icon={LayoutGrid} title="Pipeline Not Found" description={`Could not resolve ${pipelineType} pipeline.`} />;
  }

  return (
    <div className="flex flex-col h-full bg-bg-sunk">
      <div className="bg-background border-b border-border p-4 flex flex-col gap-4 shrink-0">
        <ToggleGroup type="single" value={pipelineType} onValueChange={(v) => v && setPipelineType(v as 'buyer' | 'seller')} className="w-full justify-start">
          <ToggleGroupItem value="buyer" className="flex-1">Buyers</ToggleGroupItem>
          <ToggleGroupItem value="seller" className="flex-1">Sellers</ToggleGroupItem>
        </ToggleGroup>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-surface"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="touch-target border border-border rounded-md bg-surface text-foreground">
            <Filter className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">{items.length} Active</span>
            <span className="mx-2">•</span>
            <span className="font-semibold tabular-nums">${totalValue.toLocaleString()}</span>
          </div>
          <Button size="sm" onClick={() => setNewClientOpen(true)}>New Client</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <MobileKanban 
            pipeline={pipeline} 
            items={items} 
            onLoadMore={() => hasNextPage && fetchNextPage()}
            hasMore={hasNextPage}
            isLoading={isFetchingNextPage}
          />
        )}
      </div>
      {id && <MobileClientDetail />}
      <NewClientSheet open={newClientOpen} onOpenChange={setNewClientOpen} defaultType={pipelineType} />
    </div>
  );
}
