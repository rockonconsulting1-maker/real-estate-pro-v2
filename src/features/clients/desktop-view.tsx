import React, { useState } from 'react';
import { Opportunity } from '@/types/ghl';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { ghl } from '@/lib/queryKeys';
import { useDebounce } from '@/hooks/use-query-helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Search, LayoutGrid, List as ListIcon, Filter } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import KanbanBoard from './components/kanban-board';
import ListView from './components/list-view';
import { DesktopClientDetail } from './components/desktop-client-detail';
import { NewClientSheet } from './components/new-client-sheet';
import { useParams } from 'react-router-dom';

interface DesktopViewProps {
  pipelineType: 'buyer' | 'seller';
  setPipelineType: (val: 'buyer' | 'seller') => void;
}

export default function DesktopView({ pipelineType, setPipelineType }: DesktopViewProps) {
  const { id } = useParams();
  const pipeline = PipelineRegistry.byName(pipelineType);
  
  const [view, setView] = useState<'board' | 'list'>(() => 
    (localStorage.getItem('crm_client_view') as 'board' | 'list') || 'board'
  );
  
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

  const handleViewChange = (v: 'board' | 'list') => {
    if (v) {
      setView(v);
      localStorage.setItem('crm_client_view', v);
    }
  };

  if (!pipeline) {
    return <EmptyState icon={LayoutGrid} title="Pipeline Not Found" description={`Could not resolve ${pipelineType} pipeline.`} />;
  }

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header & Controls */}
        <div className="p-6 border-b border-border bg-background flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <ToggleGroup type="single" value={pipelineType} onValueChange={(v) => v && setPipelineType(v as 'buyer' | 'seller')}>
              <ToggleGroupItem value="buyer">Buyers</ToggleGroupItem>
              <ToggleGroupItem value="seller">Sellers</ToggleGroupItem>
            </ToggleGroup>
            
            <div className="flex items-center gap-4 text-sm">
              <div><span className="text-muted-foreground">Active:</span> <span className="font-medium tabular-nums">{items.length}</span></div>
              <div><span className="text-muted-foreground">Value:</span> <span className="font-medium tabular-nums">${totalValue.toLocaleString()}</span></div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search ${pipelineType}s...`} 
                className="pl-9 bg-surface"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            <div className="flex items-center border border-border rounded-md p-1 bg-surface">
              <Toggle pressed={view === 'list'} onPressedChange={() => handleViewChange('list')} size="sm" className="h-8 px-2 data-[state=on]:bg-secondary">
                <ListIcon className="h-4 w-4" />
              </Toggle>
              <Toggle pressed={view === 'board'} onPressedChange={() => handleViewChange('board')} size="sm" className="h-8 px-2 data-[state=on]:bg-secondary">
                <LayoutGrid className="h-4 w-4" />
              </Toggle>
            <Button onClick={() => setNewClientOpen(true)}>New Client</Button>
          </div>
        </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-bg-sunk relative">
        {isLoading ? (
          <div className="p-6"><Skeleton className="w-full h-full min-h-[400px]" /></div>
        ) : (
          view === 'board' ? (
            <KanbanBoard 
              pipeline={pipeline} 
              items={items} 
              onLoadMore={() => hasNextPage && fetchNextPage()}
              hasMore={hasNextPage}
              isLoading={isFetchingNextPage}
            />
          ) : (
            <ListView 
              items={items} 
              onLoadMore={() => hasNextPage && fetchNextPage()}
              hasMore={hasNextPage}
              isLoading={isFetchingNextPage}
            />
          )
        )}
        </div>
      </div>
      
      {id && <DesktopClientDetail />}
      <NewClientSheet open={newClientOpen} onOpenChange={setNewClientOpen} defaultType={pipelineType} />
    </div>
  );
}
