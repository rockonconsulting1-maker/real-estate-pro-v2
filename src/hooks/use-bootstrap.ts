import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useGhlCredentials } from './use-ghl-credentials';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { customFieldsService, tagsService } from '@/lib/ghl/services/misc';
import { associationsService } from '@/lib/ghl/services/associations';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { usersService } from '@/lib/ghl/services/users';
import { objectsService, OBJECT_KEYS } from '@/lib/ghl/services/objects';
import { PipelineRegistry } from '@/lib/pipeline-registry';

import { getGhlCredentials } from '@/lib/ghl/client';

export function useBootstrap() {
  const { isConfigured, locationId } = useGhlCredentials();
  const [settledCount, setSettledCount] = useState(0);

  const query = useQuery({
    queryKey: ['bootstrap', locationId],
    queryFn: async () => {
      setSettledCount(0);
      const promises = [
        opportunitiesService.getPipelines(),
        customFieldsService.list(),
        associationsService.getKeys(),
        calendarsService.list(),
        usersService.list(),
        tagsService.list(),
        objectsService.getSchema(OBJECT_KEYS.listings),
        objectsService.getSchema(OBJECT_KEYS.properties),
        objectsService.getSchema(OBJECT_KEYS.offers),
      ];
      
      const wrappedPromises = promises.map(p => 
        p.finally(() => setSettledCount(c => c + 1))
      );

      // Parallel load
      const results = await Promise.allSettled(wrappedPromises);

      const [
        pipelines, fields, assocKeys, calendars, users, tags,
        schemaListings, schemaProperties, schemaOffers
      ] = results;

      if (results.every(r => r.status === 'rejected')) {
        throw new Error('All bootstrap requests failed');
      }

      const resolvedPipelines = pipelines.status === 'fulfilled' ? (pipelines.value as any[]) : [];
      PipelineRegistry.setPipelines(resolvedPipelines);

      const failed: string[] = [];
      if (pipelines.status === 'rejected') failed.push('pipelines');
      if (fields.status === 'rejected') failed.push('fields');
      if (assocKeys.status === 'rejected') failed.push('assocKeys');
      if (calendars.status === 'rejected') failed.push('calendars');
      if (users.status === 'rejected') failed.push('users');
      if (schemaListings.status === 'rejected') failed.push('schemaListings');
      if (schemaProperties.status === 'rejected') failed.push('schemaProperties');
      if (schemaOffers.status === 'rejected') failed.push('schemaOffers');

      return {
        pipelines: resolvedPipelines,
        fields: fields.status === 'fulfilled' ? fields.value : [],
        assocKeys: assocKeys.status === 'fulfilled' ? assocKeys.value : [],
        calendars: calendars.status === 'fulfilled' ? calendars.value : [],
        users: users.status === 'fulfilled' ? users.value : [],
        tags: tags.status === 'fulfilled' ? tags.value : [],
        schemas: {
          listings: schemaListings.status === 'fulfilled' ? schemaListings.value : null,
          properties: schemaProperties.status === 'fulfilled' ? schemaProperties.value : null,
          offers: schemaOffers.status === 'fulfilled' ? schemaOffers.value : null,
        },
        isPartial: failed.length > 0,
        failed,
      };
    },
    enabled: isConfigured && !!getGhlCredentials().pit,
    staleTime: STALE_TIMES.SCHEMA,
    gcTime: STALE_TIMES.SCHEMA,
  });

  return {
    ...query,
    isSettled: query.isSuccess || query.isError,
    settledCount,
  };
}
