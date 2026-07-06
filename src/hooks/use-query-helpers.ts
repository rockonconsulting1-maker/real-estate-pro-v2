import { useQueryClient, useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


export function usePrefetchOnHover() {
  const queryClient = useQueryClient();
  
  return useCallback((queryKey: any[], queryFn: () => Promise<any>) => {
    return {
      onMouseEnter: () => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 1000 * 60, // 1 min
        });
      }
    };
  }, [queryClient]);
}

export function seedDetailCache(queryClient: any, items: any[], detailKeyFn: (item: any) => any[]) {
  items.forEach(item => {
    queryClient.setQueryData(detailKeyFn(item), item);
  });
}

interface OptimisticOptions<TData, TVariables, TContext> extends UseMutationOptions<TData, Error, TVariables, TContext> {
  queryKey: any[];
  updater: (oldData: any, variables: TVariables) => any;
}

export function useOptimisticMutation<TData, TVariables>(options: OptimisticOptions<TData, TVariables, any>) {
  const queryClient = useQueryClient();
  const { queryKey, updater, onMutate, onError, onSettled, ...rest } = options;

  return useMutation({
    ...rest,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => updater(old, variables));
      
      if (onMutate) {
        await (onMutate as any)(variables);
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      if (onError) {
        (onError as any)(err, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      if (onSettled) {
        (onSettled as any)(data, error, variables, context);
      }
    }
  });
}
