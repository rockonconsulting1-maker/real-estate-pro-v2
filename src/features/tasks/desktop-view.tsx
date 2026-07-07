import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';

import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Calendar as CalendarIcon, User, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { NewTaskModal, TaskDetailModal } from './components/task-modals';

const COLUMNS = [
  { id: 'todo', title: 'To Do', value: 'incomplete' },
  { id: 'in_progress', title: 'In Progress', value: 'in_progress' },
  { id: 'completed', title: 'Completed', value: 'completed' }
];

function TaskCard({ task, isDragging, onEdit }: { task: any, isDragging?: boolean, onEdit: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const queryClient = useQueryClient();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;

  const toggleComplete = useMutation({
    mutationFn: (completed: boolean) => 
      tasksGlobalService.update(task.contactId, task.id, { 
        completed, 
        status: completed ? 'completed' : 'incomplete' 
      }),
    onMutate: async (completed) => {
      await queryClient.cancelQueries({ queryKey: ghl.tasks() });
      const previous = queryClient.getQueryData(ghl.tasks());
      queryClient.setQueryData(ghl.tasks(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) => 
            t.id === task.id ? { ...t, completed, status: completed ? 'completed' : 'incomplete' } : t
          )
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(ghl.tasks(), context?.previous);
      toast.error('Failed to update task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ghl.tasks() });
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-surface border rounded-lg p-3 shadow-sm group relative",
        isDragging && "shadow-md ring-2 ring-brand ring-offset-2 z-50",
        task.completed && "opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={task.completed} 
          onCheckedChange={(c) => toggleComplete.mutate(!!c)}
          className="mt-0.5 z-10 relative"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onEdit(task)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className={cn("text-sm font-medium leading-tight mb-2 hover:text-brand transition-colors", task.completed && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </div>
            )}
            {task.contactId && (
              <Link 
                to={`/contacts/${task.contactId}`}
                className="flex items-center gap-1 hover:text-brand z-10 relative"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <User className="h-3 w-3" />
                Contact
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesktopTasksView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ghl.tasks(),
    queryFn: () => tasksGlobalService.search(),
    staleTime: 60000,
  });

  const tasks = data?.tasks || [];
  
  // Filter
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.body && t.body.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by status
  const columns = {
    todo: filteredTasks.filter(t => t.status !== 'in_progress' && !t.completed),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress' && !t.completed),
    completed: filteredTasks.filter(t => t.completed)
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    // Find task
    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    // Determine target status
    let targetStatus = '';
    let targetCompleted = false;

    if (COLUMNS.find(c => c.id === overId)) {
      // Dropped on column header/empty space
      const col = COLUMNS.find(c => c.id === overId)!;
      targetStatus = col.value;
      targetCompleted = col.id === 'completed';
    } else {
      // Dropped on another task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        targetCompleted = overTask.completed;
      }
    }

    if (!targetStatus || (task.status === targetStatus && task.completed === targetCompleted)) return;

    // Optimistic update
    queryClient.setQueryData(ghl.tasks(), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        tasks: old.tasks.map((t: any) => 
          t.id === task.id ? { ...t, status: targetStatus, completed: targetCompleted } : t
        )
      };
    });

    // Mutate
    tasksGlobalService.update(task.contactId, task.id, { 
      status: targetStatus, 
      completed: targetCompleted 
    }).catch(() => {
      queryClient.invalidateQueries({ queryKey: ghl.tasks() });
      toast.error('Failed to update task status');
    });
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-6 border-b shrink-0 flex items-center justify-between bg-surface">
          <div>
            <h1 className="text-page-title-desktop">Tasks</h1>
            <p className="text-muted-foreground text-sm">Manage your to-dos across all contacts.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-6 bg-background">
          {isLoading ? (
            <div className="flex gap-6 h-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-80 shrink-0 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 h-full items-start">
                {COLUMNS.map(col => {
                  const colTasks = columns[col.id as keyof typeof columns];
                  
                  return (
                    <div key={col.id} className="w-[320px] shrink-0 flex flex-col h-full max-h-full">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                          {col.id === 'todo' && <Circle className="h-4 w-4 text-muted-foreground" />}
                          {col.id === 'in_progress' && <Clock className="h-4 w-4 text-warning" />}
                          {col.id === 'completed' && <CheckCircle2 className="h-4 w-4 text-success" />}
                          <h3 className="font-semibold">{col.title}</h3>
                        </div>
                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {colTasks.length}
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto min-h-[200px] bg-muted/30 rounded-xl p-2">
                        <SortableContext 
                          id={col.id}
                          items={colTasks.map(t => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 min-h-[100px]">
                            {colTasks.map(task => (
                              <TaskCard key={task.id} task={task} onEdit={setSelectedTask} />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} isDragging onEdit={setSelectedTask} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
      
      <NewTaskModal open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />
      <TaskDetailModal task={selectedTask} open={!!selectedTask} onOpenChange={(o) => !o && setSelectedTask(null)} />
    </>
  );
}
