import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService, contactsService, tasksGlobalService, notesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { Avatar, StageDot, Money } from '@/components/shared/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, StickyNote, Calendar as CalendarIcon, X, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditStageDialog, CloseClientDialog } from './client-modals';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { SellerOverviewTab, SellerListingTab, SellerOffersTab, SellerShowingsTab, SellerMarketingTab, SellerTasksTab, SellerNotesTab, SellerActivityTab, SellerDocumentsTab } from './seller-tabs';

export function DesktopSellerDetail() {
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
      <div className="flex flex-col h-full bg-background p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!opp || !contact) {
    return <EmptyState title="Not Found" description="Seller details could not be loaded." />;
  }

  const pipeline = PipelineRegistry.byName('seller');
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
    <div className="flex flex-col h-full bg-background border-l border-border w-[600px] shrink-0">
      <div className="p-6 border-b border-border flex flex-col gap-6 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={contact.firstName + ' ' + contact.lastName} className="w-16 h-16" />
            <div>
              <h2 className="text-xl font-semibold">{contact.firstName} {contact.lastName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <StageDot stageId={stage?.id || ''} />
                <span>{stage?.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><MessageSquare className="h-4 w-4" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditStageOpen(true)}>Change Stage</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCloseClientOpen(true)}>Close Client</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}><X className="h-5 w-5" /></Button>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex gap-1 h-2 w-full bg-secondary rounded-full overflow-hidden">
          {pipeline?.stages?.map((s, i) => (
            <div 
              key={s.id} 
              className={`flex-1 h-full ${i <= stageIndex ? 'bg-primary' : 'bg-transparent'}`}
              style={i <= stageIndex ? { backgroundColor: `var(--stage-${s.id}-color, var(--primary))` } : undefined}
            />
          ))}
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">List Price</span>
            <span className="font-semibold"><Money amount={opp.monetaryValue || 0} compact /></span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">High Offer</span>
            <span className="font-semibold">-</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Days on Market</span>
            <span className="font-semibold">-</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-bg-sunk">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <div className="w-full border-b border-border bg-background px-6 shrink-0">
            <TabsList className="h-12 bg-transparent space-x-6 p-0 justify-start w-full overflow-x-auto hide-scrollbar">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Overview</TabsTrigger>
              <TabsTrigger value="listing" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Listing</TabsTrigger>
              <TabsTrigger value="offers" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Offers</TabsTrigger>
              <TabsTrigger value="showings" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Showings</TabsTrigger>
              <TabsTrigger value="marketing" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Marketing</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Tasks</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Notes</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Activity</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-brand rounded-none px-0 h-12">Documents</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="mt-0">
              <SellerOverviewTab contact={contact} opp={opp} />
            </TabsContent>
            <TabsContent value="listing" className="mt-0">
              <SellerListingTab contact={contact} opp={opp} />
            </TabsContent>
            <TabsContent value="offers" className="m-0">
              <SellerOffersTab contact={contact} opp={opp} />
            </TabsContent>
            <TabsContent value="showings" className="m-0">
              <SellerShowingsTab contact={contact} opp={opp} appointments={appointments || []} />
            </TabsContent>
            <TabsContent value="marketing" className="m-0">
              <SellerMarketingTab />
            </TabsContent>
            <TabsContent value="tasks" className="m-0">
              <SellerTasksTab contact={contact} opp={opp} tasks={tasksData?.tasks || []} />
            </TabsContent>
            <TabsContent value="notes" className="m-0">
              <SellerNotesTab contact={contact} opp={opp} notes={notes || []} />
            </TabsContent>
            <TabsContent value="activity" className="m-0">
              <SellerActivityTab />
            </TabsContent>
            <TabsContent value="documents" className="m-0">
              <SellerDocumentsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      <div className="p-4 border-t border-border bg-background shrink-0 flex justify-end">
        <Button 
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
              Are you sure you want to move this seller to <strong>{nextStage?.name}</strong>?
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
