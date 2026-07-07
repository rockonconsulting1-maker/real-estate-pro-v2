import { ghlFetch, getGhlCredentials } from '../client';
import { AssociationKey, Relation } from '@/types/ghl';

export const associationsService = {
  async getKeys(): Promise<AssociationKey[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ associations: AssociationKey[] }>('/associations/', {
      query: { locationId, skip: 0, limit: 100 }
    });
    return result.associations || [];
  },

  async relationsByRecord(recordId: string, objectKey?: string): Promise<Relation[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ relations: Relation[] }>(`/associations/relations`, {
      query: { locationId, recordId, objectKey }
    });
    return result.relations || [];
  },

  async createRelation(data: Record<string, unknown>): Promise<Relation> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<Relation>('/associations/relations', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return result;
  },

  async deleteRelation(relationId: string): Promise<void> {
    const { locationId } = getGhlCredentials();
    await ghlFetch(`/associations/relations/${relationId}`, {
      method: 'DELETE',
      query: { locationId }
    });
  }
};
