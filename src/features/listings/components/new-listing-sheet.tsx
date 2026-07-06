import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { myListingsService, contactsService, associationsService } from '@/lib/ghl/services';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSurface } from '@/hooks/use-surface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const schema = z.object({
  address: z.string().min(1, 'Address is required'),
  mls_number: z.string().optional(),
  list_price: z.coerce.number().min(0, 'Price must be positive'),
  listing_stage: z.string().min(1, 'Stage is required'),
  beds: z.coerce.number().optional(),
  baths: z.coerce.number().optional(),
  sqft: z.coerce.number().optional(),
  property_type: z.string().optional(),
  seller_contact_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewListingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const isDesktop = useSurface() === 'desktop';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: '',
      mls_number: '',
      list_price: 0,
      listing_stage: 'Coming Soon',
      beds: 0,
      baths: 0,
      sqft: 0,
      property_type: 'Single Family',
      seller_contact_id: '',
    },
  });

  const { data: contactsData } = useQuery({
    queryKey: ghl.contacts({ limit: 100 }),
    queryFn: () => contactsService.search({ limit: 100 }),
  });
  const contacts = contactsData?.contacts || [];

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, any> = {
        name: data.address,
      };
      
      const customFields = [
        'address', 'mls_number', 'list_price', 'listing_stage', 
        'beds', 'baths', 'sqft', 'property_type'
      ];
      
      customFields.forEach(field => {
        if (data[field as keyof FormData] !== undefined && data[field as keyof FormData] !== '') {
          payload[`custom_objects.my_listings.${field}`] = data[field as keyof FormData];
        }
      });

      const listing = await myListingsService.create(payload);

      if (data.seller_contact_id && listing.id) {
        await associationsService.createRelation({
          relationType: 'listing_to_contact',
          record1Id: listing.id,
          record2Id: data.seller_contact_id,
        });
      }

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.records('my_listings', {}) });
      toast({ title: 'Listing created successfully' });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create listing', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const Content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="list_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>List Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="500000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mls_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MLS #</FormLabel>
                <FormControl>
                  <Input placeholder="MLS123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="listing_stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <FormControl>
                  <Input placeholder="Single Family" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="beds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beds</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Baths</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sqft"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sqft</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="seller_contact_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seller (Contact)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contacts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.contactName || c.firstName + ' ' + c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Listing</DialogTitle>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Listing</SheetTitle>
        </SheetHeader>
        {Content}
      </SheetContent>
    </Sheet>
  );
}
