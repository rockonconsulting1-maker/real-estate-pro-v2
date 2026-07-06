import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useSurface } from '@/hooks/use-surface';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';
import { contactsService } from '@/lib/ghl/services/contacts';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, User, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string; // Pre-selected contact
}

export function NewTaskModal({ open, onOpenChange, contactId: initialContactId }: NewTaskModalProps) {
  const isDesktop = useSurface() === 'desktop';
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [contactId, setContactId] = useState(initialContactId || '');

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setDueDate(new Date());
      setContactId(initialContactId || '');
    }
  }, [open, initialContactId]);

  // Fetch contacts for the picker
  const { data: contactsData } = useQuery({
    queryKey: ghl.contacts({ limit: 50 }),
    queryFn: () => contactsService.search({ limit: 50 }),
    enabled: open && !initialContactId,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!contactId) throw new Error('Contact is required');
      return tasksGlobalService.create(contactId, {
        title,
        body,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        completed: false,
        status: 'incomplete'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.tasks() });
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: ['ghl', 'contact', contactId, 'tasks'] });
      }
      toast.success('Task created');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create task');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error('Title is required');
    if (!contactId) return toast.error('Please select a contact');
    createMutation.mutate();
  };

  const formContent = (
    <form id="new-task-form" onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          placeholder="e.g. Follow up on offer" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
        />
      </div>

      {!initialContactId && (
        <div className="space-y-2">
          <Label>Contact</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              {(contactsData?.contacts || []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Due Date</Label>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDueDate(new Date())}>Today</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setDueDate(addDays(new Date(), 1))}>Tomorrow</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setDueDate(addDays(new Date(), 7))}>Next Week</Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea 
          placeholder="Additional details..." 
          value={body} 
          onChange={e => setBody(e.target.value)} 
          className="min-h-[100px]"
        />
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" form="new-task-form" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-1">
          {formContent}
        </div>
        <SheetFooter className="mt-4 pt-4 border-t">
          <Button type="submit" form="new-task-form" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving...' : 'Save Task'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface TaskDetailModalProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const isDesktop = useSurface() === 'desktop';
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title || '');
      setBody(task.body || '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setCompleted(task.completed || false);
    }
  }, [task, open]);

  const updateMutation = useMutation({
    mutationFn: () => tasksGlobalService.update(task.contactId, task.id, {
      title,
      body,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      completed,
      status: completed ? 'completed' : 'incomplete'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.tasks() });
      queryClient.invalidateQueries({ queryKey: ['ghl', 'contact', task.contactId, 'tasks'] });
      toast.success('Task updated');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update task')
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksGlobalService.delete(task.contactId, task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.tasks() });
      queryClient.invalidateQueries({ queryKey: ['ghl', 'contact', task.contactId, 'tasks'] });
      toast.success('Task deleted');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to delete task')
  });

  if (!task) return null;

  const formContent = (
    <form id="edit-task-form" onSubmit={e => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4 py-4">
      <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
        <Checkbox 
          checked={completed} 
          onCheckedChange={(c) => setCompleted(!!c)}
          id="task-completed"
        />
        <Label htmlFor="task-completed" className="font-semibold cursor-pointer">
          Mark as completed
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          className={completed ? "line-through text-muted-foreground" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea 
          value={body} 
          onChange={e => setBody(e.target.value)} 
          className="min-h-[100px]"
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          type="button" 
          variant="destructive" 
          onClick={() => {
            if (confirm('Are you sure you want to delete this task?')) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Task
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" form="edit-task-form" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-1">
          {formContent}
        </div>
        <SheetFooter className="mt-4 pt-4 border-t flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="edit-task-form" className="flex-1" disabled={updateMutation.isPending}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
