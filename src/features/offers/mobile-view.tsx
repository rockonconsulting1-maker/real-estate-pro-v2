import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { offersService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { Money, Countdown, StatusChip } from '@/components/shared/primitives';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-query-helpers';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewOfferModal } from './components/new-offer-sheet';

export function MobileOffersView() {
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

  const statuses = ['all', 'pending', 'submitted', 'accepted', 'countered', 'declined'];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search offers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>

        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-2 scrollbar-hide">
          {statuses.map(status => (
            <Badge
              key={status}
              variant={statusFilter === status ? 'default' : 'secondary'}
              className="px-4 py-1.5 whitespace-nowrap cursor-pointer touch-target"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 pb-24">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : error ? (
            <ErrorState message="Failed to load offers" onRetry={() => refetch()} />
          ) : data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No offers found matching your criteria.
            </div>
          ) : (
            data?.map((offer) => {
              const isUrgent = offer.irrevocable_until && 
                (new Date(offer.irrevocable_until).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 &&
                (new Date(offer.irrevocable_until).getTime() - new Date().getTime()) > 0;

              return (
                <Card 
                  key={offer.id} 
                  className={`p-4 rounded-xl border-border/50 shadow-sm active:scale-[0.98] transition-transform ${isUrgent ? 'border-warning/50 bg-warning/5' : ''}`}
                  onClick={() => navigate(`/offers/${offer.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-body-mobile line-clamp-1">
                        {offer.property_address || offer.name || 'Unknown Property'}
                      </div>
                      <div className="text-meta">ID: {offer.id.substring(0, 8)}</div>
                    </div>
                    <StatusChip status={offer.status || 'pending'} label={offer.status || 'Pending'} />
                  </div>
                  
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <div className="text-xl font-bold text-primary tabular-nums">
                        <Money amount={offer.offer_price || 0} compact />
                      </div>
                      {offer.closing_date && (
                        <div className="text-meta mt-1">
                          Closes {format(new Date(offer.closing_date), 'MMM d')}
                        </div>
                      )}
                    </div>
                    
                    {offer.irrevocable_until && (
                      <div className="text-right">
                        <div className="text-eyebrow text-muted-foreground mb-1">Irrevocable</div>
                        <Countdown targetDate={offer.irrevocable_until} dangerThresholdHours={24} />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
      
      <div className="fixed bottom-safe-with-nav right-4 z-50">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsNewOfferOpen(true)}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      <NewOfferModal open={isNewOfferOpen} onOpenChange={setIsNewOfferOpen} />
    </div>
  );
}
