import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';

import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, User, CheckCircle2, Circle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast, isToday, isFuture } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { NewTaskModal, TaskDetailModal } from './components/task-modals';

export function MobileTasksView() {
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('incomplete');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ghl.tasks(),
    queryFn: () => tasksGlobalService.search(),
    staleTime: 60000,
  });

  const tasks = data?.tasks || [];
  
  const filteredTasks = tasks.filter(t => {
    if (filter === 'incomplete') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  // Grouping
  const overdue = filteredTasks.filter(t => !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const today = filteredTasks.filter(t => !t.completed && t.dueDate && isToday(new Date(t.dueDate)));
  const upcoming = filteredTasks.filter(t => !t.completed && t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const noDate = filteredTasks.filter(t => !t.completed && !t.dueDate);
  const completed = filteredTasks.filter(t => t.completed);

  const toggleComplete = useMutation({
    mutationFn: ({ contactId, taskId, completed }: { contactId: string, taskId: string, completed: boolean }) => 
      tasksGlobalService.update(contactId, taskId, { 
        completed, 
        status: completed ? 'completed' : 'incomplete' 
      }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ghl.tasks() });
      const previous = queryClient.getQueryData(ghl.tasks());
      queryClient.setQueryData(ghl.tasks(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) => 
            t.id === vars.taskId ? { ...t, completed: vars.completed, status: vars.completed ? 'completed' : 'incomplete' } : t
          )
        };
      });
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(ghl.tasks(), context?.previous);
      toast.error('Failed to update task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ghl.tasks() });
    }
  });

  const TaskRow = ({ task }: { task: any }) => {
    const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;

    return (
      <div 
        className={cn("bg-surface border-b p-4 flex items-start gap-3", task.completed && "opacity-60")}
        onClick={() => setSelectedTask(task)}
      >
        <Checkbox 
          checked={task.completed} 
          onCheckedChange={(c) => toggleComplete.mutate({ contactId: task.contactId, taskId: task.id, completed: !!c })}
          className="mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-tight mb-2", task.completed && "line-through text-muted-foreground")}>
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
                className="flex items-center gap-1 text-brand z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <User className="h-3 w-3" />
                Contact
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const GroupHeader = ({ title, count, colorClass }: { title: string, count: number, colorClass?: string }) => {
    if (count === 0) return null;
    return (
      <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between sticky top-0 z-10">
        <h3 className={cn("text-xs font-bold uppercase tracking-wider", colorClass || "text-muted-foreground")}>
          {title}
        </h3>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-full text-muted-foreground border">
          {count}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between bg-surface border-b shrink-0">
          <h1 className="font-bold text-lg">Tasks</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsNewTaskOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-surface">
          <Button 
            variant={filter === 'incomplete' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-8"
            onClick={() => setFilter('incomplete')}
          >
            Incomplete
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-8"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-8"
            onClick={() => setFilter('all')}
          >
            All Tasks
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-foreground">All caught up!</h3>
              <p className="text-sm text-muted-foreground mt-1">No tasks match your current filter.</p>
            </div>
          ) : (
            <div className="relative">
              {filter !== 'completed' && (
                <>
                  {overdue.length > 0 && (
                    <>
                      <GroupHeader title="Overdue" count={overdue.length} colorClass="text-destructive" />
                      {overdue.map(t => <TaskRow key={t.id} task={t} />)}
                    </>
                  )}
                  
                  {today.length > 0 && (
                    <>
                      <GroupHeader title="Today" count={today.length} colorClass="text-brand" />
                      {today.map(t => <TaskRow key={t.id} task={t} />)}
                    </>
                  )}
                  
                  {upcoming.length > 0 && (
                    <>
                      <GroupHeader title="Upcoming" count={upcoming.length} />
                      {upcoming.map(t => <TaskRow key={t.id} task={t} />)}
                    </>
                  )}
                  
                  {noDate.length > 0 && (
                    <>
                      <GroupHeader title="No Date" count={noDate.length} />
                      {noDate.map(t => <TaskRow key={t.id} task={t} />)}
                    </>
                  )}
                </>
              )}

              {(filter === 'completed' || filter === 'all') && completed.length > 0 && (
                <>
                  <GroupHeader title="Completed" count={completed.length} />
                  {completed.map(t => <TaskRow key={t.id} task={t} />)}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <NewTaskModal open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />
      <TaskDetailModal task={selectedTask} open={!!selectedTask} onOpenChange={(o) => !o && setSelectedTask(null)} />
    </>
  );
}
