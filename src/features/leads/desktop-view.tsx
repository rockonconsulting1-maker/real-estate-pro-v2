import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LayoutGrid, List as ListIcon, X } from 'lucide-react';
import { LeadsListView } from './components/list-view';
import { LeadsKanbanView } from './components/kanban-board';
import { DesktopLeadDetail } from './components/desktop-detail';
import { NewLeadSheet } from './components/new-lead-sheet';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Opportunity } from '@/types/ghl';
import { ghl } from '@/lib/queryKeys';

export function LeadsDesktopView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Persisted view toggle
  const [view, setView] = useState<'list' | 'board'>(() => {
    return (localStorage.getItem('rc_leads_view') as 'list' | 'board') || 'list';
  });
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rc_leads_view', view);
  }, [view]);

  // Filters
  const q = searchParams.get('q') || '';
  const role = searchParams.get('role') || 'all'; // all, buyer, seller
  const temp = searchParams.get('temp') || ''; // hot,warm,cold
  const source = searchParams.get('source') || '';
  const assignedTo = searchParams.get('assignedTo') || '';
  const stage = searchParams.get('stage') || '';

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        setSearchParams(prev => {
          if (searchInput) prev.set('q', searchInput);
          else prev.delete('q');
          return prev;
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, setSearchParams]);

  const leadPipeline = PipelineRegistry.byName('lead');

  const updateFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value && value !== 'all') prev.set(key, value);
      else prev.delete(key);
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  const hasActiveFilters = q || role !== 'all' || temp || source || assignedTo || stage;

  // Build filters for GHL
  const ghlFilters = [];
  if (q) ghlFilters.push({ field: 'query', operator: 'eq', value: q });
  // Note: Some filters like role (contact.type) might need to be applied client-side if GHL opportunities search doesn't support deep filtering on contact custom fields, or we pass them as params if it does.
  // We'll pass them down and let the hook handle it or filter client side.
  
  const queryParams = {
    pipelineId: leadPipeline?.pipelineId,
    q: q || undefined,
    filters: ghlFilters,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useGhlInfinite<Opportunity>(
    Array.from(ghl.opps(queryParams)),
    async (pageParam) => {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const res = await opportunitiesService.search({
        ...queryParams,
        page
      });
      const nextCursor = res.meta?.nextPageUrl ? String(page + 1) : null;
      return { data: res.opportunities, nextCursor };
    }
  );

  // Flatten data
  const opportunities = data?.pages.flatMap(p => p.data) || [];

  // Client side filtering for custom fields / tags if API doesn't support it directly in search
  const filteredOpps = opportunities.filter(opp => {
    const tags = (opp.contact as any)?.tags || [];
    // Role filter
    if (role !== 'all') {
      const hasRole = tags.includes(`role:${role}`);
      if (!hasRole) return false;
    }
    // Temp filter
    if (temp) {
      const temps = temp.split(',');
      const hasTemp = temps.some(t => tags.includes(`temperature:${t}`));
      if (!hasTemp) return false;
    }
    return true;
  });

  const activeCount = filteredOpps.length;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Topbar / Filters */}
      <div className="flex-none p-4 border-b border-border bg-surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-page-title hidden lg:block">Leads</h1>
            
            <Button onClick={() => setNewLeadOpen(true)} className="rounded-full shadow-none">
              New Lead
            </Button>

            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            <ToggleGroup type="single" value={role} onValueChange={(v) => v && updateFilter('role', v)}>
              <ToggleGroupItem value="all" className="text-xs px-3 h-8">All</ToggleGroupItem>
              <ToggleGroupItem value="buyer" className="text-xs px-3 h-8">Buyers</ToggleGroupItem>
              <ToggleGroupItem value="seller" className="text-xs px-3 h-8">Sellers</ToggleGroupItem>
            </ToggleGroup>

            {/* Temp chips */}
            <div className="flex gap-1">
              {['hot', 'warm', 'cold'].map(t => {
                const isActive = temp.includes(t);
                return (
                  <Badge 
                    key={t}
                    variant={isActive ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => {
                      const current = temp ? temp.split(',') : [];
                      const next = isActive ? current.filter(x => x !== t) : [...current, t];
                      updateFilter('temp', next.join(','));
                    }}
                  >
                    {t}
                  </Badge>
                );
              })}
            </div>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-8 px-2">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {activeCount} leads
            </div>
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 shadow-none"
                onClick={() => setView('list')}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'board' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 shadow-none"
                onClick={() => setView('board')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {id ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={30} className="border-r border-border">
              {view === 'list' ? (
                <LeadsListView 
                  data={filteredOpps} 
                  onRowClick={(opp) => navigate(`/leads/${opp.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}
                  activeId={id}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              ) : (
                <LeadsKanbanView 
                  data={filteredOpps}
                  pipelineId={leadPipeline?.pipelineId}
                  onCardClick={(opp) => navigate(`/leads/${opp.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}
                  activeId={id}
                />
              )}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full bg-background overflow-hidden relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 z-10 rounded-full" 
                  onClick={() => navigate(`/leads${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <DesktopLeadDetail opportunityId={id} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full">
            {view === 'list' ? (
              <LeadsListView 
                data={filteredOpps} 
                onRowClick={(opp) => navigate(`/leads/${opp.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            ) : (
              <LeadsKanbanView 
                data={filteredOpps}
                pipelineId={leadPipeline?.pipelineId}
                onCardClick={(opp) => navigate(`/leads/${opp.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}
              />
            )}
          </div>
        )}
      </div>
      <NewLeadSheet open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}
