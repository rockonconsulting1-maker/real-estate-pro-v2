import React from 'react';
import { useSurface } from '@/hooks/use-surface';

interface SurfaceSwitchProps {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
}

export function SurfaceSwitch({ desktop, mobile }: SurfaceSwitchProps) {
  const surface = useSurface();
  return surface === 'desktop' ? <>{desktop}</> : <>{mobile}</>;
}
