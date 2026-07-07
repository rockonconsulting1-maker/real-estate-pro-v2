import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/auth-provider';
import { sb } from '@/lib/queryKeys';
import { setGhlCredentials } from '@/lib/ghl/client';

export interface GhlCredentials {
  pit_token: string;
  location_id: string;
  default_calendar_id?: string;
}

export function useGhlCredentials() {
  const { session } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [...sb.creds(), session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        setGhlCredentials(null, null);
        return null;
      }
      
      const { data, error } = await supabase
        .from('ghl_credentials')
        .select('pit_token, location_id, default_calendar_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      let creds = data as GhlCredentials | null;

      // Dev fallback
      if (!creds && import.meta.env.DEV) {
        const devPit = import.meta.env.VITE_GHL_PIT;
        const devLoc = import.meta.env.VITE_GHL_LOCATION_ID;
        if (devPit && devLoc) {
          creds = {
            pit_token: devPit,
            location_id: devLoc,
          };
        }
      }

      if (creds) {
        setGhlCredentials(creds.pit_token, creds.location_id);
      } else {
        setGhlCredentials(null, null);
      }
      
      return creds;
    },
    enabled: !!session?.user?.id,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    pit: data?.pit_token,
    locationId: data?.location_id,
    defaultCalendarId: data?.default_calendar_id,
    isConfigured: !!data?.pit_token && !!data?.location_id,
    isLoading,
    refresh: refetch,
  };
}
