import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { contactsService } from '@/lib/ghl/services/contacts';
import { format } from 'date-fns';
import { Clock, MapPin, User, FileText, Calendar as CalendarIcon, Trash2, Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSurface } from '@/hooks/use-surface';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface EventDetailModalProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({ id, open, onOpenChange }: EventDetailModalProps) {
  const isDesktop = useSurface() === 'desktop';
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['ghl', 'event', id],
    queryFn: () => id ? calendarsService.getAppointment(id) : Promise.reject('No ID'),
    enabled: !!id && open,
  });

  const { data: contact } = useQuery({
    queryKey: ghl.contact(event?.contactId || ''),
    queryFn: () => event?.contactId ? contactsService.get(event.contactId) : Promise.reject('No contact ID'),
    enabled: !!event?.contactId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => calendarsService.updateAppointment(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.events() });
      queryClient.invalidateQueries({ queryKey: ['ghl', 'event', id] });
      toast.success('Status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => calendarsService.deleteAppointment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.events() });
      toast.success('Appointment deleted');
      onOpenChange(false);
    }
  });

  const content = (
    <>
      <div className="space-y-6">
        {isLoading || !event ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold">{event.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-ink capitalize">
                  {event.status || 'Scheduled'}
                </span>
              </div>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                  </p>
                </div>
              </div>

              {contact?.contact && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                  <p className="font-medium">{(contact.contact as any).firstName} {(contact.contact as any).lastName}</p>
                  <p className="text-sm text-muted-foreground">{(contact.contact as any).phone || (contact.contact as any).email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Calendar ID</p>
                  <p className="text-sm text-muted-foreground">{event.calendarId}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => updateStatusMutation.mutate('confirmed')}
                disabled={event.status === 'confirmed'}
              >
                Confirm
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => updateStatusMutation.mutate('showed')}
                disabled={event.status === 'showed'}
              >
                Showed
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => updateStatusMutation.mutate('noshow')}
                disabled={event.status === 'noshow'}
              >
                No-Show
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {content}
          <DialogFooter className="mt-6 flex sm:justify-between">
            <Button variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto overflow-y-auto rounded-t-[20px]">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Event Details</SheetTitle>
        </SheetHeader>
        {content}
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="outline" className="w-full text-destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            Delete Appointment
          </Button>
          <Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface NewEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewEventModal({ open, onOpenChange }: NewEventModalProps) {
  const isDesktop = useSurface() === 'desktop';
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    contactId: '',
    calendarId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: '30'
  });

  const { data: calendars } = useQuery({
    queryKey: ghl.calendars(),
    queryFn: () => calendarsService.list(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(formData.duration) * 60000);

      await calendarsService.createAppointment({
        title: formData.title,
        contactId: formData.contactId,
        calendarId: formData.calendarId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'new'
      });

      toast.success('Event scheduled');
      queryClient.invalidateQueries({ queryKey: ghl.events() });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule event');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <form id="new-event-form" onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input 
          id="title" 
          value={formData.title} 
          onChange={e => setFormData(p => ({...p, title: e.target.value}))} 
          required 
          placeholder="e.g. Property Showing"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="calendarId">Calendar</Label>
        <Select 
          value={formData.calendarId} 
          onValueChange={v => setFormData(p => ({...p, calendarId: v}))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Calendar" />
          </SelectTrigger>
          <SelectContent>
            {(calendars || []).map(cal => (
              <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactId">Contact ID</Label>
        <Input 
          id="contactId" 
          value={formData.contactId} 
          onChange={e => setFormData(p => ({...p, contactId: e.target.value}))} 
          required 
          placeholder="Enter Contact ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date" 
            type="date"
            value={formData.date} 
            onChange={e => setFormData(p => ({...p, date: e.target.value}))} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input 
            id="time" 
            type="time"
            value={formData.time} 
            onChange={e => setFormData(p => ({...p, time: e.target.value}))} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Select 
          value={formData.duration} 
          onValueChange={v => setFormData(p => ({...p, duration: v}))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="90">1.5 hours</SelectItem>
            <SelectItem value="120">2 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
          </DialogHeader>
          {content}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" form="new-event-form" disabled={loading}>
              {loading ? 'Saving...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-[20px]">
        <SheetHeader className="text-left">
          <SheetTitle>Schedule Event</SheetTitle>
        </SheetHeader>
        {content}
        <div className="mt-6 flex flex-col gap-3 pb-6">
          <Button type="submit" form="new-event-form" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Schedule Event'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
