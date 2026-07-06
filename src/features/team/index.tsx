import React from 'react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopTeamView } from './desktop-view';
import { MobileTeamView } from './mobile-view';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function Team() {
  useDocumentTitle();

  return (
    <SurfaceSwitch 
      desktop={<DesktopTeamView />}
      mobile={<MobileTeamView />}
    />
  );
}
