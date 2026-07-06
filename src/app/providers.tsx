// Provider tree
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 60s default
      gcTime: 1000 * 60 * 60 * 24, // 24h
      retry: (failureCount, error: any) => {
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { QuickAddProvider } from '@/components/shared/quick-add';
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rc-crm-theme">
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ 
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          buster: 'v1.0.0', // app version
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              const keyStr = JSON.stringify(query.queryKey);
              if (keyStr.includes('credentials')) return false;
              return true;
            }
          }
        }}
      >
        <AuthProvider>
          <QuickAddProvider>
            {children}
          </QuickAddProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}