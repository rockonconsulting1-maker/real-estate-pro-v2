import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ghl } from '@/lib/queryKeys';
import { mlsPropertiesService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { Input } from '@/components/ui/input';
import { Search, Filter, Map, List } from 'lucide-react';
import { Money, MapPlaceholder } from '@/components/shared/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-query-helpers';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function MobileMlsView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const debouncedSearch = useDebounce(search, 300);
  
  // Filters
  const [propertyType, setPropertyType] = useState('all');
  const [status, setStatus] = useState('all');
  const [beds, setBeds] = useState('all');
  const [baths, setBaths] = useState('all');
  const [sort, setSort] = useState('newest');

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGhlInfinite(
    ghl.records('properties', { query: debouncedSearch, propertyType, status, beds, baths, sort }) as unknown as any[],
    async (pageParam: string) => {
      const res = await mlsPropertiesService.search({ 
        query: debouncedSearch, 
        pageLimit: 100,
        searchAfter: pageParam ? [pageParam] : undefined
      });
      
      let records = res.records.map(r => cleanCustomObjectFields(r, 'properties'));
      
      if (propertyType !== 'all') records = records.filter(r => r.property_type === propertyType);
      if (status !== 'all') records = records.filter(r => r.property_status === status);
      if (beds !== 'all') records = records.filter(r => (r.property_beds || 0) >= Number(beds));
      if (baths !== 'all') records = records.filter(r => (r.property_baths || 0) >= Number(baths));
      
      // Client-side sort for now (will only sort current page, which is a limitation without backend sort)
      if (sort === 'price_asc') records.sort((a, b) => (a.property_price || 0) - (b.property_price || 0));
      if (sort === 'price_desc') records.sort((a, b) => (b.property_price || 0) - (a.property_price || 0));
      if (sort === 'dom') records.sort((a, b) => (a.property_dom || 0) - (b.property_dom || 0));

      return {
        data: records,
        nextCursor: (res.meta?.nextPageUrl ? res.meta.startAfter : "") as string
      };
    }
  );

  const flatData = data?.pages.flatMap(p => p.data) || [];
  const totalCount = data?.pages[0]?.data.length ? 'Results found' : '0 results'; // We don't have total from infinite easily

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-3 bg-background border-b z-10 sticky top-0">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="City, Zip, or MLS#" 
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon" onClick={() => setView(view === 'list' ? 'map' : 'list')} className="h-10 w-10 shrink-0">
              {view === 'list' ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Filter Properties</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Property Type</label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Single Family">Single Family</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Beds (Min)</label>
                      <Select value={beds} onValueChange={setBeds}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Baths (Min)</label>
                      <Select value={baths} onValueChange={setBaths}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="dom">Days on Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="text-xs text-muted-foreground font-medium pl-1">
            {isLoading ? 'Searching...' : totalCount}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
            ))
          ) : error ? (
            <ErrorState message="Failed to load properties" onRetry={() => refetch()} />
          ) : flatData.length === 0 ? (
            <EmptyState title="No properties found" description="Adjust filters or try a different search." icon={Search} />
          ) : (
            <>
              {view === 'list' ? (
                <>
                  {flatData.map((property: any) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      onClick={() => navigate(`/mls/${property.id}`)} 
                    />
                  ))}
                  
                  {hasNextPage && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4" 
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                    </Button>
                  )}
                </>
              ) : (
                <div className="h-full w-full min-h-[400px] relative">
                  <MapPlaceholder className="absolute inset-0" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property, onClick }: { property: any, onClick?: () => void }) {
  return (
    <Card className="overflow-hidden shadow-sm active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="aspect-video bg-muted relative">
        {property.property_images && property.property_images.length > 0 ? (
          <img src={property.property_images[0]} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold border shadow-sm">
          {property.property_status || 'Active'}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-base leading-tight truncate pr-2">{property.name || 'Unnamed Property'}</h3>
          <div className="text-base font-bold text-brand shrink-0">
            <Money amount={property.property_price || 0} compact />
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate mb-3">{property.property_city}, {property.property_state} {property.property_zip}</p>
        <div className="flex items-center space-x-4 text-sm font-medium">
          <div className="flex items-center text-muted-foreground"><span className="text-foreground mr-1">{property.property_beds || '-'}</span> bds</div>
          <div className="flex items-center text-muted-foreground"><span className="text-foreground mr-1">{property.property_baths || '-'}</span> ba</div>
          <div className="flex items-center text-muted-foreground"><span className="text-foreground mr-1">{property.property_sqft || '-'}</span> sqft</div>
        </div>
      </CardContent>
    </Card>
  );
}
