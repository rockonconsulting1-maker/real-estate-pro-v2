import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { myListingsService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';
import { MobileShell } from '@/components/mobile/shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Plus } from 'lucide-react';
import { Money, StageDot } from '@/components/shared/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { NewListingModal } from './components/new-listing-sheet';

export function MobileListingsView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [newOpen, setNewOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.records('my_listings', { query: search, stage: stageFilter }),
    queryFn: async () => {
      const filters = [];
      if (stageFilter !== 'all') {
        filters.push({ field: 'listing_stage', operator: 'eq', value: stageFilter });
      }
      const res = await myListingsService.search({ query: search, filters });
      return res.records.map(r => cleanCustomObjectFields(r, 'my_listings'));
    }
  });

  return (
    <MobileShell>
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-3 shrink-0 bg-background z-10 border-b">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search listings..." 
                className="pl-9 bg-secondary/50 border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="icon" onClick={() => setNewOpen(true)} className="shrink-0 rounded-full h-10 w-10">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex space-x-2">
              <Button 
                variant={stageFilter === 'all' ? 'default' : 'secondary'} 
                size="sm" 
                className="rounded-full h-8 px-4"
                onClick={() => setStageFilter('all')}
              >
                All
              </Button>
              {['Coming Soon', 'Active', 'Pending', 'Sold'].map(stage => (
                <Button 
                  key={stage}
                  variant={stageFilter === stage ? 'default' : 'secondary'} 
                  size="sm" 
                  className="rounded-full h-8 px-4"
                  onClick={() => setStageFilter(stage)}
                >
                  {stage}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-[280px] rounded-xl w-full" />
              <Skeleton className="h-[280px] rounded-xl w-full" />
            </>
          ) : error ? (
            <ErrorState message="Failed to load listings" onRetry={() => refetch()} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="No listings found" description="Adjust filters or add a new listing." icon={Filter} />
          ) : (
            data.map(listing => (
              <MobileListingCard key={listing.id} listing={listing} onClick={() => navigate(`/listings/${listing.id}`)} />
            ))
          )}
        </div>
      </div>
      {newOpen && <NewListingModal open={newOpen} onOpenChange={setNewOpen} />}
    </MobileShell>
  );
}

function MobileListingCard({ listing, onClick }: { listing: any, onClick?: () => void }) {
  const stages = ['Coming Soon', 'Active', 'Pending', 'Sold'];
  const currentStage = listing.listing_stage || 'Active';
  const stageIndex = stages.indexOf(currentStage);

  return (
    <Card className="overflow-hidden border-2 cursor-pointer" onClick={onClick}>
      <div className="aspect-video bg-muted relative">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.address} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold shadow-sm">
          <Money amount={listing.list_price || 0} compact />
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{listing.address || listing.name || 'Unnamed Property'}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {listing.beds || '-'} bd • {listing.baths || '-'} ba • {listing.sqft || '-'} sqft
          </p>
        </div>

        {/* Stage tracking strip */}
        <div className="pt-2">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold">{currentStage}</span>
          </div>
          <div className="flex h-1.5 gap-1 rounded-full overflow-hidden">
            {stages.map((s, i) => (
              <div 
                key={s} 
                className={`flex-1 rounded-full ${i <= stageIndex ? 'bg-primary' : 'bg-secondary'}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
