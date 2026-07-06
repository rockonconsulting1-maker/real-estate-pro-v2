import React, { useState } from 'react';
import { useSurface } from '@/hooks/use-surface';
import DesktopTransactionsView from './desktop-view';
import MobileTransactionsView from './mobile-view';

export default function Transactions() {
  const surface = useSurface();

  if (surface === 'desktop') {
    return <DesktopTransactionsView />;
  }

  return <MobileTransactionsView />;
}
