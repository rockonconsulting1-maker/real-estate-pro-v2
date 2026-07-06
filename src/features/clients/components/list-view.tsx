import React from 'react';
import { Opportunity } from '@/types/ghl';
import { VirtualizedTable } from '@/components/shared/virtualized';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Money, StageDot, StatusChip } from '@/components/shared/primitives';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { useNavigate } from 'react-router-dom';

interface ListViewProps {
  items: Opportunity[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export default function ListView({ items, onLoadMore, hasMore, isLoading }: ListViewProps) {
  const navigate = useNavigate();

  const columns = [
    {
      accessorKey: 'name' as keyof Opportunity,
      header: 'Name',
      width: 250,
      cell: (item: Opportunity) => {
        const initials = item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{item.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'pipelineStageId' as keyof Opportunity,
      header: 'Stage',
      width: 200,
      cell: (item: Opportunity) => {
        const stage = PipelineRegistry.getStage(item.pipelineStageId);
        return (
          <div className="flex items-center gap-2">
            <StageDot color={stage?.color} />
            <span className="text-sm">{stage?.name || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status' as keyof Opportunity,
      header: 'Status',
      width: 150,
      cell: (item: Opportunity) => {
        const contact = item.contact as any;
        const statusTag = contact?.tags?.find((t: string) => t.startsWith('status:'))?.split(':')[1];
        return statusTag ? <StatusChip status="info" label={statusTag} /> : <span className="text-muted-foreground text-sm">-</span>;
      }
    },
    {
      accessorKey: 'monetaryValue' as keyof Opportunity,
      header: 'Value',
      width: 120,
      cell: (item: Opportunity) => <Money amount={(item as any).monetaryValue || 0} />
    },
    {
      accessorKey: 'id' as keyof Opportunity, // Using id as fallback
      header: 'DOM',
      width: 80,
      cell: (item: Opportunity) => <span className="text-sm text-muted-foreground">-</span>
    },
    {
      accessorKey: 'id' as keyof Opportunity,
      header: 'Next Milestone',
      width: 150,
      cell: (item: Opportunity) => <span className="text-sm text-muted-foreground">-</span>
    },
    {
      accessorKey: 'id' as keyof Opportunity,
      header: 'Closing Date',
      width: 120,
      cell: (item: Opportunity) => <span className="text-sm text-muted-foreground">-</span>
    }
  ];

  return (
    <div className="h-full bg-background">
      <VirtualizedTable<Opportunity>
        data={items}
        columns={columns}
        fetchNextPage={onLoadMore}
        hasNextPage={hasMore}
        isFetchingNextPage={isLoading}
        onRowClick={(item) => navigate(`/clients/${item.id}`)}
      />
      {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading more...</div>}
    </div>
  );
}
