import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { objectsService, associationsService, contactsService } from '@/lib/ghl/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { useSurface } from '@/hooks/use-surface';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';

const offerSchema = z.object({
  property_address: z.string().min(1, 'Property address is required'),
  buyer_contact_id: z.string().min(1, 'Buyer is required'),
  offer_price: z.coerce.number().min(1, 'Price is required'),
  deposit_amount: z.coerce.number().min(0),
  financing_type: z.string().min(1, 'Financing type is required'),
  closing_date: z.date({ required_error: 'Closing date is required' }),
  irrevocable_until: z.date({ required_error: 'Irrevocable date is required' }),
  conditions_deadline: z.date().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  conditions: z.array(z.string()).default([]),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface NewOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<OfferFormValues>;
}

export function NewOfferModal({ open, onOpenChange, defaultValues }: NewOfferModalProps) {
  const surface = useSurface();
  const queryClient = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ghl.contacts({ limit: 100 }),
    queryFn: () => contactsService.search({ limit: 100 }),
  });

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      property_address: defaultValues?.property_address || '',
      buyer_contact_id: defaultValues?.buyer_contact_id || '',
      offer_price: defaultValues?.offer_price || 0,
      deposit_amount: defaultValues?.deposit_amount || 0,
      financing_type: defaultValues?.financing_type || 'conventional',
      commission_rate: defaultValues?.commission_rate || 2.5,
      conditions: defaultValues?.conditions || [],
      ...defaultValues
    },
  });

  const createOffer = useMutation({
    mutationFn: async (values: OfferFormValues) => {
      // 1. Create the offer record
      const offerData = {
        name: `Offer - ${values.property_address}`,
        property_address: values.property_address,
        offer_price: values.offer_price,
        deposit_amount: values.deposit_amount,
        financing_type: values.financing_type,
        closing_date: values.closing_date.toISOString(),
        irrevocable_until: values.irrevocable_until.toISOString(),
        conditions_deadline: values.conditions_deadline?.toISOString(),
        commission_rate: values.commission_rate,
        status: 'submitted',
      };
      
      const newOffer = await objectsService.createRecord('real_estate_offer', offerData);
      
      // 2. Associate with buyer contact if provided
      if (values.buyer_contact_id) {
        await associationsService.createRelation({
          fromRecordId: newOffer.id,
          fromObjectKey: 'real_estate_offer',
          toRecordId: values.buyer_contact_id,
          toObjectKey: 'contact'
        });
      }
      
      return newOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.records('real_estate_offer', {}) });
      toast({ title: 'Offer created successfully' });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create offer', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (values: OfferFormValues) => {
    createOffer.mutate(values);
  };

  const conditionsList = ['Financing', 'Inspection', 'Status Certificate', 'Sale of Property'];

  const FormContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="property_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="buyer_contact_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Buyer Contact</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a buyer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contacts?.contacts?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="offer_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deposit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="financing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financing</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="conventional">Conventional</SelectItem>
                    <SelectItem value="fha">FHA</SelectItem>
                    <SelectItem value="va">VA</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commission_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="closing_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Closing Date</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="irrevocable_until"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Irrevocable Until</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <FormLabel>Conditions</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {conditionsList.map((condition) => (
              <FormField
                key={condition}
                control={form.control}
                name="conditions"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={condition}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(condition)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, condition])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== condition
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {condition}
                      </FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createOffer.isPending}>
            {createOffer.isPending ? 'Saving...' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (surface === 'desktop') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Offer</DialogTitle>
            <DialogDescription>Create a new offer record and associate it with a property and client.</DialogDescription>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>New Offer</SheetTitle>
          <SheetDescription>Create a new offer record.</SheetDescription>
        </SheetHeader>
        {FormContent}
      </SheetContent>
    </Sheet>
  );
}
