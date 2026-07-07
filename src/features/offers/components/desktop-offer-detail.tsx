import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { objectsService, associationsService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { Money, Countdown, StatusChip } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ArrowLeft, Check, X, FileEdit, Clock, Calendar as CalendarIcon, User, Home } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { NewOfferModal } from './new-offer-sheet';
import { useState } from 'react';

export function DesktopOfferDetail() {
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

  const { data: relations } = useQuery({
    queryKey: ghl.relations(id!),
    queryFn: () => associationsService.relationsByRecord(id!),
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
      <>
        <div className="p-6 space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="col-span-2 h-96" />
            <Skeleton className="col-span-1 h-96" />
          </div>
        </div>
      </>
    );
  }

  if (error || !offer) {
    return (
      <>
        <div className="p-6">
          <ErrorState message="Failed to load offer details" onRetry={() => window.location.reload()} />
        </div>
      </>
    );
  }

  const isUrgent = offer.irrevocable_until && 
    (new Date(offer.irrevocable_until).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 &&
    (new Date(offer.irrevocable_until).getTime() - new Date().getTime()) > 0;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex-none p-6 border-b bg-surface">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/offers')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-page-title-desktop truncate">
                  {offer.property_address || offer.name || 'Unknown Property'}
                </h1>
                <StatusChip status={offer.status || 'pending'} label={offer.status || 'Pending'} />
              </div>
              <p className="text-meta">Offer ID: {offer.id}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {offer.status === 'pending' || offer.status === 'submitted' ? (
                <>
                  <Button variant="outline" className="text-danger border-danger/20 hover:bg-danger/10" onClick={() => updateStatus.mutate('declined')}>
                    <X className="h-4 w-4 mr-2" /> Decline
                  </Button>
                  <Button variant="outline" onClick={() => setIsCounterOpen(true)}>
                    <FileEdit className="h-4 w-4 mr-2" /> Counter
                  </Button>
                  <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={() => updateStatus.mutate('accepted')}>
                    <Check className="h-4 w-4 mr-2" /> Accept
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <Card className="bg-background shadow-none border-border/50">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-eyebrow text-muted-foreground mb-1">Offer Price</div>
                <div className="text-2xl font-bold text-primary tabular-nums">
                  <Money amount={offer.offer_price || 0} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background shadow-none border-border/50">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-eyebrow text-muted-foreground mb-1">Deposit</div>
                <div className="text-xl font-semibold tabular-nums">
                  <Money amount={offer.deposit_amount || 0} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background shadow-none border-border/50">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-eyebrow text-muted-foreground mb-1">Closing Date</div>
                <div className="text-xl font-semibold">
                  {offer.closing_date ? format(new Date(offer.closing_date), 'MMM d, yyyy') : '-'}
                </div>
              </CardContent>
            </Card>
            <Card className={`bg-background shadow-none ${isUrgent ? 'border-warning bg-warning/5' : 'border-border/50'}`}>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-eyebrow text-muted-foreground mb-1">Irrevocable Until</div>
                <div className="text-xl font-semibold">
                  {offer.irrevocable_until ? (
                    <Countdown targetDate={offer.irrevocable_until} dangerThresholdHours={24} />
                  ) : '-'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
            
            <div className="col-span-2 space-y-6">
              <Tabs defaultValue="terms" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                  <TabsTrigger value="negotiation">Negotiation History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="terms" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Financing Type</div>
                        <div className="font-medium">{offer.financing_type || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Commission</div>
                        <div className="font-medium">{offer.commission_rate ? `${offer.commission_rate}%` : 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Possession Date</div>
                        <div className="font-medium">{offer.possession_date ? format(new Date(offer.possession_date), 'MMM d, yyyy') : 'Same as closing'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {offer.conditions_deadline && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Conditions due by: {format(new Date(offer.conditions_deadline), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {['Financing', 'Inspection', 'Status Certificate'].map((cond, i) => (
                          <div key={i} className="flex items-start space-x-3">
                            <Checkbox id={`cond-${i}`} />
                            <div className="grid gap-1.5 leading-none">
                              <label htmlFor={`cond-${i}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {cond}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="negotiation">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>No previous negotiation history.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Associated Parties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Property</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{offer.property_address || 'View Listing'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="bg-brand/10 p-2 rounded-full">
                      <User className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Buyer Contact</div>
                      <div className="text-xs text-muted-foreground">View Contact Profile</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
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
    </>
  );
}
