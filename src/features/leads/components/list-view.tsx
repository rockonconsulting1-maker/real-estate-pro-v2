import React from 'react';
import { VirtualizedTable } from '@/components/shared/virtualized';
import { Avatar, StageDot, TempBadge, RoleBadge, Money } from '@/components/shared/primitives';
import { Opportunity } from '@/types/ghl';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { formatDistanceToNow } from 'date-fns';

interface LeadsListViewProps {
  data: Opportunity[];
  onRowClick: (opp: Opportunity) => void;
  activeId?: string;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function LeadsListView({ data, onRowClick, activeId, fetchNextPage, hasNextPage, isFetchingNextPage }: LeadsListViewProps) {
  
  const columns = [
    {
      header: 'Name',
      width: 250,
      cell: (opp: Opportunity) => (
        <div className="flex items-center gap-3">
          <Avatar name={opp.name || (opp.contact as any)?.contactName || 'Unknown'} className="w-8 h-8" />
          <div className="font-medium truncate">{opp.name || (opp.contact as any)?.contactName || 'Unknown'}</div>
        </div>
      )
    },
    {
      header: 'Role',
      width: 120,
      cell: (opp: Opportunity) => {
        // Fallback role detection
        const tags = (opp.contact as any)?.tags || [];
        let role: 'buyer' | 'seller' | 'investor' | 'vendor' | 'agent' | undefined;
        if (tags.includes('role:buyer')) role = 'buyer';
        else if (tags.includes('role:seller')) role = 'seller';
        else if (tags.includes('role:investor')) role = 'investor';
        
        return role ? <RoleBadge role={role} /> : <span className="text-muted-foreground text-sm">--</span>;
      }
    },
    {
      header: 'Stage',
      width: 160,
      cell: (opp: Opportunity) => {
        const stageName = PipelineRegistry.stageLabel(opp.pipelineStageId);
        return (
          <div className="flex items-center gap-2">
            <StageDot stageId={opp.pipelineStageId} />
            <span className="text-sm truncate">{stageName}</span>
          </div>
        );
      }
    },
    {
      header: 'Temp',
      width: 100,
      cell: (opp: Opportunity) => {
        const tags = (opp.contact as any)?.tags || [];
        let temp: 'hot' | 'warm' | 'cold' | undefined;
        if (tags.includes('temperature:hot')) temp = 'hot';
        else if (tags.includes('temperature:warm')) temp = 'warm';
        else if (tags.includes('temperature:cold')) temp = 'cold';
        
        return temp ? <TempBadge temp={temp} /> : <span className="text-muted-foreground text-sm">--</span>;
      }
    },
    {
      header: 'Budget/Target',
      width: 140,
      cell: (opp: Opportunity) => {
        return opp.monetaryValue ? <Money amount={opp.monetaryValue} compact /> : <span className="text-muted-foreground text-sm">--</span>;
      }
    },
    {
      header: 'Source',
      width: 140,
      cell: (opp: Opportunity) => <span className="text-sm truncate">{String(opp.source || '--')}</span>
    },
    {
      header: 'Last Contact',
      width: 140,
      cell: (opp: Opportunity) => {
        // Approximation using updatedAt or a custom field if available
        const date = opp.updatedAt ? new Date(opp.updatedAt) : null;
        return <span className="text-sm text-muted-foreground">{date ? formatDistanceToNow(date, { addSuffix: true }) : '--'}</span>;
      }
    },
    {
      header: 'Age',
      width: 100,
      cell: (opp: Opportunity) => {
        const date = opp.createdAt ? new Date(opp.createdAt) : null;
        return <span className="text-sm text-muted-foreground">{date ? formatDistanceToNow(date) : '--'}</span>;
      }
    }
  ];

  return (
    <div className="h-full bg-surface">
      <VirtualizedTable 
        data={data}
        columns={columns}
        onRowClick={onRowClick}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        rowHeight={60}
      />
    </div>
  );
}
