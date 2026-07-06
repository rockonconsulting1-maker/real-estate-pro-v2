import React from 'react';
import { ResolvedPipeline } from '@/lib/pipeline-registry';
import { Opportunity } from '@/types/ghl';
import { DndContext, DragEndEvent, closestCenter, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Money, StageDot, StatusChip } from '@/components/shared/primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghlFetch } from '@/lib/ghl/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface KanbanBoardProps {
  pipeline: ResolvedPipeline;
  items: Opportunity[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export default function KanbanBoard({ pipeline, items, onLoadMore, hasMore, isLoading }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const moveMutation = useMutation({
    mutationFn: async ({ id, stageId }: { id: string, stageId: string }) => {
      return ghlFetch(`/opportunities/${id}`, {
        method: 'PUT',
        body: { pipelineStageId: stageId }
      });
    },
    onMutate: async ({ id, stageId }) => {
      await queryClient.cancelQueries({ queryKey: ['ghl', 'opportunities'] });
      const previous = queryClient.getQueryData(['ghl', 'opportunities']);
      
      queryClient.setQueryData(['ghl', 'opportunities'], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((item: Opportunity) => 
              item.id === id ? { ...item, pipelineStageId: stageId } : item
            )
          }))
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['ghl', 'opportunities'], context.previous);
      }
      toast.error('Failed to move client');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ghl', 'opportunities'] });
    }
  });

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find(i => i.id === active.id);
    const overStageId = over.id.toString();

    if (activeItem && activeItem.pipelineStageId !== overStageId) {
      moveMutation.mutate({ id: activeItem.id, stageId: overStageId });
    }
  };

  const activeItem = activeId ? items.find(i => i.id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="h-full overflow-x-auto p-6 flex gap-4 items-start">
        {pipeline.stages.map(stage => {
          const stageItems = items.filter(i => i.pipelineStageId === stage.id);
          const stageValue = stageItems.reduce((sum, item) => sum + (item.monetaryValue || 0), 0);
          
          return (
            <div key={stage.id} className="w-80 shrink-0 flex flex-col max-h-full">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <StageDot color={stage.color} />
                  <span className="font-semibold text-sm">{stage.name}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{stageItems.length}</span>
                </div>
                <Money amount={stageValue} compact className="text-xs font-medium text-muted-foreground" />
              </div>
              
              <DroppableStage id={stage.id}>
                <div className="flex flex-col gap-3 min-h-[150px] pb-10">
                  {stageItems.map(item => (
                    <DraggableCard key={item.id} item={item} stageColor={stage.color} />
                  ))}
                </div>
              </DroppableStage>
            </div>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeItem ? <ClientCard item={activeItem} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

import { useDroppable } from '@dnd-kit/core';

function DroppableStage({ id, children }: { id: string, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 overflow-y-auto rounded-lg transition-colors ${isOver ? 'bg-secondary/50' : ''}`}
    >
      {children}
    </div>
  );
}

function DraggableCard({ item, stageColor }: { item: Opportunity, stageColor?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClientCard item={item} stageColor={stageColor} />
    </div>
  );
}

function ClientCard({ item, isDragging, stageColor }: { item: Opportunity, isDragging?: boolean, stageColor?: string }) {
  const navigate = useNavigate();
  const initials = item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  // Try to find status tag (e.g. status:firm, status:under-contract)
  const contact = item.contact as any;
  const statusTag = contact?.tags?.find((t: string) => t.startsWith('status:'))?.split(':')[1];

  return (
    <Card 
      className={`p-4 cursor-grab active:cursor-grabbing hover:border-brand/50 transition-colors ${isDragging ? 'shadow-2xl ring-2 ring-brand' : ''}`}
      onClick={() => navigate(`/clients/${item.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm leading-tight">{item.name}</div>
            {item.contact && (item.contact as any).companyName && (
              <div className="text-xs text-muted-foreground">{(item.contact as any).companyName}</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-2">
        <Money amount={(item as any).monetaryValue || 0} className="text-sm font-semibold" />
        {statusTag && <StatusChip status="info" label={statusTag} />}
      </div>
    </Card>
  );
}
