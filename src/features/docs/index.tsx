import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopDocsView } from './desktop-view';
import { MobileDocsView } from './mobile-view';

export default function Docs() {
  return <SurfaceSwitch desktop={<DesktopDocsView />} mobile={<MobileDocsView />} />;
}