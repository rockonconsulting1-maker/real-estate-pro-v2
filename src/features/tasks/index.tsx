import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopTasksView } from './desktop-view';
import { MobileTasksView } from './mobile-view';

export default function Tasks() {
  return <SurfaceSwitch desktop={<DesktopTasksView />} mobile={<MobileTasksView />} />;
}
