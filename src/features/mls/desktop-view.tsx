import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { mlsPropertiesService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';
import { DesktopShell } from '@/components/desktop/shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Search } from 'lucide-react';
import { VirtualizedTable } from '@/components/shared/virtualized';
import { Money } from '@/components/shared/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-query-helpers';

export function DesktopMlsView() {
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  
  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [propertyType, setPropertyType] = useState('all');
  const [status, setStatus] = useState('all');
  const [beds, setBeds] = useState('all');
  const [baths, setBaths] = useState('all');
  const [sort, setSort] = useState('newest');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.records('properties', { 
      query: debouncedSearch, 
      propertyType, 
      status, 
      beds, 
      baths,
      sort
    }),
    queryFn: async () => {
      const filters = [];
      if (propertyType !== 'all') filters.push({ field: 'property_type', operator: 'eq', value: propertyType });
      if (status !== 'all') filters.push({ field: 'property_status', operator: 'eq', value: status });
      if (beds !== 'all') filters.push({ field: 'property_beds', operator: 'gte', value: Number(beds) });
      if (baths !== 'all') filters.push({ field: 'property_baths', operator: 'gte', value: Number(baths) });
      
      // We would ideally pass sort to the API, but GHL custom objects API might not support complex sorting.
      // We'll pass it if supported, or sort client-side.
      
      const res = await mlsPropertiesService.search({ query: debouncedSearch, filters });
      
      let records = res.records.map(r => cleanCustomObjectFields(r, 'properties'));
      
      // Client-side sort for now
      if (sort === 'price_asc') records.sort((a, b) => (a.property_price || 0) - (b.property_price || 0));
      if (sort === 'price_desc') records.sort((a, b) => (b.property_price || 0) - (a.property_price || 0));
      if (sort === 'dom') records.sort((a, b) => (a.property_dom || 0) - (b.property_dom || 0));
      
      return { records, total: res.meta?.total || records.length };
    }
  });

  return (
    <DesktopShell>
      <div className="h-full flex flex-col p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-page-title-desktop">MLS Search</h1>
            {data && <span className="text-muted-foreground text-sm">{data.total} results</span>}
          </div>
          <div className="flex items-center space-x-2">
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)}>
              <ToggleGroupItem value="grid" aria-label="Grid View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table View"><List className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Advanced Filter Bar */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="City, Zip, or MLS#" 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Single Family">Single Family</SelectItem>
              <SelectItem value="Condo">Condo</SelectItem>
              <SelectItem value="Townhouse">Townhouse</SelectItem>
              <SelectItem value="Multi-Family">Multi-Family</SelectItem>
              <SelectItem value="Land">Land</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={beds} onValueChange={setBeds}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Beds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Beds</SelectItem>
              <SelectItem value="1">1+ Beds</SelectItem>
              <SelectItem value="2">2+ Beds</SelectItem>
              <SelectItem value="3">3+ Beds</SelectItem>
              <SelectItem value="4">4+ Beds</SelectItem>
              <SelectItem value="5">5+ Beds</SelectItem>
            </SelectContent>
          </Select>
          <Select value={baths} onValueChange={setBaths}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Baths" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Baths</SelectItem>
              <SelectItem value="1">1+ Baths</SelectItem>
              <SelectItem value="2">2+ Baths</SelectItem>
              <SelectItem value="3">3+ Baths</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px] ml-auto">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="dom">Days on Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Skeleton className="h-[300px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
            </div>
          ) : error ? (
            <ErrorState message="Failed to load properties" onRetry={() => refetch()} />
          ) : !data || data.records.length === 0 ? (
            <EmptyState title="No properties found" description="Try adjusting your filters or search term." icon={Search} />
          ) : (
            <>
              {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-10">
                  {data.records.map(property => (
                    <PropertyCard key={property.id} property={property} onClick={() => navigate(`/mls/${property.id}`)} />
                  ))}
                </div>
              )}
              {view === 'table' && (
                <VirtualizedTable 
                  data={data.records}
                  columns={[
                    { accessorKey: 'name', header: 'Address', cell: (info: any) => info.getValue() || 'Unnamed' },
                    { accessorKey: 'property_city', header: 'City', cell: (info: any) => info.getValue() || '-' },
                    { accessorKey: 'property_price', header: 'Price', cell: (info: any) => <Money amount={info.getValue() || 0} /> },
                    { accessorKey: 'property_status', header: 'Status', cell: (info: any) => (
                      <span className="text-sm border px-2 py-1 rounded-md">{info.getValue() || 'Active'}</span>
                    )},
                    { accessorKey: 'property_beds', header: 'Beds', cell: (info: any) => info.getValue() || '-' },
                    { accessorKey: 'property_baths', header: 'Baths', cell: (info: any) => info.getValue() || '-' },
                    { accessorKey: 'property_dom', header: 'DOM', cell: (info: any) => info.getValue() || '0' },
                  ]}
                  onRowClick={(row) => navigate(`/mls/${row.id}`)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

function PropertyCard({ property, onClick }: { property: any, onClick?: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="aspect-video bg-muted relative">
        {property.property_images && property.property_images.length > 0 ? (
          <img src={property.property_images[0]} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium border">
          {property.property_status || 'Active'}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{property.name || 'Unnamed Property'}</h3>
        <p className="text-sm text-muted-foreground truncate">{property.property_city}, {property.property_state} {property.property_zip}</p>
        <div className="text-lg font-bold mt-2">
          <Money amount={property.property_price || 0} />
        </div>
        <div className="flex items-center space-x-3 mt-3 text-sm text-muted-foreground">
          <span>{property.property_beds || '-'} bd</span>
          <span>{property.property_baths || '-'} ba</span>
          <span>{property.property_sqft || '-'} sqft</span>
        </div>
      </CardContent>
    </Card>
  );
}
