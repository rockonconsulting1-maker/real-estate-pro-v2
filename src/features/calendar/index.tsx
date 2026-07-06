import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopCalendarView } from './desktop-view';
import { MobileCalendarView } from './mobile-view';

export default function Calendar() {
  return <SurfaceSwitch desktop={<DesktopCalendarView />} mobile={<MobileCalendarView />} />;
}
