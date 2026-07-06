import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Avatar, StageDot } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, X } from 'lucide-react';
import { BuyerOverviewTab, BuyerPropertiesTab, BuyerOffersTab } from './buyer-tabs';
import { SellerOverviewTab, SellerListingTab, SellerOffersTab } from './seller-tabs';

export function DesktopDualDetail() {
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
    <div className="flex flex-col h-full bg-background border-l border-border w-[900px] shrink-0">
      <div className="p-6 border-b border-border flex flex-col gap-6 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={contact.firstName + ' ' + contact.lastName} className="w-16 h-16" />
            <div>
              <h2 className="text-xl font-semibold">{contact.firstName} {contact.lastName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Badge variant="secondary">Dual Client</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><MessageSquare className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}><X className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Buyer Column */}
        <div className="flex-1 border-r border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border bg-surface shrink-0">
            <h3 className="font-medium text-lg">Buying</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <StageDot stageId={buyerStage?.id || ''} />
              <span>{buyerStage?.name}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-bg-sunk">
             <BuyerOverviewTab contact={contact} opp={buyerOpp} />
             <BuyerPropertiesTab contact={contact} opp={buyerOpp} />
             <BuyerOffersTab contact={contact} opp={buyerOpp} />
          </div>
        </div>

        {/* Seller Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border bg-surface shrink-0">
            <h3 className="font-medium text-lg">Selling</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <StageDot stageId={sellerStage?.id || ''} />
              <span>{sellerStage?.name}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-bg-sunk">
             <SellerOverviewTab contact={contact} opp={sellerOpp} />
             <SellerListingTab contact={contact} opp={sellerOpp} />
             <SellerOffersTab contact={contact} opp={sellerOpp} />
          </div>
        </div>
      </div>
      
      {/* Linked Timeline / Shared Activity */}
      <div className="h-64 border-t border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border bg-surface font-medium text-sm">Combined Activity</div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
            Combined timeline coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
