import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NextUpWidget } from './widgets/next-up';
import { KpiGridWidget } from './widgets/kpi-grid';
import { NeedsAttentionWidget } from './widgets/needs-attention';
import { NewLeadsWidget } from './widgets/new-leads';
import { PendingOffersWidget } from './widgets/pending-offers';
import { ActivityFeedWidget } from './widgets/activity-feed';
export function DashboardDesktopView() {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title-desktop">Dashboard</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Next Up & Activity Feed */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <NextUpWidget />
          <ActivityFeedWidget />
        </div>

        {/* Middle Column: Work Queue (Needs Attention, New Leads, Pending Offers) */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <NeedsAttentionWidget />
          <div className="grid grid-cols-2 gap-6">
            <NewLeadsWidget />
            <PendingOffersWidget />
          </div>
        </div>

        {/* Right Column: KPI Grid */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <KpiGridWidget />
        </div>
      </div>
    </div>
  );
}








