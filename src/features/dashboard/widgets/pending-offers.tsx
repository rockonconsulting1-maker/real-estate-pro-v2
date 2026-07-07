import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { offersService } from '@/lib/ghl/services/objects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Money, StatusChip, Countdown } from '@/components/shared/primitives';

export function PendingOffersWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ghl.records('real_estate_offer', { status: 'pending', sort: 'createdAt_desc', limit: 5 }),
    queryFn: () => offersService.search({ pageLimit: 100 }), // Filter client-side since API may reject complex filters
    staleTime: STALE_TIMES.LIST,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">Pending Offers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const offers = (data?.records || [])
    .filter(o => {
      const status = (o.customFields as any)?.status || o.name?.toLowerCase();
      return status?.includes('submitted') || status?.includes('pending');
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">Pending Offers</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          No pending offers.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-header">Pending Offers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {offers.map(offer => (
            <div key={offer.id} className="p-4 hover:bg-muted/10 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <Link to={`/offers/${offer.id}`} className="font-medium text-sm hover:underline">
                  {offer.name || 'Unnamed Offer'}
                </Link>
                <Money amount={(offer.customFields as any)?.offer_amount || 0} compact className="font-semibold text-sm text-brand" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <StatusChip status="warning" label="Pending" />
                {(offer.customFields as any)?.irrevocable_until && (
                  <div className="text-muted-foreground flex items-center gap-1">
                    Expires in <Countdown targetDate={(offer.customFields as any).irrevocable_until} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
