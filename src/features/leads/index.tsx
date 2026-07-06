import React from 'react';
import { useSurface } from '@/hooks/use-surface';
import { LeadsDesktopView } from './desktop-view';
import { LeadsMobileView } from './mobile-view';
import { MobileLeadDetail } from './mobile-detail';

import { useParams } from 'react-router-dom';

export default function Leads() {
  const surface = useSurface();
  const { id } = useParams();

  if (surface === 'desktop') {
    return <LeadsDesktopView />;
  }

  if (id) {
    return <MobileLeadDetail />;
  }

  return <LeadsMobileView />;
}
