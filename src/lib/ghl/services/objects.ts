import { ghlFetch, getGhlCredentials } from '../client';
import { CustomObjectRecord, customObjectRecordSchema } from '@/types/ghl';

export const OBJECT_KEYS = {
  listings: 'custom_objects.my_listings',
  properties: 'custom_objects.properties',
  offers: 'custom_objects.real_estate_offer'
} as const;

export const objectsService = {
  async getSchema(schemaKey: string): Promise<Record<string, unknown>> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ schema?: Record<string, unknown> } & Record<string, unknown>>(`/objects/${schemaKey}`, {
      query: { locationId }
    });
    return result.schema || result;
  },

  async searchRecords(schemaKey: string, params: { query?: string; page?: number; pageLimit?: number; searchAfter?: string[]; filters?: unknown[] } = {}): Promise<{ records: CustomObjectRecord[]; meta: Record<string, unknown> }> {
    const { locationId } = getGhlCredentials();
    
    // Build the request body matching GHL API strictly
    const body: Record<string, any> = { locationId };
    if (params.query) body.query = params.query;
    if (params.pageLimit) body.limit = params.pageLimit;
    else body.limit = 20; // Default limit
    if (params.searchAfter) body.searchAfter = params.searchAfter;
    // Note: 'filters' is omitted from the body as it causes 422 Unprocessable Content errors.
    // Custom Object filtering must be done client-side or using supported query parameters.
    
    const result = await ghlFetch<{ records: unknown[]; meta?: Record<string, unknown> }>(`/objects/${schemaKey}/records/search`, {
      method: 'POST',
      body
    });
    
    const records = (result.records || []).map((r) => customObjectRecordSchema.parse(r));
    return { records, meta: result.meta || {} };
  },

  async getRecord(schemaKey: string, id: string): Promise<CustomObjectRecord> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{record: unknown}>(`/objects/${schemaKey}/records/${id}`, {
      query: { locationId }
    });
    return customObjectRecordSchema.parse(result.record);
  },

  async createRecord(schemaKey: string, data: Record<string, unknown>): Promise<CustomObjectRecord> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{record: unknown}>(`/objects/${schemaKey}/records`, {
      method: 'POST',
      body: { ...data, locationId }
    });
    return customObjectRecordSchema.parse(result.record);
  },

  async updateRecord(schemaKey: string, id: string, data: Record<string, unknown>): Promise<CustomObjectRecord> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{record: unknown}>(`/objects/${schemaKey}/records/${id}`, {
      method: 'PUT',
      body: { ...data, locationId }
    });
    return customObjectRecordSchema.parse(result.record);
  },

  async deleteRecord(schemaKey: string, id: string): Promise<void> {
    const { locationId } = getGhlCredentials();
    await ghlFetch(`/objects/${schemaKey}/records/${id}`, { 
      method: 'DELETE',
      query: { locationId }
    });
  }
};

// Thin wrappers
export const myListingsService = {
  search: (params: any) => objectsService.searchRecords(OBJECT_KEYS.listings, params),
  get: (id: string) => objectsService.getRecord(OBJECT_KEYS.listings, id),
  create: (data: any) => objectsService.createRecord(OBJECT_KEYS.listings, data),
  update: (id: string, data: any) => objectsService.updateRecord(OBJECT_KEYS.listings, id, data),
  delete: (id: string) => objectsService.deleteRecord(OBJECT_KEYS.listings, id),
};

export const mlsPropertiesService = {
  search: (params: any) => objectsService.searchRecords(OBJECT_KEYS.properties, params),
  get: (id: string) => objectsService.getRecord(OBJECT_KEYS.properties, id),
};

export const offersService = {
  search: (params: any) => objectsService.searchRecords(OBJECT_KEYS.offers, params),
  get: (id: string) => objectsService.getRecord(OBJECT_KEYS.offers, id),
  create: (data: any) => objectsService.createRecord(OBJECT_KEYS.offers, data),
  update: (id: string, data: any) => objectsService.updateRecord(OBJECT_KEYS.offers, id, data),
  delete: (id: string) => objectsService.deleteRecord(OBJECT_KEYS.offers, id),
};
