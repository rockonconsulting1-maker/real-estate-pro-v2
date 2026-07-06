import React from 'react';
import { useSurface } from '@/hooks/use-surface';
import { DashboardDesktopView } from './desktop-view';
import { DashboardMobileView } from './mobile-view';

export default function Dashboard() {
  const surface = useSurface();

  if (surface === 'desktop') {
    return <DashboardDesktopView />;
  }

  return <DashboardMobileView />;
}
