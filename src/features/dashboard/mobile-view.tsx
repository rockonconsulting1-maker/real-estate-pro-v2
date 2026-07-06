import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Bell } from 'lucide-react';
import { NextUpWidget } from './widgets/next-up';
import { KpiGridWidget } from './widgets/kpi-grid';
import { NeedsAttentionWidget } from './widgets/needs-attention';
import { NewLeadsWidget } from './widgets/new-leads';
import { PendingOffersWidget } from './widgets/pending-offers';
import { ActivityFeedWidget } from './widgets/activity-feed';
import { GlobalSearch } from '@/components/shared/global-search';
import { NotificationsFeed } from '@/components/shared/notifications-feed';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ghl } from '@/lib/queryKeys';

export function DashboardMobileView() {
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleRefresh = async () => {
    // Invalidate all dashboard related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ghl.events({ range: 'next-7d' }) }),
      queryClient.invalidateQueries({ queryKey: ghl.events({ range: 'today-unconfirmed' }) }),
      queryClient.invalidateQueries({ queryKey: ghl.tasks({ overdue: true }) }),
      queryClient.invalidateQueries({ queryKey: ghl.tasks({ completed: true, limit: 10 }) }),
      queryClient.invalidateQueries({ queryKey: [{ scope: 'ghl', entity: 'opportunities' }] }),
      queryClient.invalidateQueries({ queryKey: ghl.records('real_estate_offer', { status: 'pending' }) }),
      queryClient.invalidateQueries({ queryKey: ghl.records('real_estate_offer', { expiring: true }) }),
      queryClient.invalidateQueries({ queryKey: ghl.records('real_estate_offer', { closingThisMonth: true }) }),
      queryClient.invalidateQueries({ queryKey: ghl.conversations({ limit: 10 }) })
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Pull to refresh wrapper - using a simple button for now, but a pull-to-refresh library could be added */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-page-title-mobile text-brand">Real Estate Pro</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNotificationsOpen(true)}
              className="p-2 -mr-2 text-foreground relative touch-target"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 bg-muted/50 border border-border rounded-full px-4 py-2.5 text-muted-foreground text-sm mb-6"
        >
          <Search className="w-4 h-4" />
          <span>Search contacts, leads, listings...</span>
        </button>

        <NextUpWidget />
        
        <KpiGridWidget />
        
        <NeedsAttentionWidget />
        
        <NewLeadsWidget />
        
        <PendingOffersWidget />
        
        <ActivityFeedWidget />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-[20px]">
          <NotificationsFeed onClose={() => setNotificationsOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
