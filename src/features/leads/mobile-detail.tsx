import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService, tasksGlobalService, notesService } from '@/lib/ghl/services';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/shared/primitives';
import { RoleBadge, TempBadge, StageDot, Money } from '@/components/shared/primitives';
import { Phone, MessageSquare, Mail, FileText, CheckSquare, Clock, ArrowLeft, MoreVertical, Calendar as CalendarIcon, ArrowRightLeft, Trash2 } from 'lucide-react';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ConvertLeadDialog } from './components/convert-lead-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function MobileLeadDetail() {
  const { id: opportunityId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const leadPipeline = PipelineRegistry.byName('lead');
  
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch Opportunity
  const { data: opp, isLoading: oppLoading } = useQuery({
    queryKey: ghl.opp(opportunityId!),
    queryFn: () => opportunitiesService.get(opportunityId!),
    enabled: !!opportunityId,
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
    mutationFn: (stageId: string) => opportunitiesService.update(opportunityId!, { pipelineStageId: stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opp(opportunityId!) });
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      toast.success('Stage updated');
    },
    onError: () => {
      toast.error('Failed to update stage');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => opportunitiesService.delete(opportunityId!),
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
      <div className="flex flex-col h-full bg-background">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-[200px] w-full" />
        </div>
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
    <div className="flex flex-col h-full bg-background pb-20">
      {/* Top Nav */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-8 w-8 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="font-semibold">{name}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setConvertOpen(true)}>
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Convert Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Header Content */}
        <div className="p-4 bg-surface border-b border-border space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={name} className="w-16 h-16 text-xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {role && <RoleBadge role={role} />}
                {temp && <TempBadge temp={temp} />}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {contact?.phone || contact?.email || 'No contact info'}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {opp.updatedAt ? formatDistanceToNow(new Date(opp.updatedAt), { addSuffix: true }) : 'Never'}
              </div>
            </div>
          </div>

          <Select 
            value={opp.pipelineStageId} 
            onValueChange={(val) => updateStage.mutate(val)}
          >
            <SelectTrigger className="w-full h-10">
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

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-full"><Phone className="w-4 h-4 mr-2" /> Call</Button>
            <Button variant="outline" className="flex-1 rounded-full"><MessageSquare className="w-4 h-4 mr-2" /> Text</Button>
            <Button variant="outline" className="flex-1 rounded-full"><Mail className="w-4 h-4 mr-2" /> Email</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={isSeller ? "seller-info" : "buyer-info"} className="w-full mt-2">
          <ScrollArea className="w-full bg-surface border-b border-border">
            <TabsList className="h-12 bg-transparent w-full justify-start px-4">
              {isSeller ? (
                <TabsTrigger value="seller-info" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Seller Info</TabsTrigger>
              ) : (
                <TabsTrigger value="buyer-info" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Buyer Info</TabsTrigger>
              )}
              <TabsTrigger value="properties" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Properties</TabsTrigger>
              <TabsTrigger value="appointments" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Appointments</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Tasks</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Notes</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-4 h-12">Activity</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>

          <div className="p-4">
            <TabsContent value="buyer-info" className="m-0 space-y-4">
              <div className="bg-surface p-4 rounded-xl border border-border space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="text-sm text-muted-foreground">Budget</div>
                  <div className="font-medium">{opp.monetaryValue ? <Money amount={opp.monetaryValue} /> : 'Not set'}</div>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="text-sm text-muted-foreground">Pre-Approval</div>
                  <div className="font-medium">Not set</div>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="text-sm text-muted-foreground">Timeline</div>
                  <div className="font-medium">ASAP</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Source</div>
                  <div className="font-medium capitalize">{contact?.source || 'Unknown'}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seller-info" className="m-0 space-y-4">
              <div className="bg-surface p-4 rounded-xl border border-border space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="text-sm text-muted-foreground">Target Price</div>
                  <div className="font-medium">{opp.monetaryValue ? <Money amount={opp.monetaryValue} /> : 'Not set'}</div>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="text-sm text-muted-foreground">Property Address</div>
                  <div className="font-medium">Not set</div>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="text-sm text-muted-foreground">Urgency</div>
                  <div className="font-medium">ASAP</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Source</div>
                  <div className="font-medium capitalize">{contact?.source || 'Unknown'}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="m-0 space-y-4">
              <Button className="w-full rounded-full" variant="outline"><CheckSquare className="w-4 h-4 mr-2" /> Add Task</Button>
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
              <Button className="w-full rounded-full" variant="outline"><FileText className="w-4 h-4 mr-2" /> Add Note</Button>
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
              <Button className="w-full rounded-full" variant="outline"><CalendarIcon className="w-4 h-4 mr-2" /> New Event</Button>
              {appointments?.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No appointments found</div>
              ) : (
                <div className="space-y-3">
                {(appointments as any[])?.map(a => (
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
            
            <TabsContent value="properties" className="m-0">
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">Properties coming soon</div>
            </TabsContent>

            <TabsContent value="activity" className="m-0">
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">Activity coming soon</div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <ConvertLeadDialog 
        open={convertOpen} 
        onOpenChange={setConvertOpen} 
        opportunityId={opportunityId!} 
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
