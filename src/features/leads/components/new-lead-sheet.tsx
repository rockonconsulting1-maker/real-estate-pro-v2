import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService, opportunitiesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { ghl } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSurface } from '@/hooks/use-surface';

const newLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller', 'investor']),
  temperature: z.enum(['hot', 'warm', 'cold']),
  budget: z.coerce.number().optional(),
  source: z.string().optional(),
});

type NewLeadForm = z.infer<typeof newLeadSchema>;

interface NewLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLeadSheet({ open, onOpenChange }: NewLeadSheetProps) {
  const surface = useSurface();
  const queryClient = useQueryClient();
  const leadPipeline = PipelineRegistry.byName('lead');

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<NewLeadForm>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      role: 'buyer',
      temperature: 'warm',
    }
  });

  const role = watch('role');
  const temp = watch('temperature');

  const createMutation = useMutation({
    mutationFn: async (data: NewLeadForm) => {
      // 1. Create Contact
      const tags = [`role:${data.role}`, `temperature:${data.temperature}`];
      const contact = await contactsService.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        source: data.source,
        tags,
      });

      // 2. Create Opportunity
      if (leadPipeline && leadPipeline.stages.length > 0) {
        await opportunitiesService.create({
          pipelineId: leadPipeline.id,
          pipelineStageId: leadPipeline.stages[0].id,
          contactId: contact.id,
          name: `${data.firstName} ${data.lastName || ''}`.trim(),
          monetaryValue: data.budget,
          status: 'open'
        });
      }
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      queryClient.invalidateQueries({ queryKey: ghl.contacts() });
      toast.success('Lead created successfully');
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create lead');
    }
  });

  const onSubmit = (data: NewLeadForm) => {
    createMutation.mutate(data);
  };

  const Content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input {...register('firstName')} placeholder="Jane" />
          {errors.firstName && <span className="text-xs text-destructive">{errors.firstName.message}</span>}
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input {...register('lastName')} placeholder="Doe" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register('email')} type="email" placeholder="jane@example.com" />
          {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input {...register('phone')} placeholder="555-123-4567" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v: any) => setValue('role', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Temperature</Label>
          <Select value={temp} onValueChange={(v: any) => setValue('temperature', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Budget / Target Price</Label>
          <Input {...register('budget')} type="number" placeholder="500000" />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <Input {...register('source')} placeholder="Zillow, Referral..." />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );

  if (surface === 'desktop') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
            <DialogDescription>Add a new lead to your pipeline.</DialogDescription>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>New Lead</SheetTitle>
          <SheetDescription>Add a new lead to your pipeline.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-1">{Content}</div>
      </SheetContent>
    </Sheet>
  );
}
