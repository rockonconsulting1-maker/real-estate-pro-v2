import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesService, contactsService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { ghl } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useSurface } from '@/hooks/use-surface';
import { useNavigate } from 'react-router-dom';

const convertLeadSchema = z.object({
  pipelineId: z.string().min(1, 'Pipeline is required'),
  stageId: z.string().min(1, 'Stage is required'),
  monetaryValue: z.coerce.number().optional(),
});

type ConvertLeadForm = z.infer<typeof convertLeadSchema>;

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  contactId?: string;
  currentValue?: number;
}

export function ConvertLeadDialog({ open, onOpenChange, opportunityId, contactId, currentValue }: ConvertLeadDialogProps) {
  const surface = useSurface();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');
  
  const pipelines = [];
  if (buyerPipeline) pipelines.push(buyerPipeline);
  if (sellerPipeline) pipelines.push(sellerPipeline);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ConvertLeadForm>({
    resolver: zodResolver(convertLeadSchema),
    defaultValues: {
      pipelineId: buyerPipeline?.id || '',
      stageId: buyerPipeline?.stages?.[0]?.id || '',
      monetaryValue: currentValue || undefined,
    }
  });

  const selectedPipelineId = watch('pipelineId');
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const selectedStageId = watch('stageId');

  const convertMutation = useMutation({
    mutationFn: async (data: ConvertLeadForm) => {
      // 1. Move opportunity to new pipeline
      await opportunitiesService.update(opportunityId, {
        pipelineId: data.pipelineId,
        pipelineStageId: data.stageId,
        monetaryValue: data.monetaryValue,
      });

      // 2. Apply lifecycle tag to contact
      if (contactId) {
        await contactsService.addTags(contactId, ['lifecycle:client']);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      queryClient.invalidateQueries({ queryKey: ghl.opp(opportunityId) });
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: ghl.contact(contactId) });
      }
      toast.success('Lead converted to client');
      onOpenChange(false);
      navigate(`/clients/${opportunityId}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to convert lead');
    }
  });

  const onSubmit = (data: ConvertLeadForm) => {
    convertMutation.mutate(data);
  };

  const Content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Target Pipeline</Label>
        <Select 
          value={selectedPipelineId} 
          onValueChange={(v) => {
            setValue('pipelineId', v);
            const p = pipelines.find(pipe => pipe.id === v);
            if (p && p.stages.length > 0) {
              setValue('stageId', p.stages[0].id);
            }
          }}
        >
          <SelectTrigger><SelectValue placeholder="Select pipeline" /></SelectTrigger>
          <SelectContent>
            {pipelines.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Starting Stage</Label>
        <Select value={selectedStageId} onValueChange={(v) => setValue('stageId', v)}>
          <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
          <SelectContent>
            {selectedPipeline?.stages.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Value / Budget</Label>
        <Input {...register('monetaryValue')} type="number" placeholder="500000" />
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" disabled={convertMutation.isPending}>
          {convertMutation.isPending ? 'Converting...' : 'Convert to Client'}
        </Button>
      </div>
    </form>
  );

  if (surface === 'desktop') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert Lead</DialogTitle>
            <DialogDescription>Move this lead into a client pipeline.</DialogDescription>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Convert Lead</SheetTitle>
          <SheetDescription>Move this lead into a client pipeline.</SheetDescription>
        </SheetHeader>
        {Content}
      </SheetContent>
    </Sheet>
  );
}
