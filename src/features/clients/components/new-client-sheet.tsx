import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService, opportunitiesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { ghl } from '@/lib/queryKeys';
import { useToast } from '@/components/ui/use-toast';

const newClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  type: z.enum(['buyer', 'seller']),
  stageId: z.string().min(1, 'Stage is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  budgetOrPrice: z.string().optional(),
  propertyAddress: z.string().optional(),
});

type NewClientFormValues = z.infer<typeof newClientSchema>;

interface NewClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'buyer' | 'seller';
}

export function NewClientSheet({ open, onOpenChange, defaultType = 'buyer' }: NewClientSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const buyerPipeline = PipelineRegistry.byName('buyer');
  const sellerPipeline = PipelineRegistry.byName('seller');

  const form = useForm<NewClientFormValues>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      type: defaultType,
      stageId: '',
      phone: '',
      email: '',
      budgetOrPrice: '',
      propertyAddress: '',
    },
  });

  const selectedType = form.watch('type');
  const activePipeline = selectedType === 'buyer' ? buyerPipeline : sellerPipeline;

  // Update stageId when type changes to avoid invalid stage selection
  React.useEffect(() => {
    if (activePipeline?.stages?.length) {
      form.setValue('stageId', activePipeline.stages[0].id);
    }
  }, [selectedType, activePipeline, form]);

  const createMutation = useMutation({
    mutationFn: async (data: NewClientFormValues) => {
      // 1. Create Contact
      const customFields: any[] = [];
      if (data.type === 'buyer' && data.budgetOrPrice) {
        customFields.push({ id: 'buyer_budget', value: data.budgetOrPrice });
      }
      if (data.type === 'seller' && data.budgetOrPrice) {
        customFields.push({ id: 'target_list_price', value: data.budgetOrPrice });
      }

      const contact = await contactsService.create({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        tags: [data.type, 'client'],
        customFields,
      });

      // 2. Create Opportunity
      const opp = await opportunitiesService.create({
        contactId: contact.id,
        pipelineId: activePipeline?.id,
        pipelineStageId: data.stageId,
        name: `${data.firstName} ${data.lastName} - ${data.type === 'buyer' ? 'Buy' : 'Sell'}`,
        monetaryValue: data.budgetOrPrice ? parseFloat(data.budgetOrPrice.replace(/[^0-9.-]+/g,"")) : 0,
        status: 'open',
      });

      return { contact, opp };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      queryClient.invalidateQueries({ queryKey: ghl.contacts() });
      toast({ title: 'Client Created', description: 'The new client has been added to the pipeline.' });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create client. Please try again.', variant: 'destructive' });
    }
  });

  function onSubmit(data: NewClientFormValues) {
    createMutation.mutate(data);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Client</SheetTitle>
          <SheetDescription>Add a new buyer or seller to your pipeline.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Client Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="buyer" />
                        </FormControl>
                        <FormLabel className="font-normal">Buyer</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="seller" />
                        </FormControl>
                        <FormLabel className="font-normal">Seller</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activePipeline?.stages?.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'buyer' ? (
              <FormField
                control={form.control}
                name="budgetOrPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl><Input placeholder="$" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="propertyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetOrPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Price</FormLabel>
                      <FormControl><Input placeholder="$" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <SheetFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
