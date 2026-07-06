import { ghlFetch, getGhlCredentials } from '../client';

export const customFieldsService = {
  async list(): Promise<any[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/custom-fields/', {
      query: { locationId }
    });
    return result.customFields || [];
  }
};

export const customValuesService = {
  async list(): Promise<any[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/custom-values/', {
      query: { locationId }
    });
    return result.customValues || [];
  }
};

export const tagsService = {
  async list(): Promise<any[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/tags/', {
      query: { locationId }
    });
    return result.tags || [];
  }
};

export const locationsService = {
  async get(): Promise<any> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>(`/locations/${locationId}`);
    return result.location || {};
  }
};

export const mediasService = {
  async list(): Promise<any[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/medias/', {
      query: { locationId }
    });
    return result.files || [];
  }
};
