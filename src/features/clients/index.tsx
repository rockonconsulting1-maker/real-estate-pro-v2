import React, { useState, useEffect } from 'react';
import { useSurface } from '@/hooks/use-surface';
import { useParams } from 'react-router-dom';
import DesktopView from './desktop-view';
import MobileView from './mobile-view';
import { MobileBuyerDetail } from './components/mobile-buyer-detail';
import { MobileSellerDetail } from './components/mobile-seller-detail';

export default function Clients() {
  const isDesktop = useSurface() === 'desktop';
  const { id } = useParams();
  
  const [pipelineType, setPipelineType] = useState<'buyer' | 'seller'>(() => {
    return (localStorage.getItem('crm_client_pipeline') as 'buyer' | 'seller') || 'buyer';
  });

  useEffect(() => {
    localStorage.setItem('crm_client_pipeline', pipelineType);
  }, [pipelineType]);

  if (isDesktop) {
    return <DesktopView pipelineType={pipelineType} setPipelineType={setPipelineType} />;
  }

  if (id) {
    if (pipelineType === 'buyer') {
      return <MobileBuyerDetail />;
    } else {
      return <MobileSellerDetail />;
    }
  }

  return <MobileView pipelineType={pipelineType} setPipelineType={setPipelineType} />;
}
