import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService, tasksGlobalService, notesService } from '@/lib/ghl/services';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/shared/primitives';
import { RoleBadge, TempBadge, StageDot, Money } from '@/components/shared/primitives';
import { Phone, MessageSquare, Mail, FileText, CheckSquare, Clock, Edit2, Calendar as CalendarIcon } from 'lucide-react';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ConvertLeadDialog } from './convert-lead-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesktopLeadDetailProps {
  opportunityId: string;
}

export function DesktopLeadDetail({ opportunityId }: DesktopLeadDetailProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const leadPipeline = PipelineRegistry.byName('lead');
  
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch Opportunity
  const { data: opp, isLoading: oppLoading } = useQuery({
    queryKey: ghl.opp(opportunityId),
    queryFn: () => opportunitiesService.get(opportunityId),
  });

  const contactId = opp?.contactId;

  // Fetch Contact
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ghl.contact(contactId!),
    queryFn: () => contactsService.get(contactId!),
    enabled: !!contactId,
  });

  // Fetch Tasks
  const { data: tasksData } = useQuery({
    queryKey: ghl.tasks({ contactId }),
    queryFn: () => tasksGlobalService.search({ contactId }),
    enabled: !!contactId,
  });

  // Fetch Notes
  const { data: notes } = useQuery({
    queryKey: ghl.notes(contactId!),
    queryFn: () => notesService.list(contactId!),
    enabled: !!contactId,
  });

  // Fetch Appointments
  const { data: appointments } = useQuery({
    queryKey: ghl.contactAppointments(contactId!),
    queryFn: () => contactsService.appointments(contactId!),
    enabled: !!contactId,
  });

  const updateStage = useMutation({
    mutationFn: (stageId: string) => opportunitiesService.update(opportunityId, { pipelineStageId: stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opp(opportunityId) });
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      toast.success('Stage updated');
    },
    onError: () => {
      toast.error('Failed to update stage');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => opportunitiesService.delete(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      toast.success('Lead deleted');
      navigate('/leads');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    }
  });

  if (oppLoading || (contactId && contactLoading)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!opp) return <div className="p-8 text-muted-foreground text-center">Lead not found</div>;

  const tags = contact?.tags || [];
  let temp: 'hot' | 'warm' | 'cold' | undefined;
  if (tags.includes('temperature:hot')) temp = 'hot';
  else if (tags.includes('temperature:warm')) temp = 'warm';
  else if (tags.includes('temperature:cold')) temp = 'cold';

  let role: 'buyer' | 'seller' | 'investor' | undefined;
  if (tags.includes('role:buyer')) role = 'buyer';
  else if (tags.includes('role:seller')) role = 'seller';
  else if (tags.includes('role:investor')) role = 'investor';

  const name = opp.name || contact?.firstName ? `${contact?.firstName} ${contact?.lastName || ''}` : 'Unknown';
  const isBuyer = role === 'buyer';
  const isSeller = role === 'seller';

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-border bg-surface">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Avatar name={name} className="w-16 h-16 text-xl" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
                {role && <RoleBadge role={role} />}
                {temp && <TempBadge temp={temp} />}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {contact?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                  </div>
                )}
                {contact?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {contact.email}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full"><Phone className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full"><MessageSquare className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full"><Mail className="w-4 h-4" /></Button>
            <Button variant="default" className="rounded-full" onClick={() => setConvertOpen(true)}>
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Convert
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Stage:</div>
            <Select 
              value={opp.pipelineStageId} 
              onValueChange={(val) => updateStage.mutate(val)}
            >
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <div className="flex items-center gap-2">
                  <StageDot stageId={opp.pipelineStageId} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {leadPipeline?.stages.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <StageDot stageId={s.id} />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last contact: {opp.updatedAt ? formatDistanceToNow(new Date(opp.updatedAt), { addSuffix: true }) : 'Never'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isSeller ? "seller-info" : "buyer-info"} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 border-b border-border bg-surface">
          <TabsList className="h-12 bg-transparent space-x-6 p-0">
            {isSeller ? (
              <TabsTrigger value="seller-info" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Seller Info</TabsTrigger>
            ) : (
              <TabsTrigger value="buyer-info" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Buyer Info</TabsTrigger>
            )}
            <TabsTrigger value="properties" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Properties</TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Appointments</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Tasks</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Notes</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Activity</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 bg-background p-6">
          <TabsContent value="buyer-info" className="m-0 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Budget</div>
                <div className="font-medium">{opp.monetaryValue ? <Money amount={opp.monetaryValue} /> : 'Not set'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Pre-Approval</div>
                <div className="font-medium">Not set</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Timeline</div>
                <div className="font-medium">ASAP</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="font-medium capitalize">{contact?.source || 'Unknown'}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seller-info" className="m-0 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Target Price</div>
                <div className="font-medium">{opp.monetaryValue ? <Money amount={opp.monetaryValue} /> : 'Not set'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Property Address</div>
                <div className="font-medium">Not set</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Urgency</div>
                <div className="font-medium">ASAP</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="font-medium capitalize">{contact?.source || 'Unknown'}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="m-0 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Tasks</h3>
              <Button size="sm"><CheckSquare className="w-4 h-4 mr-2" /> Add Task</Button>
            </div>
            {tasksData?.tasks?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No tasks found</div>
            ) : (
              <div className="space-y-2">
                {tasksData?.tasks?.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
                    <input type="checkbox" checked={t.completed} readOnly className="w-4 h-4 rounded border-border" />
                    <div className="flex-1">
                      <div className={`font-medium ${t.completed ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                      {t.dueDate && <div className="text-xs text-muted-foreground">{format(new Date(t.dueDate), 'MMM d, yyyy')}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="m-0 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Notes</h3>
              <Button size="sm"><FileText className="w-4 h-4 mr-2" /> Add Note</Button>
            </div>
            {notes?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No notes found</div>
            ) : (
              <div className="space-y-3">
                {notes?.map(n => (
                  <div key={n.id} className="p-4 bg-surface border border-border rounded-lg">
                    <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                    {n.dateAdded && <div className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(n.dateAdded), { addSuffix: true })}</div>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="m-0 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Appointments</h3>
              <Button size="sm"><CalendarIcon className="w-4 h-4 mr-2" /> New Event</Button>
            </div>
            {appointments?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No appointments found</div>
            ) : (
              <div className="space-y-3">
                {appointments?.map(a => (
                  <div key={a.id} className="p-4 bg-surface border border-border rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(a.startTime), 'MMM d, yyyy h:mm a')}</div>
                    </div>
                    <Badge variant="secondary">{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">Activity timeline coming soon</div>
          </TabsContent>

          <TabsContent value="properties" className="m-0">
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">Properties coming soon</div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <ConvertLeadDialog 
        open={convertOpen} 
        onOpenChange={setConvertOpen} 
        opportunityId={opportunityId} 
        contactId={contactId}
        currentValue={opp.monetaryValue}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the opportunity. The contact record will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
