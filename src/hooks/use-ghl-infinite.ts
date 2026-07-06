import { useInfiniteQuery } from '@tanstack/react-query';
import { useGhlCredentials } from './use-ghl-credentials';
import { STALE_TIMES } from '@/lib/queryKeys';

export function useGhlInfinite<T>(
  queryKey: any[],
  fetchFn: (pageParam: string | null) => Promise<{ data: T[]; nextCursor: string | null }>
) {
  const { isConfigured } = useGhlCredentials();

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isConfigured,
    staleTime: STALE_TIMES.LIST,
  });
}
