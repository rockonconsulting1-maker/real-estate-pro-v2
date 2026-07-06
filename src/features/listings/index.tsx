import React from 'react';
import { useParams } from 'react-router-dom';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopListingsView } from './desktop-view';
import { MobileListingsView } from './mobile-view';
import { DesktopListingDetail } from './components/desktop-listing-detail';
import { MobileListingDetail } from './components/mobile-listing-detail';

export default function Listings() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return (
      <SurfaceSwitch 
        desktop={<DesktopListingDetail />} 
        mobile={<MobileListingDetail />} 
      />
    );
  }

  return (
    <SurfaceSwitch 
      desktop={<DesktopListingsView />} 
      mobile={<MobileListingsView />} 
    />
  );
}
