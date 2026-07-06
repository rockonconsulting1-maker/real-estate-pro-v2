import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Search, List as ListIcon, LayoutGrid, Check, Trash2, CalendarClock, Phone, MessageSquare, ChevronDown, ChevronRight, RefreshCcw, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SwipeRow } from '@/components/mobile/swipe-row';
import { NewLeadSheet } from './components/new-lead-sheet';
import { Avatar, StageDot, Money, RoleBadge, TempBadge } from '@/components/shared/primitives';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { ghl } from '@/lib/queryKeys';
import { Opportunity } from '@/types/ghl';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function LeadsMobileView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Persisted view toggle
  const [view, setView] = useState<'list' | 'board'>(() => {
    return (localStorage.getItem('rc_leads_view_mobile') as 'list' | 'board') || 'list';
  });
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rc_leads_view_mobile', view);
  }, [view]);

  // Filters
  const q = searchParams.get('q') || '';
  const role = searchParams.get('role') || 'all';
  const temp = searchParams.get('temp') || '';
  
  const [searchInput, setSearchInput] = useState(q);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0) {
      const y = e.touches[0].clientY;
      const dy = y - touchStartY.current;
      if (dy > 0 && dy < 150) {
        setPullY(dy);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 80) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullY(0);
    touchStartY.current = 0;
  };

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

  const queryParams = {
    pipelineId: leadPipeline?.pipelineId,
    q: q || undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useGhlInfinite<Opportunity>(
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

  const opportunities = data?.pages.flatMap(p => p.data) || [];

  const filteredOpps = opportunities.filter(opp => {
    if (role !== 'all') {
      const hasRole = (opp.contact as any)?.tags?.includes(`role:${role}`);
      if (!hasRole) return false;
    }
    if (temp) {
      const temps = temp.split(',');
      const hasTemp = temps.some(t => (opp.contact as any)?.tags?.includes(`temperature:${t}`));
      if (!hasTemp) return false;
    }
    return true;
  });

  const handleSwipeRight = async (opp: Opportunity) => {
    try {
      await opportunitiesService.updateStatus(opp.id, 'won');
      toast.success('Lead marked as won');
      refetch();
    } catch (e) {
      toast.error('Failed to update lead');
    }
  };

  const handleSwipeLeft = async (opp: Opportunity) => {
    if (confirm('Delete this lead?')) {
      try {
        await opportunitiesService.delete(opp.id);
        toast.success('Lead deleted');
        refetch();
      } catch (e) {
        toast.error('Failed to delete lead');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background pb-20">
      <div className="p-4 border-b border-border bg-surface sticky top-0 z-20 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title-mobile">Leads</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setNewLeadOpen(true)}>
              <Plus className="w-5 h-5" />
            </Button>
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

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9 bg-background h-10"
          />
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <ToggleGroup type="single" value={role} onValueChange={(v) => v && updateFilter('role', v)}>
              <ToggleGroupItem value="all" className="text-xs px-3 h-8 rounded-full">All</ToggleGroupItem>
              <ToggleGroupItem value="buyer" className="text-xs px-3 h-8 rounded-full">Buyers</ToggleGroupItem>
              <ToggleGroupItem value="seller" className="text-xs px-3 h-8 rounded-full">Sellers</ToggleGroupItem>
            </ToggleGroup>
            
            <div className="w-px h-8 bg-border mx-1" />
            
            {['hot', 'warm', 'cold'].map(t => {
              const isActive = temp.includes(t);
              return (
                <Badge 
                  key={t}
                  variant={isActive ? 'default' : 'outline'}
                  className="cursor-pointer capitalize h-8 rounded-full px-3"
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
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      <div 
        className="flex-1 overflow-y-auto relative"
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {pullY > 0 && (
          <div 
            className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden transition-all text-muted-foreground"
            style={{ height: pullY, opacity: pullY / 100 }}
          >
            <RefreshCcw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }} />
          </div>
        )}
        
        <div style={{ transform: `translateY(${isRefreshing ? 60 : 0}px)`, transition: isRefreshing ? 'transform 0.2s' : 'none' }}>
          {view === 'list' ? (
            <div className="divide-y divide-border">
              {filteredOpps.map(opp => {
                const tags = (opp.contact as any)?.tags || [];
                let temp: 'hot' | 'warm' | 'cold' | undefined;
                if (tags.includes('temperature:hot')) temp = 'hot';
                else if (tags.includes('temperature:warm')) temp = 'warm';
                else if (tags.includes('temperature:cold')) temp = 'cold';

                let role: 'buyer' | 'seller' | 'investor' | undefined;
                if (tags.includes('role:buyer')) role = 'buyer';
                else if (tags.includes('role:seller')) role = 'seller';
                else if (tags.includes('role:investor')) role = 'investor';

                return (
                  <SwipeRow
                    key={opp.id}
                    onSwipeRight={() => handleSwipeRight(opp)}
                    leftActionNode={
                      <div className="text-success flex items-center font-medium">
                        <Check className="w-5 h-5 mr-2" /> Won
                      </div>
                    }
                    rightActionNode={
                      <div className="flex items-stretch h-full">
                        <div 
                          className="bg-warning/20 text-warning px-4 flex flex-col justify-center items-center active:bg-warning/30"
                          onClick={() => { /* Open Reschedule Sheet */ }}
                        >
                          <CalendarClock className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-medium">Reschedule</span>
                        </div>
                        <div 
                          className="bg-destructive/20 text-destructive px-4 flex flex-col justify-center items-center active:bg-destructive/30"
                          onClick={() => handleSwipeLeft(opp)}
                        >
                          <Trash2 className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-medium">Delete</span>
                        </div>
                      </div>
                    }
                  >
                    <div 
                      className="p-4 flex flex-col gap-3 active:bg-muted"
                      onClick={() => navigate(`/leads/${opp.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={opp.name || (opp.contact as any)?.contactName || 'Unknown'} className="w-12 h-12" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium truncate text-[16px]">{opp.name || (opp.contact as any)?.contactName || 'Unknown'}</div>
                            {role && <RoleBadge role={role} />}
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <StageDot stageId={opp.pipelineStageId} />
                              <span className="truncate max-w-[100px]">{PipelineRegistry.stageLabel(opp.pipelineStageId)}</span>
                            </div>
                            {opp.monetaryValue ? <Money amount={opp.monetaryValue} className="font-semibold text-foreground" compact /> : <span>--</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          {temp && <TempBadge temp={temp} />}
                          <span className="text-xs text-muted-foreground">
                            {opp.updatedAt ? formatDistanceToNow(new Date(opp.updatedAt), { addSuffix: true }) : ''}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full shadow-none" asChild>
                            <a href={`tel:${(opp.contact as any)?.phone || ''}`}>
                              <Phone className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full shadow-none" onClick={() => navigate(`/conversations/new?contactId=${opp.contactId}`)}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SwipeRow>
                );
              })}
              
              {hasNextPage && (
                <div className="p-4 flex justify-center">
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3 pb-8">
              {leadPipeline?.stages.map(stage => {
                const stageOpps = filteredOpps.filter(o => o.pipelineStageId === stage.id);
                if (stageOpps.length === 0) return null;
                
                const totalValue = stageOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
                
                return (
                  <Collapsible key={stage.id} defaultOpen className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/50 active:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <StageDot stageId={stage.id} />
                        <span className="font-semibold">{stage.name}</span>
                        <span className="text-muted-foreground text-sm font-medium bg-background px-2 py-0.5 rounded-full border border-border/50">{stageOpps.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Money amount={totalValue} className="text-sm font-medium" compact />
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="p-3 bg-muted/30">
                      <div className="space-y-2">
                        {stageOpps.map(opp => (
                          <div 
                            key={opp.id} 
                            className="bg-surface p-3 rounded-lg shadow-sm border border-border active:border-brand/50 transition-colors"
                            onClick={() => navigate(`/leads/${opp.id}`)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium truncate pr-2 text-[15px]">{opp.name || (opp.contact as any)?.contactName || 'Unknown'}</div>
                              <Money amount={opp.monetaryValue || 0} className="text-[14px] font-semibold" compact />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Avatar name={opp.name || (opp.contact as any)?.contactName || 'Unknown'} className="w-6 h-6 text-[10px]" />
                                <span>{opp.createdAt ? formatDistanceToNow(new Date(opp.createdAt)) : ''}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <NewLeadSheet open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}
