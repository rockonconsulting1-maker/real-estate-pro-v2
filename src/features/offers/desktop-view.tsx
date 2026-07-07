import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { offersService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { VirtualizedTable } from '@/components/shared/virtualized';
import { Money, Countdown, StatusChip } from '@/components/shared/primitives';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-query-helpers';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { NewOfferModal } from './components/new-offer-sheet';

export function DesktopOffersView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.records('real_estate_offer', { query: debouncedSearch }),
    queryFn: async () => {
      const res = await offersService.search({ query: debouncedSearch, pageLimit: 100 });
      let records = res.records.map(r => cleanCustomObjectFields(r, 'real_estate_offer'));
      if (statusFilter !== 'all') {
        records = records.filter(r => r.status === statusFilter || r.offer_status === statusFilter);
      }
      return records;
    },
  });

  const columns = [
    {
      header: 'Property / ID',
      accessorKey: 'id',
      cell: (item: any) => (
        <div>
          <div className="font-medium text-body-desktop">{item.property_address || item.name || 'Unknown Property'}</div>
          <div className="text-meta">{item.id.substring(0, 8)}</div>
        </div>
      )
    },
    {
      header: 'Offer Price',
      accessorKey: 'offer_price',
      cell: (item: any) => (
        <div className="font-semibold text-primary">
          <Money amount={item.offer_price || 0} />
        </div>
      )
    },
    {
      header: 'Deposit',
      accessorKey: 'deposit_amount',
      cell: (item: any) => <Money amount={item.deposit_amount || 0} />
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item: any) => <StatusChip status={item.status || 'pending'} label={item.status || 'Pending'} />
    },
    {
      header: 'Irrevocable',
      accessorKey: 'irrevocable_until',
      cell: (item: any) => {
        if (!item.irrevocable_until) return '-';
        return <Countdown targetDate={item.irrevocable_until} dangerThresholdHours={24} />;
      }
    },
    {
      header: 'Closing Date',
      accessorKey: 'closing_date',
      cell: (item: any) => item.closing_date ? format(new Date(item.closing_date), 'MMM d, yyyy') : '-'
    },
    {
      header: 'Conditions',
      accessorKey: 'conditions_deadline',
      cell: (item: any) => item.conditions_deadline ? format(new Date(item.conditions_deadline), 'MMM d') : '-'
    }
  ];

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex-none p-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-page-title-desktop">Offers</h1>
            <Button onClick={() => setIsNewOfferOpen(true)}>New Offer</Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search offers..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="countered">Countered</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState message="Failed to load offers" onRetry={() => refetch()} />
            </div>
          ) : (
            <VirtualizedTable<any>
              data={data || []}
              columns={columns as any}
              onRowClick={(item) => navigate(`/offers/${item.id}`)}
            />
          )}
        </div>
      </div>
      <NewOfferModal open={isNewOfferOpen} onOpenChange={setIsNewOfferOpen} />
    </>
  );
}
