import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService, tasksGlobalService, notesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { Avatar, StageDot, Money } from '@/components/shared/primitives';
import { BuyerOverviewTab, BuyerPropertiesTab, BuyerOffersTab, BuyerAppointmentsTab, BuyerTasksTab, BuyerNotesTab, BuyerActivityTab, BuyerDocumentsTab } from './buyer-tabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, StickyNote, Calendar as CalendarIcon, ArrowLeft, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditStageDialog, CloseClientDialog } from './client-modals';

export function MobileBuyerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [advanceStageOpen, setAdvanceStageOpen] = useState(false);
  const [editStageOpen, setEditStageOpen] = useState(false);
  const [closeClientOpen, setCloseClientOpen] = useState(false);

  const { data: opp, isLoading: oppLoading } = useQuery({
    queryKey: ghl.opp(id!),
    queryFn: () => opportunitiesService.get(id!),
    enabled: !!id,
  });

  const contactId = opp?.contactId;

  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ghl.contact(contactId!),
    queryFn: () => contactsService.get(contactId!),
    enabled: !!contactId,
  });

  const { data: tasksData } = useQuery({
    queryKey: ghl.tasks({ contactId }),
    queryFn: () => tasksGlobalService.search({ contactId }),
    enabled: !!contactId,
  });

  const { data: notes } = useQuery({
    queryKey: ghl.notes(contactId!),
    queryFn: () => notesService.list(contactId!),
    enabled: !!contactId,
  });

  const { data: appointments } = useQuery({
    queryKey: ghl.contactAppointments(contactId!),
    queryFn: () => contactsService.appointments(contactId!),
    enabled: !!contactId,
  });

  const isLoading = oppLoading || contactLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!opp || !contact) {
    return <EmptyState title="Not Found" description="Buyer details could not be loaded." />;
  }

  const pipeline = PipelineRegistry.byName('buyer');
  const stage = pipeline?.stages?.find(s => s.id === opp.pipelineStageId);
  const stageIndex = pipeline?.stages?.findIndex(s => s.id === opp.pipelineStageId) ?? 0;
  const nextStage = pipeline?.stages?.[stageIndex + 1];

  const advanceStageMutation = useMutation({
    mutationFn: (stageId: string) => opportunitiesService.update(opp.id, { pipelineStageId: stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opp(opp.id) });
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      toast.success('Stage advanced');
      setAdvanceStageOpen(false);
    },
    onError: () => {
      toast.error('Failed to advance stage');
    }
  });

  return (
    <div className="flex flex-col h-full bg-bg-sunk relative">
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4 pb-2">
          <button onClick={() => navigate(-1)} className="touch-target -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar name={contact.firstName + ' ' + contact.lastName} className="w-12 h-12" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg truncate">{contact.firstName} {contact.lastName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StageDot stageId={stage?.id || ''} />
              <span className="truncate">{stage?.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditStageOpen(true)}>Change Stage</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCloseClientOpen(true)}>Close Client</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Step progress */}
        <div className="px-4 pb-4">
          <div className="flex gap-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            {pipeline?.stages?.map((s, i) => (
              <div 
                key={s.id} 
                className={`flex-1 h-full ${i <= stageIndex ? 'bg-primary' : 'bg-transparent'}`}
                style={i <= stageIndex ? { backgroundColor: `var(--stage-${s.id}-color, var(--primary))` } : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Budget</span>
            <span className="font-semibold"><Money amount={opp.monetaryValue || 0} compact /></span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Pre-Approval</span>
            <span className="font-semibold truncate">{(contact.customFields as any)?.pre_approval ? 'Yes' : 'Pending'}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Active Offer</span>
            <span className="font-semibold">-</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Target Close</span>
            <span className="font-semibold">-</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-background px-4 h-12 shrink-0 overflow-x-auto hide-scrollbar">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <div className="p-4 pb-24">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <BuyerOverviewTab contact={contact} opp={opp} />
            </TabsContent>
            <TabsContent value="properties" className="mt-0">
              <BuyerPropertiesTab contact={contact} opp={opp} />
            </TabsContent>
            <TabsContent value="offers" className="mt-0">
              <BuyerOffersTab contact={contact} opp={opp} />
            </TabsContent>
            <TabsContent value="appointments" className="mt-0">
              <BuyerAppointmentsTab contact={contact} opp={opp} appointments={appointments || []} />
            </TabsContent>
            <TabsContent value="tasks" className="mt-0">
              <BuyerTasksTab contact={contact} opp={opp} tasks={tasksData?.tasks || []} />
            </TabsContent>
            <TabsContent value="notes" className="mt-0">
              <BuyerNotesTab contact={contact} opp={opp} notes={notes || []} />
            </TabsContent>
            <TabsContent value="activity" className="mt-0">
              <BuyerActivityTab />
            </TabsContent>
            <TabsContent value="documents" className="mt-0">
              <BuyerDocumentsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-safe flex gap-2">
        <Button variant="outline" size="icon" className="flex-1 h-12 rounded-xl"><Phone className="h-5 w-5" /></Button>
        <Button variant="outline" size="icon" className="flex-1 h-12 rounded-xl"><MessageSquare className="h-5 w-5" /></Button>
        <Button variant="outline" size="icon" className="flex-1 h-12 rounded-xl"><StickyNote className="h-5 w-5" /></Button>
        <Button variant="outline" size="icon" className="flex-1 h-12 rounded-xl"><CalendarIcon className="h-5 w-5" /></Button>
        <Button 
          className="flex-[2] h-12 rounded-xl" 
          disabled={!nextStage || advanceStageMutation.isPending}
          onClick={() => setAdvanceStageOpen(true)}
        >
          {nextStage ? 'Next Stage' : 'Completed'}
        </Button>
      </div>

      <AlertDialog open={advanceStageOpen} onOpenChange={setAdvanceStageOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advance Stage?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this buyer to <strong>{nextStage?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => nextStage && advanceStageMutation.mutate(nextStage.id)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditStageDialog 
        open={editStageOpen} 
        onOpenChange={setEditStageOpen} 
        opportunityId={opp.id} 
        currentStageId={opp.pipelineStageId} 
        pipelineId={pipeline!.id} 
      />
      
      <CloseClientDialog 
        open={closeClientOpen} 
        onOpenChange={setCloseClientOpen} 
        opportunityId={opp.id} 
      />
    </div>
  );
}
