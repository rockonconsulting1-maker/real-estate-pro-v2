import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PipelineRegistry } from '@/lib/pipeline-registry';

interface EditStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  currentStageId: string;
  pipelineId: string;
}

export function EditStageDialog({ open, onOpenChange, opportunityId, currentStageId, pipelineId }: EditStageDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = React.useState(currentStageId);

  // Find pipeline by ID
  const pipelines = [PipelineRegistry.byName('buyer'), PipelineRegistry.byName('seller')];
  const pipeline = pipelines.find(p => p?.id === pipelineId);

  const mutation = useMutation({
    mutationFn: (stageId: string) => opportunitiesService.update(opportunityId, { pipelineStageId: stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      queryClient.invalidateQueries({ queryKey: ghl.opp(opportunityId) });
      toast({ title: 'Stage Updated' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update stage.', variant: 'destructive' });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Stage</DialogTitle>
          <DialogDescription>Move this client to a different stage in the pipeline.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label className="mb-2 block">Pipeline Stage</Label>
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {pipeline?.stages?.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate(selectedStage)} disabled={mutation.isPending || selectedStage === currentStageId}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CloseClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
}

export function CloseClientDialog({ open, onOpenChange, opportunityId }: CloseClientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<'won' | 'lost' | 'abandoned'>('won');

  const mutation = useMutation({
    mutationFn: (newStatus: 'won' | 'lost' | 'abandoned') => opportunitiesService.updateStatus(opportunityId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      queryClient.invalidateQueries({ queryKey: ghl.opp(opportunityId) });
      toast({ title: 'Client Closed', description: `Opportunity marked as ${status}.` });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to close client.', variant: 'destructive' });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Close Client</DialogTitle>
          <DialogDescription>Mark this opportunity as Won, Lost, or Abandoned.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label className="mb-2 block">Status</Label>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="won">Won (Closed)</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate(status)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
