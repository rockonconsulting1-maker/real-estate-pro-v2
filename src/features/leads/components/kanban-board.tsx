import React, { useMemo } from 'react';
import { Opportunity } from '@/types/ghl';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Avatar, TempBadge, Money, StageDot } from '@/components/shared/primitives';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { toast } from 'sonner';

interface LeadsKanbanViewProps {
  data: Opportunity[];
  pipelineId?: string;
  onCardClick: (opp: Opportunity) => void;
  activeId?: string;
}

export function LeadsKanbanView({ data, pipelineId, onCardClick, activeId }: LeadsKanbanViewProps) {
  const queryClient = useQueryClient();
  const stages = useMemo(() => {
    if (!pipelineId) return [];
    const pipeline = PipelineRegistry.getPipeline(pipelineId);
    return pipeline?.stages || [];
  }, [pipelineId]);

  // Group data by stage
  const [columns, setColumns] = React.useState<Record<string, Opportunity[]>>({});
  
  React.useEffect(() => {
    const cols: Record<string, Opportunity[]> = {};
    stages.forEach(s => {
      cols[s.id] = [];
    });
    data.forEach(opp => {
      if (cols[opp.pipelineStageId]) {
        cols[opp.pipelineStageId].push(opp);
      } else {
        // Fallback for opps with unknown stage or different pipeline
        if (!cols['unknown']) cols['unknown'] = [];
        cols['unknown'].push(opp);
      }
    });
    setColumns(cols);
  }, [data, stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeIdDrag, setActiveIdDrag] = React.useState<string | null>(null);

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, pipelineStageId }: { id: string, pipelineStageId: string }) => {
      return opportunitiesService.update(id, { pipelineStageId });
    },
    onError: (err, variables, context: any) => {
      toast.error('Failed to move lead');
      // Rollback
      if (context?.previousColumns) {
        setColumns(context.previousColumns);
      }
      queryClient.invalidateQueries({ queryKey: [{ scope: 'ghl', entity: 'opportunities' }] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [{ scope: 'ghl', entity: 'opportunities' }] });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveIdDrag(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || (stages.find(s => s.id === overId) ? overId : null);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter((item) => item.id !== activeId),
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIdDrag(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || (stages.find(s => s.id === overId) ? overId : null);

    if (!activeContainer || !overContainer) return;

    const activeItem = data.find(d => d.id === activeId);
    if (!activeItem) return;

    if (activeContainer === overContainer) {
      // Reordering within the same column
      const activeIndex = columns[activeContainer].findIndex((item) => item.id === activeId);
      const overIndex = columns[overContainer].findIndex((item) => item.id === overId);

      if (activeIndex !== overIndex) {
        setColumns((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        }));
      }
    } else {
      // Moved to a different column
      if (activeItem.pipelineStageId !== overContainer) {
        // Optimistic update
        const previousColumns = { ...columns };
        updateStageMutation.mutate({ id: activeId, pipelineStageId: overContainer }, {
          onMutate: () => ({ previousColumns })
        } as any);
      }
    }
  };

  const findContainer = (id: string) => {
    if (id in columns) return id;
    return Object.keys(columns).find((key) => columns[key].find((item) => item.id === id));
  };

  const activeOpp = useMemo(() => data.find(d => d.id === activeIdDrag), [activeIdDrag, data]);

  return (
    <div className="h-full bg-background flex flex-col">
      <ScrollArea className="flex-1 whitespace-nowrap" type="scroll">
        <div className="flex h-full p-4 gap-4 inline-flex items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {stages.map((stage) => {
              const items = columns[stage.id] || [];
              const totalValue = items.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
              return (
                <KanbanColumn
                  key={stage.id}
                  id={stage.id}
                  title={stage.name}
                  count={items.length}
                  totalValue={totalValue}
                  items={items}
                  onCardClick={onCardClick}
                  selectedId={activeId}
                />
              );
            })}
            <DragOverlay>
              {activeOpp ? <KanbanCard opp={activeOpp} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  totalValue: number;
  items: Opportunity[];
  onCardClick: (opp: Opportunity) => void;
  selectedId?: string;
}

function KanbanColumn({ id, title, count, totalValue, items, onCardClick, selectedId }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id,
    data: { type: 'Column' }
  });

  return (
    <div className="w-[320px] flex-shrink-0 flex flex-col h-full max-h-full bg-surface/50 rounded-xl border border-border overflow-hidden">
      <div className="p-3 border-b border-border bg-surface flex flex-col gap-1 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StageDot stageId={id} />
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>
        </div>
        {totalValue > 0 && (
          <div className="text-xs text-muted-foreground ml-5">
            <Money amount={totalValue} compact />
          </div>
        )}
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[150px]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((opp) => (
            <SortableKanbanCard 
              key={opp.id} 
              opp={opp} 
              onClick={() => onCardClick(opp)}
              isSelected={opp.id === selectedId}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

interface SortableKanbanCardProps {
  opp: Opportunity;
  onClick: () => void;
  isSelected?: boolean;
}

function SortableKanbanCard({ opp, onClick, isSelected }: SortableKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opp.id, data: { type: 'Card', opp } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard opp={opp} onClick={onClick} isSelected={isSelected} />
    </div>
  );
}

function KanbanCard({ opp, isOverlay, onClick, isSelected }: { opp: Opportunity, isOverlay?: boolean, onClick?: () => void, isSelected?: boolean }) {
  const tags = (opp.contact as any)?.tags || [];
  let temp: 'hot' | 'warm' | 'cold' | undefined;
  if (tags.includes('temperature:hot')) temp = 'hot';
  else if (tags.includes('temperature:warm')) temp = 'warm';
  else if (tags.includes('temperature:cold')) temp = 'cold';

  const date = opp.createdAt ? new Date(opp.createdAt) : null;

  return (
    <Card 
      className={`cursor-grab active:cursor-grabbing hover:border-brand/50 transition-colors ${isOverlay ? 'shadow-2xl ring-2 ring-brand/20 rotate-2' : 'shadow-sm'} ${isSelected ? 'ring-2 ring-brand border-transparent' : ''}`}
      onClick={(e) => {
        // Prevent click when dragging
        if (e.defaultPrevented) return;
        onClick?.();
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="font-medium text-sm leading-tight line-clamp-2">{opp.name || (opp.contact as any)?.contactName || 'Unknown'}</div>
          {temp && <TempBadge temp={temp} />}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Avatar name={opp.name || (opp.contact as any)?.contactName || 'U'} className="w-6 h-6 text-[10px]" />
            {date && <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(date)}</span>}
          </div>
          {opp.monetaryValue ? (
            <div className="text-xs font-medium"><Money amount={opp.monetaryValue} compact /></div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
