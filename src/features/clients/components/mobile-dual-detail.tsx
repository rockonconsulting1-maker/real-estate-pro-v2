import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Avatar, StageDot } from '@/components/shared/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { BuyerOverviewTab, BuyerPropertiesTab } from './buyer-tabs';
import { SellerOverviewTab, SellerListingTab } from './seller-tabs';

export function MobileDualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: currentOpp } = useQuery({
    queryKey: ghl.opp(id!),
    queryFn: () => opportunitiesService.get(id!),
    enabled: !!id,
  });

  const contactId = currentOpp?.contactId;

  const { data: contact } = useQuery({
    queryKey: ghl.contact(contactId!),
    queryFn: () => contactsService.get(contactId!),
    enabled: !!contactId,
  });

  const { data: oppsData } = useQuery({
    queryKey: ghl.opps({ contactId }),
    queryFn: () => opportunitiesService.search({ contactId, limit: 50 }),
    enabled: !!contactId,
  });

  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');

  const buyerOpp = oppsData?.opportunities.find(o => o.pipelineId === buyerPipeline?.id && o.status === 'open');
  const sellerOpp = oppsData?.opportunities.find(o => o.pipelineId === sellerPipeline?.id && o.status === 'open');

  if (!contact || !buyerOpp || !sellerOpp) return null;

  const buyerStage = buyerPipeline?.stages?.find(s => s.id === buyerOpp.pipelineStageId);
  const sellerStage = sellerPipeline?.stages?.find(s => s.id === sellerOpp.pipelineStageId);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-surface">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full"><Phone className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full"><MessageSquare className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="p-4 border-b border-border shrink-0 flex items-center gap-4">
        <Avatar name={contact.firstName + ' ' + contact.lastName} className="w-16 h-16" />
        <div>
          <h2 className="text-xl font-semibold">{contact.firstName} {contact.lastName}</h2>
          <Badge variant="secondary" className="mt-1">Dual Client</Badge>
        </div>
      </div>

      <Tabs defaultValue="buyer" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border shrink-0">
          <TabsList className="w-full grid grid-cols-2 h-12 bg-transparent p-0">
            <TabsTrigger value="buyer" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none h-12">Buying</TabsTrigger>
            <TabsTrigger value="seller" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none h-12">Selling</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-bg-sunk">
          <TabsContent value="buyer" className="m-0 space-y-6">
            <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-between">
              <span className="font-medium text-sm">Stage</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StageDot stageId={buyerStage?.id || ''} />
                <span>{buyerStage?.name}</span>
              </div>
            </div>
            <BuyerOverviewTab contact={contact} opp={buyerOpp} />
            <BuyerPropertiesTab contact={contact} opp={buyerOpp} />
          </TabsContent>
          <TabsContent value="seller" className="m-0 space-y-6">
            <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-between">
              <span className="font-medium text-sm">Stage</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StageDot stageId={sellerStage?.id || ''} />
                <span>{sellerStage?.name}</span>
              </div>
            </div>
            <SellerOverviewTab contact={contact} opp={sellerOpp} />
            <SellerListingTab contact={contact} opp={sellerOpp} />
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="p-4 border-t border-border bg-background shrink-0">
        <Button className="w-full" variant="outline">View Combined Timeline</Button>
      </div>
    </div>
  );
}
