import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopNotesView } from './desktop-view';
import { MobileNotesView } from './mobile-view';

export default function Notes() {
  return <SurfaceSwitch desktop={<DesktopNotesView />} mobile={<MobileNotesView />} />;
}
