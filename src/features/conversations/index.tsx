import React from 'react';
import { useParams } from 'react-router-dom';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopConversationsView } from './desktop-view';
import { MobileConversationsView } from './mobile-view';

export default function Conversations() {
  const { id } = useParams();

  return (
    <SurfaceSwitch 
      desktop={<DesktopConversationsView selectedId={id} />}
      mobile={<MobileConversationsView selectedId={id} />}
    />
  );
}
