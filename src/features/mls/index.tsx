import React from 'react';
import { useParams } from 'react-router-dom';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopMlsView } from './desktop-view';
import { MobileMlsView } from './mobile-view';
import { DesktopPropertyDetail } from './components/desktop-property-detail';
import { MobilePropertyDetail } from './components/mobile-property-detail';

export default function MLS() {
  const { id } = useParams();

  if (id) {
    return (
      <SurfaceSwitch 
        desktop={<DesktopPropertyDetail id={id} />}
        mobile={<MobilePropertyDetail id={id} />}
      />
    );
  }

  return (
    <SurfaceSwitch 
      desktop={<DesktopMlsView />}
      mobile={<MobileMlsView />}
    />
  );
}
