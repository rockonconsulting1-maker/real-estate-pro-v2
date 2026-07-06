import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Money, StageDot } from '@/components/shared/primitives';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-query-helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams, useNavigate } from 'react-router-dom';
import MobileTransactionDetail from './components/mobile-transaction-detail';

export default function MobileTransactionsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');

  const { data: buyerOpps, isLoading: isLoadingBuyers } = useQuery({
    queryKey: ghl.opps({ pipelineId: buyerPipeline?.pipelineId, q: debouncedSearch }),
    queryFn: () => opportunitiesService.search({ pipelineId: buyerPipeline?.pipelineId || '', q: debouncedSearch, limit: 100 }),
    enabled: !!buyerPipeline,
  });

  const { data: sellerOpps, isLoading: isLoadingSellers } = useQuery({
    queryKey: ghl.opps({ pipelineId: sellerPipeline?.pipelineId, q: debouncedSearch }),
    queryFn: () => opportunitiesService.search({ pipelineId: sellerPipeline?.pipelineId || '', q: debouncedSearch, limit: 100 }),
    enabled: !!sellerPipeline,
  });

  const isLoading = isLoadingBuyers || isLoadingSellers;

  const transactions = React.useMemo(() => {
    let all = [
      ...(buyerOpps?.opportunities || []).map(o => ({ ...o, side: 'Buy' })),
      ...(sellerOpps?.opportunities || []).map(o => ({ ...o, side: 'Sell' }))
    ] as (any & { side: string })[];

    all = all.filter(o => {
      const stageName = PipelineRegistry.stageLabel(o.pipelineStageId).toLowerCase();
      const pos = PipelineRegistry.stagePosition(o.pipelineStageId);
      return pos >= 3 || stageName.includes('contract') || stageName.includes('firm') || stageName.includes('close');
    });

    return all.sort((a, b) => {
      const aClose = a.customFields?.find((f: any) => f.id === 'closing_date')?.value;
      const bClose = b.customFields?.find((f: any) => f.id === 'closing_date')?.value;
      if (aClose && bClose) {
        return new Date(aClose).getTime() - new Date(bClose).getTime();
      }
      return 0;
    });
  }, [buyerOpps, sellerOpps]);

  if (id) {
    return <MobileTransactionDetail id={id} />;
  }

  return (
    <div className="flex flex-col h-full bg-secondary/30">
      <div className="flex-none p-4 pb-2 bg-background border-b sticky top-0 z-10 safe-top">
        <h1 className="text-page-title-mobile mb-4">Transactions</h1>
        
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          <Card className="flex-none w-[140px]">
            <CardContent className="p-3">
              <div className="text-eyebrow text-muted-foreground mb-1">Active</div>
              <div className="text-xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card className="flex-none w-[140px]">
            <CardContent className="p-3">
              <div className="text-eyebrow text-muted-foreground mb-1">Volume</div>
              <div className="text-xl font-bold">
                <Money amount={transactions.reduce((acc: number, t: any) => acc + (t.monetaryValue || 0), 0)} compact />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 bg-secondary/50 border-0 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions found.
            </div>
          ) : (
            transactions.map((t: any) => {
              const isFirm = t.tags?.includes('firm') || t.tags?.includes('Firm');
              const closeDate = t.customFields?.find((f: any) => f.id === 'closing_date')?.value;
              
              return (
                <Card key={t.id} className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate(`/transactions/${t.id}`)}>
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{t.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>{t.side} Side</span>
                            <span>•</span>
                            <Money amount={(t as any).monetaryValue || 0} />
                          </div>
                        </div>
                        <Badge variant={isFirm ? 'default' : 'secondary'}>{isFirm ? 'Firm' : 'Cond.'}</Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border-2">
                        <div className="flex items-center gap-1.5">
                          <StageDot stageId={t.pipelineStageId} />
                          <span className="truncate max-w-[120px]">{PipelineRegistry.stageLabel(t.pipelineStageId)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {closeDate ? format(new Date(closeDate), 'MMM d') : '-'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
