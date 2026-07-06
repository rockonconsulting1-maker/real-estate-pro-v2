import React from 'react';
import { useSurface } from '@/hooks/use-surface';
import { DesktopContactsView } from './desktop-view';
import { MobileContactsView } from './mobile-view';

export default function Contacts() {
  const surface = useSurface();
  return surface === 'desktop' ? <DesktopContactsView /> : <MobileContactsView />;
}
