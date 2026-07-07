import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/types/ghl';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DesktopContactDetail } from './components/desktop-contact-detail';
import { NewContactSheet } from './components/contact-modals';
import { Plus } from 'lucide-react';

const ROLE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Vendors', value: 'type:vendor' },
  { label: 'SOI', value: 'type:soi' },
  { label: 'RE Agents', value: 'type:re-agent' },
  { label: 'Team', value: 'type:team' },
  { label: 'Past Clients', value: 'lifecycle:past-client' },
  { label: 'Leads', value: 'lifecycle:lead' },
  { label: 'Clients', value: 'lifecycle:client' },
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

  const contacts = useMemo(() => {
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

  type ListItem = { isHeader: true; letter: string; contact?: never } | { isHeader: false; letter?: never; contact: Contact };

  const contactsWithHeaders = useMemo(() => {
    if (sortBy !== 'name') return contacts.map(c => ({ isHeader: false, contact: c }));
    
    const res: ListItem[] = [];
    let lastLetter = '';
    
    for (const c of contacts) {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
      const letter = name ? name[0].toUpperCase() : '#';
      const group = /[A-Z]/.test(letter) ? letter : '#';
      
      if (group !== lastLetter) {
        res.push({ isHeader: true, letter: group });
        lastLetter = group;
      }
      res.push({ isHeader: false, contact: c });
    }
    return res;
  }, [contacts, sortBy]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? contactsWithHeaders.length + 1 : contactsWithHeaders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => {
      if (i >= contactsWithHeaders.length) return 60; // loader
      return contactsWithHeaders[i].isHeader ? 32 : 72; // 72px for contact row
    },
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (
      lastItem &&
      lastItem.index >= contactsWithHeaders.length - 1 &&
      hasNextPage &&
      !isLoading
    ) {
      fetchNextPage();
    }
  }, [virtualItems, contactsWithHeaders.length, hasNextPage, isLoading, fetchNextPage]);

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

        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : contactsWithHeaders.length === 0 ? (
            <EmptyState title="No contacts found" description="Try adjusting your filters" />
          ) : (
            <div ref={parentRef} className="h-full overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > contactsWithHeaders.length - 1;
                  const item = contactsWithHeaders[virtualRow.index];

                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {isLoaderRow ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          Loading more...
                        </div>
                      ) : (item as any).isHeader ? (
                        <div className="bg-muted/30 px-4 py-1.5 text-sm font-semibold text-muted-foreground border-y sticky top-0 z-10 backdrop-blur-sm">
                          {(item as any).letter}
                        </div>
                      ) : (
                        <div 
                          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedContactId === item.contact!.id ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedContactId(item.contact!.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{item.contact!.firstName?.[0] || ''}{item.contact!.lastName?.[0] || ''}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.contact!.firstName} {item.contact!.lastName}</div>
                              <div className="text-sm text-muted-foreground truncate">{item.contact!.email || item.contact!.phone || 'No contact info'}</div>
                            </div>
                            {item.contact!.tags && item.contact!.tags.length > 0 && (
                              <Badge variant="secondary" className="text-[10px]">{item.contact!.tags[0]}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
