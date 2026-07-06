import React from 'react';
import { useSurface } from '@/hooks/use-surface';
import { DesktopOffersView } from './desktop-view';
import { MobileOffersView } from './mobile-view';
import { DesktopOfferDetail } from './components/desktop-offer-detail';
import { MobileOfferDetail } from './components/mobile-offer-detail';
import { useParams } from 'react-router-dom';

export default function Offers() {
  const surface = useSurface();
  const { id } = useParams<{ id: string }>();

  if (id) {
    return surface === 'desktop' ? <DesktopOfferDetail /> : <MobileOfferDetail />;
  }

  return surface === 'desktop' ? <DesktopOffersView /> : <MobileOffersView />;
}
