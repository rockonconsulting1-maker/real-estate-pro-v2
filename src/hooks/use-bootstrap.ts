import { useQuery } from '@tanstack/react-query';
import { useGhlCredentials } from './use-ghl-credentials';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { customFieldsService, tagsService } from '@/lib/ghl/services/misc';
import { associationsService } from '@/lib/ghl/services/associations';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { usersService } from '@/lib/ghl/services/users';
import { PipelineRegistry } from '@/lib/pipeline-registry';

export function useBootstrap() {
  const { isConfigured, locationId } = useGhlCredentials();

  const query = useQuery({
    queryKey: ['bootstrap', locationId],
    queryFn: async () => {
      // Parallel load
      const [
        pipelines,
        fields,
        assocKeys,
        calendars,
        users,
        tags
      ] = await Promise.allSettled([
        opportunitiesService.getPipelines(),
        customFieldsService.list(),
        associationsService.getKeys(),
        calendarsService.list(),
        usersService.list(),
        tagsService.list(),
      ]);

      const resolvedPipelines = pipelines.status === 'fulfilled' ? pipelines.value : [];
      PipelineRegistry.setPipelines(resolvedPipelines);

      return {
        pipelines: resolvedPipelines,
        fields: fields.status === 'fulfilled' ? fields.value : [],
        assocKeys: assocKeys.status === 'fulfilled' ? assocKeys.value : [],
        calendars: calendars.status === 'fulfilled' ? calendars.value : [],
        users: users.status === 'fulfilled' ? users.value : [],
        tags: tags.status === 'fulfilled' ? tags.value : [],
        isPartial: [pipelines, fields, assocKeys, calendars, users, tags].some(
          r => r.status === 'rejected'
        ),
      };
    },
    enabled: isConfigured,
    staleTime: STALE_TIMES.SCHEMA,
    gcTime: STALE_TIMES.SCHEMA,
  });

  return {
    ...query,
    isSettled: query.isSuccess || query.isError,
  };
}
