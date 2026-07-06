import React, { useState } from 'react';
import { ResolvedPipeline } from '@/lib/pipeline-registry';
import { Opportunity } from '@/types/ghl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { StageDot, Money, StatusChip } from '@/components/shared/primitives';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface MobileKanbanProps {
  pipeline: ResolvedPipeline;
  items: Opportunity[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export default function MobileKanban({ pipeline, items, onLoadMore, hasMore, isLoading }: MobileKanbanProps) {
  return (
    <div className="p-4 space-y-4 pb-24">
      {pipeline.stages.map(stage => {
        const stageItems = items.filter(i => i.pipelineStageId === stage.id);
        if (stageItems.length === 0) return null;
        
        return (
          <StageLane key={stage.id} stage={stage} items={stageItems} />
        );
      })}
      
      {hasMore && (
        <div className="pt-4 flex justify-center">
          <button 
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-sm font-medium text-brand"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function StageLane({ stage, items }: { stage: any, items: Opportunity[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const stageValue = items.reduce((sum, item) => sum + (item.monetaryValue || 0), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-background rounded-lg border border-border overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-3">
          <StageDot color={stage.color} />
          <span className="font-semibold">{stage.name}</span>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Money amount={stageValue} compact className="text-sm font-medium text-muted-foreground" />
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 pt-0 space-y-3 bg-bg-sunk">
          {items.map(item => (
            <MobileClientCard key={item.id} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MobileClientCard({ item }: { item: Opportunity }) {
  const navigate = useNavigate();
  const initials = item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const contact = item.contact as any;
  const statusTag = contact?.tags?.find((t: string) => t.startsWith('status:'))?.split(':')[1];

  return (
    <Card 
      className="p-4 active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/clients/${item.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-[15px]">{item.name}</div>
            <Money amount={item.monetaryValue || 0} className="text-sm text-muted-foreground" />
          </div>
        </div>
        {statusTag && <StatusChip status="info" label={statusTag} />}
      </div>
    </Card>
  );
}
