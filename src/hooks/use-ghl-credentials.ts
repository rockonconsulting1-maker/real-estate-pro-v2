import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/auth-provider';
import { sb } from '@/lib/queryKeys';

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
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('ghl_credentials')
        .select('pit_token, location_id, default_calendar_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      
      return data as GhlCredentials;
    },
    enabled: !!session?.user?.id,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    pit: data?.pit_token,
    locationId: data?.location_id,
    isConfigured: !!data?.pit_token && !!data?.location_id,
    isLoading,
    refresh: refetch,
  };
}
