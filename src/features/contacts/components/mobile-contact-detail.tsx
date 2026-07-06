import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { contactsService } from '@/lib/ghl/services';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, MessageSquare, Mail, FileText, CheckSquare, Plus, X, ArrowLeft, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DeleteContactDialog } from './contact-modals';

export function MobileContactDetail({ contactId, onBack }: { contactId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { data: contact, isLoading, isError, refetch } = useQuery({
    queryKey: ghl.contact(contactId),
    queryFn: () => contactsService.get(contactId),
  });

  const [newTag, setNewTag] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => contactsService.addTags(contactId, [tag]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.contact(contactId) });
      setNewTag('');
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: (tag: string) => contactsService.removeTags(contactId, [tag]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ghl.contact(contactId) })
  });

  if (isLoading) return <div className="p-4 space-y-4 pt-16"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (isError || !contact) return <div className="pt-16"><ErrorState onRetry={refetch} /></div>;

  const isVendor = contact.tags?.includes('Vendor');

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col pt-safe">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold truncate flex-1">{contact.firstName} {contact.lastName}</h1>
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 pb-safe">
        <div className="p-4 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{contact.firstName} {contact.lastName}</h2>
              <div className="text-sm text-muted-foreground mt-1">
                {contact.source || 'Unknown source'}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {contact.tags?.map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                  {t}
                  <button onClick={() => removeTagMutation.mutate(t)}>
                    <X className="h-2.5 w-2.5 opacity-50" />
                  </button>
                </Badge>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-dashed cursor-pointer">
                    <Plus className="h-2.5 w-2.5 mr-0.5" /> Add
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <form onSubmit={e => { e.preventDefault(); if (newTag) addTagMutation.mutate(newTag); }} className="flex gap-2">
                    <Input size={1} className="h-8 text-xs" placeholder="New tag..." value={newTag} onChange={e => setNewTag(e.target.value)} />
                    <Button type="submit" size="sm" className="h-8 text-xs" disabled={!newTag || addTagMutation.isPending}>Add</Button>
                  </form>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-success/10 text-success border-none" asChild>
              <a href={`tel:${contact.phone}`}><Phone className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-info/10 text-info border-none" asChild>
              <a href={`sms:${contact.phone}`}><MessageSquare className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-primary/10 text-primary border-none" asChild>
              <a href={`mailto:${contact.email}`}><Mail className="h-4 w-4" /></a>
            </Button>
          </div>

          <Tabs defaultValue="info" className="w-full mt-4">
            <TabsList className="w-full justify-start h-10 bg-transparent border-b rounded-none p-0 overflow-x-auto flex-nowrap scrollbar-hide">
              <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 flex-shrink-0">Info</TabsTrigger>
              {isVendor && <TabsTrigger value="vendor" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 flex-shrink-0">Vendor</TabsTrigger>}
              <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 flex-shrink-0">Tasks</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 flex-shrink-0">Notes</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 flex-shrink-0">Activity</TabsTrigger>
            </TabsList>

            <div className="pt-4 pb-20">
              <TabsContent value="info" className="m-0 space-y-4 outline-none">
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-muted-foreground text-xs">Email</span>
                    <span>{contact.email || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-muted-foreground text-xs">Phone</span>
                    <span>{contact.phone || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-muted-foreground text-xs">Company</span>
                    <span>{contact.companyName || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-muted-foreground text-xs">Address</span>
                    <span>
                      {[contact.address1, contact.city, contact.state, contact.postalCode].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">DND</span>
                    <Badge variant={contact.dnd ? 'destructive' : 'outline'}>{contact.dnd ? 'Yes' : 'No'}</Badge>
                  </div>
                </div>
              </TabsContent>

              {isVendor && (
                <TabsContent value="vendor" className="m-0 space-y-4 outline-none">
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col gap-1 py-2 border-b">
                      <span className="text-muted-foreground text-xs">Service Type</span>
                      <span>{(contact.customFields as any[])?.find(f => f.id === 'vendor_service_type')?.value || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 py-2 border-b">
                      <span className="text-muted-foreground text-xs">Priority</span>
                      <span>{(contact.customFields as any[])?.find(f => f.id === 'vendor_priority')?.value || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 py-2 border-b">
                      <span className="text-muted-foreground text-xs">Preferred Comm</span>
                      <span>{(contact.customFields as any[])?.find(f => f.id === 'vendor_preferred_comm')?.value || '—'}</span>
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="tasks" className="m-0 outline-none">
                <div className="text-sm text-muted-foreground text-center py-8">Tasks placeholder</div>
              </TabsContent>
              
              <TabsContent value="notes" className="m-0 outline-none">
                <div className="text-sm text-muted-foreground text-center py-8">Notes placeholder</div>
              </TabsContent>

              <TabsContent value="activity" className="m-0 outline-none">
                <div className="text-sm text-muted-foreground text-center py-8">Activity feed placeholder</div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </ScrollArea>
      <DeleteContactDialog 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        contactId={contactId} 
        contactName={`${contact.firstName} ${contact.lastName}`}
        onSuccess={onBack}
      />
    </div>
  );
}
