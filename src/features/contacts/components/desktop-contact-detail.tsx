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
import { Phone, MessageSquare, Mail, FileText, CheckSquare, Plus, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DeleteContactDialog } from './contact-modals';

export function DesktopContactDetail({ contactId, onDelete }: { contactId: string, onDelete?: () => void }) {
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

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (isError || !contact) return <ErrorState onRetry={refetch} />;

  const isVendor = contact.tags?.includes('Vendor');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 border-b space-y-6 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h2>
              <div className="text-sm text-muted-foreground">
                Source: {contact.source || 'Unknown'} • Added {contact.dateAdded ? formatDistanceToNow(new Date(contact.dateAdded), { addSuffix: true }) : 'Unknown'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" asChild>
              <a href={`tel:${contact.phone}`}><Phone className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={`sms:${contact.phone}`}><MessageSquare className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={`mailto:${contact.email}`}><Mail className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" size="icon">
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {contact.tags?.map(t => (
            <Badge key={t} variant="secondary" className="group flex items-center gap-1 pr-1">
              {t}
              <button 
                onClick={() => removeTagMutation.mutate(t)}
                className="opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 rounded-full px-2 text-xs border-dashed">
                <Plus className="h-3 w-3 mr-1" /> Add Tag
              </Button>
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

      {/* Tabs */}
      <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 border-b flex-shrink-0">
          <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
            <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">Info</TabsTrigger>
            {isVendor && <TabsTrigger value="vendor" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">Vendor</TabsTrigger>}
            <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">Tasks</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">Notes</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">Activity</TabsTrigger>
            <TabsTrigger value="related" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">Related</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <TabsContent value="info" className="m-0 space-y-6 outline-none">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Contact Details</h3>
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
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Preferences</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">DND</span>
                      <Badge variant={contact.dnd ? 'destructive' : 'outline'}>{contact.dnd ? 'Yes' : 'No'}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {isVendor && (
              <TabsContent value="vendor" className="m-0 space-y-6 outline-none">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vendor Details</h3>
                  <div className="space-y-3 text-sm max-w-md">
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
            
            <TabsContent value="related" className="m-0 outline-none">
              <div className="text-sm text-muted-foreground text-center py-8">Related records placeholder</div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      <DeleteContactDialog 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        contactId={contactId} 
        contactName={`${contact.firstName} ${contact.lastName}`} 
        onSuccess={onDelete}
      />
    </div>
  );
}
