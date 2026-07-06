import { ghlFetch, getGhlCredentials } from '../client';
import { CustomObjectRecord, customObjectRecordSchema } from '@/types/ghl';

export const objectsService = {
  async searchRecords(schemaKey: string, params: { query?: string; page?: number; pageLimit?: number; searchAfter?: string; filters?: any } = {}): Promise<{ records: CustomObjectRecord[]; meta: any }> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>(`/custom-objects/${schemaKey}/records/search`, {
      method: 'POST',
      body: {
        locationId,
        query: params.query,
        limit: params.pageLimit || 20,
        searchAfter: params.searchAfter,
        filters: params.filters
      }
    });
    
    const records = (result.records || []).map((r: any) => customObjectRecordSchema.parse(r));
    return { records, meta: result.meta || {} };
  },

  async getRecord(schemaKey: string, id: string): Promise<CustomObjectRecord> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{record: any}>(`/custom-objects/${schemaKey}/records/${id}`, {
      query: { locationId }
    });
    return customObjectRecordSchema.parse(result.record);
  },

  async createRecord(schemaKey: string, data: any): Promise<CustomObjectRecord> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{record: any}>(`/custom-objects/${schemaKey}/records`, {
      method: 'POST',
      body: { ...data, locationId }
    });
    return customObjectRecordSchema.parse(result.record);
  },

  async updateRecord(schemaKey: string, id: string, data: any): Promise<CustomObjectRecord> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{record: any}>(`/custom-objects/${schemaKey}/records/${id}`, {
      method: 'PUT',
      body: { ...data, locationId }
    });
    return customObjectRecordSchema.parse(result.record);
  },

  async deleteRecord(schemaKey: string, id: string): Promise<void> {
    const { locationId } = getGhlCredentials();
    await ghlFetch(`/custom-objects/${schemaKey}/records/${id}`, { 
      method: 'DELETE',
      query: { locationId }
    });
  }
};

// Thin wrappers
export const myListingsService = {
  search: (params: any) => objectsService.searchRecords('my_listings', params),
  get: (id: string) => objectsService.getRecord('my_listings', id),
  create: (data: any) => objectsService.createRecord('my_listings', data),
  update: (id: string, data: any) => objectsService.updateRecord('my_listings', id, data),
  delete: (id: string) => objectsService.deleteRecord('my_listings', id),
};

export const mlsPropertiesService = {
  search: (params: any) => objectsService.searchRecords('properties', params),
  get: (id: string) => objectsService.getRecord('properties', id),
};

export const offersService = {
  search: (params: any) => objectsService.searchRecords('real_estate_offer', params),
  get: (id: string) => objectsService.getRecord('real_estate_offer', id),
  create: (data: any) => objectsService.createRecord('real_estate_offer', data),
  update: (id: string, data: any) => objectsService.updateRecord('real_estate_offer', id, data),
  delete: (id: string) => objectsService.deleteRecord('real_estate_offer', id),
};
