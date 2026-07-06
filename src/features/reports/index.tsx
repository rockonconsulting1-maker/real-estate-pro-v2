import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopReportsView } from './desktop-view';
import { MobileReportsView } from './mobile-view';

export default function Reports() {
  return <SurfaceSwitch desktop={<DesktopReportsView />} mobile={<MobileReportsView />} />;
}
