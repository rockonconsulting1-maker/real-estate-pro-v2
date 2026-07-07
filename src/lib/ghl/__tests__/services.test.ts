import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contactsService, opportunitiesService, objectsService, OBJECT_KEYS } from '../services';
import * as client from '../client';

describe('GHL Services', () => {
  let ghlFetchSpy: any;

  beforeEach(() => {
    client.setGhlCredentials('test-pit', 'test-location');
    ghlFetchSpy = vi.spyOn(client, 'ghlFetch').mockResolvedValue({} as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    client.setGhlCredentials(null, null);
  });

  describe('contactsService', () => {
    it('maps params correctly for search', async () => {
      ghlFetchSpy.mockResolvedValue({ contacts: [], meta: {} });
      await contactsService.search({ query: 'test', page: 2, limit: 10 });
      
      expect(ghlFetchSpy).toHaveBeenCalledWith('/contacts/search', expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          locationId: 'test-location',
          query: 'test',
          page: 2,
          limit: 10
        })
      }));
    });
  });

  describe('opportunitiesService', () => {
    it('only sends mapped query params', async () => {
      ghlFetchSpy.mockResolvedValue({ opportunities: [], meta: {} });
      await opportunitiesService.search({ 
        pipelineId: 'p1', 
        status: 'open', 
        q: 'test',
        date: '2023-01-01'
      });
      
      expect(ghlFetchSpy).toHaveBeenCalledWith('/opportunities/search', expect.objectContaining({
        query: {
          location_id: 'test-location',
          pipeline_id: 'p1',
          status: 'open',
          q: 'test',
          date: '2023-01-01'
        }
      }));
    });
  });

  describe('objectsService', () => {
    it('uses the correct path for searchRecords', async () => {
      ghlFetchSpy.mockResolvedValue({ records: [], meta: {} });
      await objectsService.searchRecords(OBJECT_KEYS.listings, { pageLimit: 5 });
      
      expect(ghlFetchSpy).toHaveBeenCalledWith('/objects/custom_objects.my_listings/records/search', expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          locationId: 'test-location',
          pageLimit: 5
        })
      }));
    });
  });
});
