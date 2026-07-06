import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { objectsService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';
import { MobileShell } from '@/components/mobile/shell';
import { Money, Countdown, StatusChip } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ArrowLeft, Check, X, FileEdit, Clock, Home, User } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { NewOfferModal } from './new-offer-sheet';
import { useState } from 'react';

export function MobileOfferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCounterOpen, setIsCounterOpen] = useState(false);

  const { data: offer, isLoading, error } = useQuery({
    queryKey: ghl.record('real_estate_offer', id!),
    queryFn: async () => {
      const res = await objectsService.getRecord('real_estate_offer', id!);
      return cleanCustomObjectFields(res, 'real_estate_offer');
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      return objectsService.updateRecord('real_estate_offer', id!, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.record('real_estate_offer', id!) });
      queryClient.invalidateQueries({ queryKey: ghl.records('real_estate_offer', {}) });
      toast({ title: 'Offer status updated' });
    }
  });

  if (isLoading) {
    return (
      <MobileShell>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </MobileShell>
    );
  }

  if (error || !offer) {
    return (
      <MobileShell>
        <div className="p-4">
          <ErrorState message="Failed to load offer details" onRetry={() => window.location.reload()} />
        </div>
      </MobileShell>
    );
  }

  const isUrgent = offer.irrevocable_until && 
    (new Date(offer.irrevocable_until).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 &&
    (new Date(offer.irrevocable_until).getTime() - new Date().getTime()) > 0;

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/offers')} className="shrink-0 -ml-2 touch-target">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-body-mobile truncate">
              {offer.property_address || offer.name || 'Unknown Property'}
            </div>
            <div className="text-meta flex items-center gap-2">
              <StatusChip status={offer.status || 'pending'} label={offer.status || 'Pending'} />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-background shadow-sm border-border/50">
              <CardContent className="p-3">
                <div className="text-eyebrow text-muted-foreground mb-1">Offer Price</div>
                <div className="text-lg font-bold text-primary tabular-nums">
                  <Money amount={offer.offer_price || 0} compact />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background shadow-sm border-border/50">
              <CardContent className="p-3">
                <div className="text-eyebrow text-muted-foreground mb-1">Deposit</div>
                <div className="text-lg font-semibold tabular-nums">
                  <Money amount={offer.deposit_amount || 0} compact />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background shadow-sm border-border/50">
              <CardContent className="p-3">
                <div className="text-eyebrow text-muted-foreground mb-1">Closing</div>
                <div className="text-sm font-semibold">
                  {offer.closing_date ? format(new Date(offer.closing_date), 'MMM d, yy') : '-'}
                </div>
              </CardContent>
            </Card>
            <Card className={`bg-background shadow-sm ${isUrgent ? 'border-warning bg-warning/5' : 'border-border/50'}`}>
              <CardContent className="p-3">
                <div className="text-eyebrow text-muted-foreground mb-1">Irrevocable</div>
                <div className="text-sm font-semibold">
                  {offer.irrevocable_until ? (
                    <Countdown targetDate={offer.irrevocable_until} dangerThresholdHours={24} />
                  ) : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="terms" className="w-full mt-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="parties">Parties</TabsTrigger>
            </TabsList>
            
            <TabsContent value="terms" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Financing</div>
                      <div className="text-sm font-medium">{offer.financing_type || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Commission</div>
                      <div className="text-sm font-medium">{offer.commission_rate ? `${offer.commission_rate}%` : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="font-semibold text-sm mb-3">Conditions</div>
                  {offer.conditions_deadline && (
                    <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">Due: {format(new Date(offer.conditions_deadline), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {['Financing', 'Inspection', 'Status Certificate'].map((cond, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Checkbox id={`m-cond-${i}`} className="mt-0.5" />
                        <label htmlFor={`m-cond-${i}`} className="text-sm font-medium leading-none">
                          {cond}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="parties" className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Property</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{offer.property_address || 'View Listing'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                <div className="bg-brand/10 p-2 rounded-full">
                  <User className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <div className="text-sm font-medium">Buyer Contact</div>
                  <div className="text-xs text-muted-foreground">View Contact Profile</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Action Bar */}
        {(offer.status === 'pending' || offer.status === 'submitted') && (
          <div className="fixed bottom-safe-with-nav left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex gap-2 z-20">
            <Button variant="outline" className="flex-1 text-danger border-danger/20 hover:bg-danger/10" onClick={() => updateStatus.mutate('declined')}>
              <X className="h-4 w-4 mr-1" /> Decline
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setIsCounterOpen(true)}>
              <FileEdit className="h-4 w-4 mr-1" /> Counter
            </Button>
            <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90" onClick={() => updateStatus.mutate('accepted')}>
              <Check className="h-4 w-4 mr-1" /> Accept
            </Button>
          </div>
        )}
      </div>
      
      {offer && (
        <NewOfferModal 
          open={isCounterOpen} 
          onOpenChange={setIsCounterOpen} 
          defaultValues={{
            property_address: offer.property_address,
            buyer_contact_id: offer.buyer_contact_id,
            offer_price: offer.offer_price,
            deposit_amount: offer.deposit_amount,
            financing_type: offer.financing_type,
            commission_rate: offer.commission_rate,
            conditions: offer.conditions || [],
          }}
        />
      )}
    </MobileShell>
  );
}
