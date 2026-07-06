import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, X, Users, Home, FileText, Clock, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contactsService } from '@/lib/ghl/services/contacts';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { myListingsService, offersService, objectsService } from '@/lib/ghl/services/objects';
import { useSurface } from '@/hooks/use-surface';
import { Avatar, StatusChip } from './primitives';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const surface = useSurface();

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rc_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 8));
      }
    } catch (e) {
      // ignore
    }
  }, [open]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (q: string) => {
    if (!q) return;
    try {
      const next = [q, ...recentSearches.filter(s => s !== q)].slice(0, 8);
      setRecentSearches(next);
      localStorage.setItem('rc_recent_searches', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const handleSelect = (path: string, q?: string) => {
    if (q) saveRecentSearch(q);
    onOpenChange(false);
    navigate(path);
  };

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null;
      
      const [contacts, opps, listings, offers, properties] = await Promise.all([
        contactsService.search({ query: debouncedQuery }),
        opportunitiesService.search({ q: debouncedQuery }),
        myListingsService.search({ query: debouncedQuery, pageLimit: 3 }),
        offersService.search({ query: debouncedQuery, pageLimit: 3 }),
        objectsService.searchRecords('properties', { query: debouncedQuery, pageLimit: 3 })
      ]);

      return {
        contacts: contacts.contacts || [],
        opps: opps.opportunities || [],
        listings: listings.records || [],
        offers: offers.records || [],
        properties: properties.records || []
      };
    },
    enabled: debouncedQuery.length > 1,
    staleTime: 60000,
  });

  const hasResults = results && (results.contacts.length > 0 || results.opps.length > 0 || results.listings.length > 0 || results.offers.length > 0 || results.properties.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`p-0 gap-0 border-0 bg-surface shadow-2xl ${surface === 'mobile' ? 'max-w-full w-full h-full rounded-none m-0' : 'sm:max-w-[600px] h-[80vh] max-h-[600px] rounded-xl'}`} style={surface === 'mobile' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 } : {}}>
        <div className="flex items-center border-b border-border px-4 py-3 bg-surface z-10 sticky top-0">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, leads, listings..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-0 text-lg"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          {surface === 'mobile' && (
            <button onClick={() => onOpenChange(false)} className="ml-2 text-sm text-brand font-medium">
              Cancel
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!debouncedQuery ? (
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Searches</h3>
                    <button onClick={() => { setRecentSearches([]); localStorage.removeItem('rc_recent_searches'); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setQuery(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-full text-sm transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Browse by Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  <BrowseTile icon={UserPlus} label="Leads" onClick={() => handleSelect('/leads')} />
                  <BrowseTile icon={Users} label="Clients" onClick={() => handleSelect('/clients')} />
                  <BrowseTile icon={Users} label="Contacts" onClick={() => handleSelect('/contacts')} />
                  <BrowseTile icon={Home} label="Listings" onClick={() => handleSelect('/listings')} />
                  <BrowseTile icon={FileText} label="Offers" onClick={() => handleSelect('/offers')} />
                  <BrowseTile icon={Home} label="Properties" onClick={() => handleSelect('/mls')} />
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="py-12 flex justify-center text-muted-foreground">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : hasResults ? (
            <div className="space-y-6 pb-6">
              {results.contacts.length > 0 && (
                <ResultGroup title="Contacts" icon={Users}>
                  {results.contacts.map(c => (
                    <ResultItem 
                      key={c.id} 
                      title={String(c.contactName || c.name || c.email || 'Unknown')} 
                      subtitle={String(c.email || c.phone || 'No contact info')} 
                      onClick={() => handleSelect(`/contacts/${c.id}`, debouncedQuery)} 
                    />
                  ))}
                </ResultGroup>
              )}
              
              {results.opps.length > 0 && (
                <ResultGroup title="Opportunities" icon={UserPlus}>
                  {results.opps.map(o => (
                    <ResultItem 
                      key={o.id} 
                      title={String(o.name || 'Unnamed')} 
                      subtitle={String(o.status || 'open')} 
                      onClick={() => handleSelect(`/leads/${o.id}`, debouncedQuery)} 
                    />
                  ))}
                </ResultGroup>
              )}

              {results.listings.length > 0 && (
                <ResultGroup title="Listings" icon={Home}>
                  {results.listings.map(l => (
                    <ResultItem 
                      key={l.id} 
                      title={String(l.name || 'Unnamed Listing')} 
                      subtitle={String(l.status || 'Active')} 
                      onClick={() => handleSelect(`/listings/${l.id}`, debouncedQuery)} 
                    />
                  ))}
                </ResultGroup>
              )}

              {results.offers.length > 0 && (
                <ResultGroup title="Offers" icon={FileText}>
                  {results.offers.map(o => (
                    <ResultItem 
                      key={o.id} 
                      title={String(o.name || 'Unnamed Offer')} 
                      subtitle={String(o.status || 'Pending')} 
                      onClick={() => handleSelect(`/offers/${o.id}`, debouncedQuery)} 
                    />
                  ))}
                </ResultGroup>
              )}

              {results.properties.length > 0 && (
                <ResultGroup title="Properties" icon={Home}>
                  {results.properties.map(p => (
                    <ResultItem 
                      key={p.id} 
                      title={String(p.name || p.address || 'Unnamed Property')} 
                      subtitle={String(p.status || 'Active')} 
                      onClick={() => handleSelect(`/mls/${p.id}`, debouncedQuery)} 
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No results found for "{debouncedQuery}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BrowseTile({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left"
    >
      <div className="p-2 rounded-md bg-brand-soft/20 text-brand">
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function ResultGroup({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        <Icon className="w-4 h-4" /> {title}
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden divide-y">
        {children}
      </div>
    </div>
  );
}

function ResultItem({ title, subtitle, onClick }: { title: string, subtitle: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
    >
      <Avatar name={title} className="w-8 h-8" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
    </button>
  );
}
