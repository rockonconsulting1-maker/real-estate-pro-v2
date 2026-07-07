import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Outlet, ScrollRestoration, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useGhlCredentials } from '@/hooks/use-ghl-credentials';
import { setGhlCredentials } from '@/lib/ghl/client';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { DesktopShell } from '@/components/desktop/shell';
import { MobileShell } from '@/components/mobile/shell';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  useDocumentTitle();
  const location = useLocation();
  const navigate = useNavigate();
  const { pit, locationId, isConfigured, isLoading } = useGhlCredentials();
  const { isSettled, isLoading: isBootstrapLoading, data: bootstrapData, refetch: refetchBootstrap, error: bootstrapError, settledCount } = useBootstrap();
  const splashProgress = isSettled ? 100 : Math.floor((settledCount / 9) * 100);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showPartialBanner, setShowPartialBanner] = useState(true);
  const last401Time = useRef(0);

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
      const now = Date.now();
      if (now - last401Time.current > 5000) {
        last401Time.current = now;
        toast.error('GHL credentials invalid', {
          description: 'Please update your token in Settings.',
          action: {
            label: 'Go to Settings',
            onClick: () => navigate('/settings/integrations'),
          },
          duration: 10000,
        });
      }
    };
    window.addEventListener('ghl:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ghl:unauthorized', handleUnauthorized);
  }, [navigate]);



  if (isLoading || (isConfigured && !isSettled && !bootstrapError)) {
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

  if (bootstrapError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-6 p-4 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Failed to load workspace</h2>
        <p className="text-muted-foreground max-w-md">
          We couldn't load your pipeline or account data from GHL. Please check your connection and credentials.
        </p>
        <Button onClick={() => refetchBootstrap()}>Try Again</Button>
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
      {bootstrapData?.isPartial && showPartialBanner && (
        <div className="fixed top-0 left-0 right-0 bg-warning text-warning-foreground dark:bg-warning-soft dark:text-warning px-4 py-2 text-sm font-medium z-[100] shadow-md flex items-center justify-between">
          <span>Some workspace data failed to load ({bootstrapData.failed?.join(', ')}).</span>
          <div className="flex items-center gap-2">
            <button onClick={() => refetchBootstrap()} className="underline hover:no-underline">Retry</button>
            <button onClick={() => setShowPartialBanner(false)} className="p-1 hover:bg-black/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground dark:bg-destructive-soft dark:text-destructive text-center py-2 text-sm font-medium z-[100] shadow-md border-b border-destructive/20">
          You are currently offline. Some features may be unavailable.
        </div>
      )}
      <ScrollRestoration />
    </>
  );
}
