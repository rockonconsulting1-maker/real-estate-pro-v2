import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { myListingsService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Columns3, Search, Map } from 'lucide-react';
import { VirtualizedTable } from '@/components/shared/virtualized';
import { Money, StageDot, MapPlaceholder } from '@/components/shared/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { NewListingModal } from './components/new-listing-sheet';

export function DesktopListingsView() {
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'table' | 'board' | 'map'>('grid');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [newOpen, setNewOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.records('my_listings', { query: search, stage: stageFilter }),
    queryFn: async () => {
      const res = await myListingsService.search({ query: search, pageLimit: 100 });
      let records = res.records.map(r => cleanCustomObjectFields(r, 'my_listings'));
      if (stageFilter !== 'all') {
        records = records.filter(r => r.listing_stage === stageFilter || r.status === stageFilter);
      }
      return records;
    }
  });

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title-desktop">My Listings</h1>
        <div className="flex items-center space-x-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)}>
            <ToggleGroupItem value="grid" aria-label="Grid View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table View"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board View"><Columns3 className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Map View"><Map className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setNewOpen(true)}>New Listing</Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search listings..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="Coming Soon">Coming Soon</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        ) : error ? (
          <ErrorState message="Failed to load listings" onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No listings found" description="Adjust filters or add a new listing." icon={LayoutGrid} />
        ) : (
          <>
            {view === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-10">
                {data.map(listing => (
                  <ListingCard key={listing.id} listing={listing} onClick={() => navigate(`/listings/${listing.id}`)} />
                ))}
              </div>
            )}
            {view === 'table' && (
              <VirtualizedTable 
                data={data}
                columns={[
                  { accessorKey: 'address', header: 'Address', cell: (info: any) => info.getValue() || 'Unnamed' },
                  { accessorKey: 'list_price', header: 'Price', cell: (info: any) => <Money amount={info.getValue() || 0} /> },
                  { accessorKey: 'listing_stage', header: 'Stage', cell: (info: any) => (
                    <div className="flex items-center space-x-2">
                      <StageDot stageId={info.getValue() || 'new'} />
                      <span className="text-sm">{info.getValue() || 'New'}</span>
                    </div>
                  )},
                  { accessorKey: 'beds', header: 'Beds', cell: (info: any) => info.getValue() || '-' },
                  { accessorKey: 'baths', header: 'Baths', cell: (info: any) => info.getValue() || '-' },
                  { accessorKey: 'dom', header: 'DOM', cell: (info: any) => info.getValue() || '0' },
                ]}
                onRowClick={(row) => navigate(`/listings/${row.id}`)}
              />
            )}
            {view === 'board' && (
              <div className="flex h-full overflow-x-auto space-x-4 pb-4">
                {['Coming Soon', 'Active', 'Pending', 'Sold'].map(stage => (
                  <div key={stage} className="flex-shrink-0 w-80 bg-secondary/30 rounded-xl p-4 flex flex-col">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">{stage}</h3>
                    <div className="space-y-3 overflow-y-auto flex-1">
                      {data.filter(l => (l.listing_stage || 'Active') === stage).map(listing => (
                        <ListingCard key={listing.id} listing={listing} compact onClick={() => navigate(`/listings/${listing.id}`)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === 'map' && (
              <div className="h-full w-full relative pb-10">
                <MapPlaceholder className="absolute inset-0" />
              </div>
            )}
          </>
        )}
      </div>
      {newOpen && <NewListingModal open={newOpen} onOpenChange={setNewOpen} />}
    </div>
  );
}

function ListingCard({ listing, compact, onClick }: { listing: any, compact?: boolean, onClick?: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      {!compact && (
        <div className="aspect-video bg-muted relative">
          {listing.image_url ? (
            <img src={listing.image_url} alt={listing.address} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Image</div>
          )}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium border">
            {listing.listing_stage || 'Active'}
          </div>
        </div>
      )}
      <CardContent className="p-4">
        {compact && (
           <div className="text-xs font-medium text-muted-foreground mb-1">{listing.listing_stage || 'Active'}</div>
        )}
        <h3 className="font-semibold truncate">{listing.address || listing.name || 'Unnamed Property'}</h3>
        <div className="text-lg font-bold mt-1">
          <Money amount={listing.list_price || 0} />
        </div>
        <div className="flex items-center space-x-3 mt-3 text-sm text-muted-foreground">
          <span>{listing.beds || '-'} bd</span>
          <span>{listing.baths || '-'} ba</span>
          <span>{listing.sqft || '-'} sqft</span>
        </div>
      </CardContent>
    </Card>
  );
}
