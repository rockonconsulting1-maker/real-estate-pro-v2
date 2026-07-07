import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { VirtualizedTable } from '@/components/shared/virtualized';
import { Money, StageDot } from '@/components/shared/primitives';
import { format, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-query-helpers';
import { Opportunity } from '@/types/ghl';
import { useParams, useNavigate } from 'react-router-dom';
import DesktopTransactionDetail from './components/desktop-transaction-detail';
import { cn } from '@/lib/utils';

export default function DesktopTransactionsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [side, setSide] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');
  const registry = PipelineRegistry;

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
    ] as any[];

    // Filter to "Under Contract" or later
    all = all.filter((o: any) => {
      const pos = registry.stagePosition(o.pipelineStageId);
      const ucPos = registry.underContractPosition(o.pipelineId || '');
      return ucPos !== -1 && pos >= ucPos;
    });

    if (side !== 'all') {
      all = all.filter((o: any) => o.side.toLowerCase() === side.toLowerCase());
    }

    if (status !== 'all') {
      all = all.filter(o => {
        const hasFirm = (o as any).tags?.includes('firm') || (o as any).tags?.includes('Firm');
        if (status === 'firm') return hasFirm;
        if (status === 'conditional') return !hasFirm;
        return true;
      });
    }

    return all.sort((a, b) => {
      // Sort by closing date if available (custom field)
      const aClose = (a as any).customFields?.find((f: any) => f.id === 'closing_date')?.value;
      const bClose = (b as any).customFields?.find((f: any) => f.id === 'closing_date')?.value;
      if (aClose && bClose) {
        return new Date(aClose).getTime() - new Date(bClose).getTime();
      }
      return 0;
    });
  }, [buyerOpps, sellerOpps, side, status]);

  const closingThisWeek = transactions.filter(t => {
    const closeDate = (t as any).customFields?.find((f: any) => f.id === 'closing_date')?.value;
    return closeDate && isThisWeek(new Date(closeDate));
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Client / Property',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.side} Side</div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const isFirm = row.original.tags?.includes('firm') || row.original.tags?.includes('Firm');
        return <Badge variant={isFirm ? 'default' : 'secondary'}>{isFirm ? 'Firm' : 'Conditional'}</Badge>;
      }
    },
    {
      accessorKey: 'monetaryValue',
      header: 'Price',
      cell: ({ row }: any) => <Money amount={row.original.monetaryValue || 0} />
    },
    {
      accessorKey: 'closing',
      header: 'Closing',
      cell: ({ row }: any) => {
        const closeDate = row.original.customFields?.find((f: any) => f.id === 'closing_date')?.value;
        if (!closeDate) return <span className="text-muted-foreground">-</span>;
        return <span className="tabular-nums">{format(new Date(closeDate), 'MMM d, yyyy')}</span>;
      }
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <StageDot stageId={row.original.pipelineStageId} />
          <span className="text-sm truncate">{registry.stageLabel(row.original.pipelineStageId)}</span>
        </div>
      )
    }
  ];

  return (
    <div className="h-full flex">
      <div className={cn("flex flex-col border-r", id ? "w-1/3" : "w-full")}>
        <div className="flex-none p-6 pb-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title-desktop">Transactions</h1>
        </div>
        
        {!id && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-card-header">Active Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-stat">{transactions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-card-header">Closing This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-stat">{closingThisWeek.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-card-header">Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-stat">
                  <Money amount={transactions.reduce((acc: number, t: any) => acc + (t.monetaryValue || 0), 0)} compact />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={side} onValueChange={setSide}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="conditional">Conditional</SelectItem>
              <SelectItem value="firm">Firm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <VirtualizedTable
            data={transactions}
            columns={id ? columns.slice(0, 2) : columns}
            onRowClick={(item: any) => navigate(`/transactions/${item.id}`)}
          />
        )}
      </div>
      </div>
      {id && (
        <div className="w-2/3 flex flex-col min-w-0 bg-secondary/10">
          <DesktopTransactionDetail id={id} />
        </div>
      )}
    </div>
  );
}
