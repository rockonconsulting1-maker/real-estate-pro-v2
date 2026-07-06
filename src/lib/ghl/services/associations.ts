import { ghlFetch, getGhlCredentials } from '../client';

export const associationsService = {
  async getKeys(): Promise<any[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/associations/keys', {
      query: { locationId }
    });
    return result.keys || [];
  },

  async relationsByRecord(recordId: string, objectKey?: string): Promise<any[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>(`/associations/relations`, {
      query: { locationId, recordId, objectKey }
    });
    return result.relations || [];
  },

  async createRelation(data: any): Promise<any> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/associations/relations', {
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
