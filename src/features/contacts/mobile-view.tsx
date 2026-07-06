import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { contactsService } from '@/lib/ghl/services';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { Input } from '@/components/ui/input';
import { Search, Phone, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { VirtualizedList } from '@/components/shared/virtualized';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/types/ghl';
import { MobileContactDetail } from './components/mobile-contact-detail';
import { NewContactSheet } from './components/contact-modals';
import { Plus } from 'lucide-react';

const ROLE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Vendors', value: 'Vendor' },
  { label: 'SOI', value: 'SOI' },
  { label: 'RE Agents', value: 'RE Agent' },
  { label: 'Team', value: 'Team' },
  { label: 'Past', value: 'Past Client' },
  { label: 'Leads', value: 'Lead' },
  { label: 'Clients', value: 'Client' },
];

export function MobileContactsView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newContactOpen, setNewContactOpen] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isLoading, isError, refetch } = useGhlInfinite<Contact>(
    [...ghl.contacts({ query: debouncedSearch, tags: roleFilter !== 'all' ? [roleFilter] : undefined })],
    async (pageParam) => {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const res = await contactsService.search({
        query: debouncedSearch,
        tags: roleFilter !== 'all' ? [roleFilter] : undefined,
        page,
        limit: 20
      });
      return {
        data: res.contacts,
        nextCursor: res.contacts.length === 20 ? String(page + 1) : null
      };
    }
  );

  const contacts = React.useMemo(() => {
    const all = data?.pages.flatMap(p => p.data) || [];
    return all.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'recent') {
        return new Date(b.dateUpdated || 0).getTime() - new Date(a.dateUpdated || 0).getTime();
      }
      if (sortBy === 'added') {
        return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
      }
      return 0;
    });
  }, [data, sortBy]);

  return (
    <div className="flex flex-col h-full bg-background pb-20">
      <div className="p-4 border-b space-y-4 sticky top-0 bg-background z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-page-title-mobile">Contacts</h1>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setNewContactOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search contacts..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {ROLE_FILTERS.map(f => (
            <Badge 
              key={f.value}
              variant={roleFilter === f.value ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setRoleFilter(f.value)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{contacts.length} contacts</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-none bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="recent">Recent Activity</SelectItem>
              <SelectItem value="added">Date Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : contacts.length === 0 ? (
          <EmptyState title="No contacts found" description="Try adjusting your filters" />
        ) : (
          <VirtualizedList<Contact>
            data={contacts}
            fetchNextPage={() => hasNextPage && fetchNextPage()}
            hasNextPage={hasNextPage}
            renderItem={(contact) => (
              <div 
                className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedContactId(contact.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-base">{contact.firstName} {contact.lastName}</div>
                    <div className="text-sm text-muted-foreground truncate">{contact.email || contact.companyName || '—'}</div>
                    <div className="flex gap-1 mt-1">
                      {contact.tags?.slice(0, 2).map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {contact.phone && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-success/10 text-success hover:bg-success/20" asChild>
                        <a href={`tel:${contact.phone}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    )}
                    {contact.phone && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-info/10 text-info hover:bg-info/20" asChild>
                        <a href={`sms:${contact.phone}`}><MessageSquare className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {selectedContactId && (
        <MobileContactDetail 
          contactId={selectedContactId} 
          onBack={() => setSelectedContactId(null)} 
        />
      )}
      <NewContactSheet open={newContactOpen} onOpenChange={setNewContactOpen} onSuccess={setSelectedContactId} />
    </div>
  );
}
