import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { contactsService } from '@/lib/ghl/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Contact } from '@/types/ghl';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(), // We'll split by comma
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function NewContactSheet({
  open,
  onOpenChange,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contactId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [duplicateCheck, setDuplicateCheck] = useState<{ checked: boolean; existing?: Contact[] }>({ checked: false });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      source: '',
      tags: '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => contactsService.create(data),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ghl.contacts() });
      toast.success('Contact created successfully');
      onOpenChange(false);
      form.reset();
      setDuplicateCheck({ checked: false });
      if (onSuccess) onSuccess(newContact.id);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create contact');
    }
  });

  const onSubmit = async (values: ContactFormValues) => {
    // Duplicate check
    if (!duplicateCheck.checked && (values.email || values.phone)) {
      try {
        const query = values.email || values.phone;
        if (query) {
          const res = await contactsService.search({ query });
          if (res.contacts.length > 0) {
            setDuplicateCheck({ checked: true, existing: res.contacts });
            return;
          }
        }
      } catch (e) {
        // Ignore search error and proceed
      }
    }

    const payload: Partial<Contact> = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      source: values.source || undefined,
      tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      address1: values.address1 || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      postalCode: values.postalCode || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Contact</SheetTitle>
          <SheetDescription>Add a new contact to your CRM.</SheetDescription>
        </SheetHeader>

        {duplicateCheck.existing && duplicateCheck.existing.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Possible Duplicate Found</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>A contact with this email or phone already exists:</p>
              <div className="text-sm font-medium">
                {duplicateCheck.existing[0].firstName} {duplicateCheck.existing[0].lastName} ({duplicateCheck.existing[0].email || duplicateCheck.existing[0].phone})
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => {
                  onOpenChange(false);
                  if (onSuccess) onSuccess(duplicateCheck.existing![0].id);
                }}>
                  View Existing
                </Button>
                <Button size="sm" onClick={() => form.handleSubmit(onSubmit)()}>
                  Create Anyway
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Tags (comma separated)</FormLabel>
                  <FormControl><Input placeholder="Vendor, SOI, RE Agent..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl><Input placeholder="Referral, Website..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Address</h4>
              
              <FormField
                control={form.control}
                name="address1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="Street Address" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl><Input placeholder="City" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl><Input placeholder="State/Province" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="Postal/ZIP Code" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Create Contact'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export function DeleteContactDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => contactsService.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.contacts() });
      toast.success('Contact deleted');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete contact');
    }
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {contactName}? This action cannot be undone and will remove them from all pipelines and lists.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
