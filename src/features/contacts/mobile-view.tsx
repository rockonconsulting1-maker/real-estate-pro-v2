import React, { useState, useRef, useMemo, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/types/ghl';
import { MobileContactDetail } from './components/mobile-contact-detail';
import { NewContactSheet } from './components/contact-modals';
import { Plus } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

const ROLE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Vendors', value: 'type:vendor' },
  { label: 'SOI', value: 'type:soi' },
  { label: 'RE Agents', value: 'type:re-agent' },
  { label: 'Team', value: 'type:team' },
  { label: 'Past', value: 'lifecycle:past-client' },
  { label: 'Leads', value: 'lifecycle:lead' },
  { label: 'Clients', value: 'lifecycle:client' },
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
      return contactsWithHeaders[i].isHeader ? 32 : 96; // 96px for contact row
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

  const handleScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sortBy !== 'name' || !parentRef.current) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, y / rect.height));
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
    const charIndex = Math.floor(percentage * chars.length);
    const targetChar = chars[Math.min(charIndex, chars.length - 1)];
    
    const index = contactsWithHeaders.findIndex(item => item.isHeader && item.letter === targetChar);
    if (index !== -1) {
      rowVirtualizer.scrollToIndex(index, { align: 'start' });
    }
  };

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

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : contactsWithHeaders.length === 0 ? (
          <EmptyState title="No contacts found" description="Try adjusting your filters" />
        ) : (
          <>
            <div ref={parentRef} className="h-full overflow-auto scroll-smooth">
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
                          className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedContactId(item.contact!.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>{item.contact!.firstName?.[0] || ''}{item.contact!.lastName?.[0] || ''}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="font-medium truncate text-base">{item.contact!.firstName} {item.contact!.lastName}</div>
                              <div className="text-sm text-muted-foreground truncate">{item.contact!.email || item.contact!.companyName || '—'}</div>
                              <div className="flex gap-1 mt-1">
                                {item.contact!.tags?.slice(0, 2).map(t => (
                                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {item.contact!.phone && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-success/10 text-success hover:bg-success/20" asChild>
                                  <a href={`tel:${item.contact!.phone}`} onClick={e => e.stopPropagation()}><Phone className="h-4 w-4" /></a>
                                </Button>
                              )}
                              {item.contact!.phone && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-info/10 text-info hover:bg-info/20" asChild>
                                  <a href={`sms:${item.contact!.phone}`} onClick={e => e.stopPropagation()}><MessageSquare className="h-4 w-4" /></a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* A-Z Scrubber */}
            {sortBy === 'name' && (
              <div 
                className="absolute right-0 top-0 bottom-0 w-6 flex flex-col justify-center items-center text-[10px] font-medium text-muted-foreground z-20 select-none touch-none"
                onPointerDown={handleScrub}
                onPointerMove={handleScrub}
              >
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map(char => (
                  <div key={char} className="flex-1 min-h-[14px] flex items-center justify-center w-full hover:text-foreground">
                    {char}
                  </div>
                ))}
              </div>
            )}
          </>
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
