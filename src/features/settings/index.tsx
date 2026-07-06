import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopSettingsView } from './desktop-view';
import { MobileSettingsView } from './mobile-view';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function Settings() {
  useDocumentTitle();
  
  return (
    <SurfaceSwitch
      desktop={<DesktopSettingsView />}
      mobile={<MobileSettingsView />}
    />
  );
}
