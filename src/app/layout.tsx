import React, { Suspense, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, Navigate, useLocation } from 'react-router-dom';
import { useGhlCredentials } from '@/hooks/use-ghl-credentials';
import { setGhlCredentials } from '@/lib/ghl/client';
import { Loader2 } from 'lucide-react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopShell } from '@/components/desktop/shell';
import { MobileShell } from '@/components/mobile/shell';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { Progress } from '@/components/ui/progress';

export function AppLayout() {
  useDocumentTitle();
  const location = useLocation();
  const { pit, locationId, isConfigured, isLoading } = useGhlCredentials();
  const { isSettled, isLoading: isBootstrapLoading } = useBootstrap();
  const [splashProgress, setSplashProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (pit && locationId) {
      setGhlCredentials(pit, locationId);
    }
  }, [pit, locationId]);

  useEffect(() => {
    const handleUnauthorized = () => {
      // Could show a toast here
      window.location.href = '/settings/integrations';
    };
    window.addEventListener('ghl:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ghl:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (isConfigured && !isSettled) {
      const interval = setInterval(() => {
        setSplashProgress(p => Math.min(p + 10, 90));
      }, 200);
      return () => clearInterval(interval);
    }
    if (isSettled) setSplashProgress(100);
  }, [isConfigured, isSettled]);

  if (isLoading || (isConfigured && !isSettled)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-6">
        <div className="w-16 h-16 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
          RC
        </div>
        <div className="w-64">
          <Progress value={splashProgress} className="h-1" />
        </div>
      </div>
    );
  }

  // Allow access to settings/integrations even if not configured
  if (!isConfigured && !location.pathname.startsWith('/settings')) {
    return <Navigate to="/settings/integrations" replace />;
  }

  return (
    <>
      <SurfaceSwitch
        desktop={
          <DesktopShell>
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              <Outlet />
            </Suspense>
          </DesktopShell>
        }
        mobile={
          <MobileShell>
            <Suspense fallback={<div className="p-4">Loading...</div>}>
              <Outlet />
            </Suspense>
          </MobileShell>
        }
      />
      {isOffline && (
        <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium z-[100]">
          You are currently offline. Some features may be unavailable.
        </div>
      )}
      <ScrollRestoration />
    </>
  );
}
