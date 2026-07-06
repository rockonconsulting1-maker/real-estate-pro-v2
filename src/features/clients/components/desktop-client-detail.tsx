import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { DesktopBuyerDetail } from './desktop-buyer-detail';
import { DesktopSellerDetail } from './desktop-seller-detail';
import { DesktopDualDetail } from './desktop-dual-detail';

export function DesktopClientDetail() {
  const { id } = useParams();
  
  const { data: opp, isLoading: oppLoading } = useQuery({
    queryKey: ghl.opp(id!),
    queryFn: () => opportunitiesService.get(id!),
    enabled: !!id,
  });

  const contactId = opp?.contactId;

  const { data: contactOpps, isLoading: oppsLoading } = useQuery({
    queryKey: ghl.opps({ contactId }),
    queryFn: () => opportunitiesService.search({ contactId, limit: 50 }),
    enabled: !!contactId,
  });

  if (oppLoading || oppsLoading) {
    return (
      <div className="flex flex-col h-full bg-background border-l border-border w-[600px] shrink-0 p-6 space-y-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!opp) {
    return <EmptyState title="Not Found" description="Opportunity not found." />;
  }

  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');
  
  const hasBuyer = contactOpps?.opportunities.some(o => o.pipelineId === buyerPipeline?.id && o.status === 'open');
  const hasSeller = contactOpps?.opportunities.some(o => o.pipelineId === sellerPipeline?.id && o.status === 'open');

  if (hasBuyer && hasSeller) {
    return <DesktopDualDetail />;
  }

  if (opp.pipelineId === sellerPipeline?.id) {
    return <DesktopSellerDetail />;
  }

  return <DesktopBuyerDetail />;
}
