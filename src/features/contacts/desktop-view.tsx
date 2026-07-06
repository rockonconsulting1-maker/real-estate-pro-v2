import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { contactsService } from '@/lib/ghl/services';
import { useGhlInfinite } from '@/hooks/use-ghl-infinite';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { VirtualizedList } from '@/components/shared/virtualized';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/types/ghl';
import { formatDistanceToNow } from 'date-fns';
import { DesktopContactDetail } from './components/desktop-contact-detail';
import { NewContactSheet } from './components/contact-modals';
import { Plus } from 'lucide-react';

const ROLE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Vendors', value: 'Vendor' },
  { label: 'SOI', value: 'SOI' },
  { label: 'RE Agents', value: 'RE Agent' },
  { label: 'Team', value: 'Team' },
  { label: 'Past Clients', value: 'Past Client' },
  { label: 'Leads', value: 'Lead' },
  { label: 'Clients', value: 'Client' },
];

export function DesktopContactsView() {
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
        limit: 50
      });
      return {
        data: res.contacts,
        nextCursor: res.contacts.length === 50 ? String(page + 1) : null
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Pane: Directory */}
      <div className="w-1/3 border-r flex flex-col bg-background">
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search contacts..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                  <SelectItem value="added">Date Added</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" onClick={() => setNewContactOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
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
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedContactId === contact.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedContactId(contact.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{contact.firstName} {contact.lastName}</div>
                      <div className="text-sm text-muted-foreground truncate">{contact.email || contact.phone || 'No contact info'}</div>
                    </div>
                    {contact.tags && contact.tags.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{contact.tags[0]}</Badge>
                    )}
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Right Pane: Detail */}
      <div className="w-2/3 bg-background flex flex-col">
        {selectedContactId ? (
          <DesktopContactDetail contactId={selectedContactId} onDelete={() => setSelectedContactId(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a contact to view details
          </div>
        )}
      </div>
      <NewContactSheet open={newContactOpen} onOpenChange={setNewContactOpen} onSuccess={setSelectedContactId} />
    </div>
  );
}
