import { ghlFetch, getGhlCredentials } from '../client';
import { CustomField, CustomValue, Tag, MediaFile, Template, Location } from '@/types/ghl';

export const customFieldsService = {
  async list(): Promise<CustomField[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ customFields: CustomField[] }>(`/locations/${locationId}/customFields`);
    return result.customFields || [];
  },
  async getByObjectKey(objectKey: string): Promise<CustomField[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ customFields: CustomField[] }>(`/custom-fields/object-key/${objectKey}`, {
      query: { locationId }
    });
    return result.customFields || [];
  }
};

export const customValuesService = {
  async list(): Promise<CustomValue[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ customValues: CustomValue[] }>(`/locations/${locationId}/customValues`);
    return result.customValues || [];
  }
};

export const tagsService = {
  async list(): Promise<Tag[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ tags: Tag[] }>(`/locations/${locationId}/tags`);
    return result.tags || [];
  }
};

export const locationsService = {
  async get(): Promise<Location> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ location: Location }>(`/locations/${locationId}`);
    return result.location || ({} as Location);
  }
};

export const mediasService = {
  async list(): Promise<MediaFile[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ files: MediaFile[] }>('/medias/files', {
      query: { altId: locationId, altType: 'location' }
    });
    return result.files || [];
  },
  async upload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    // Note: GHL API might require hosted attachments or direct file upload.
    // The endpoint is POST /medias/upload-file
    const result = await ghlFetch<{ url?: string; fileId?: string }>('/medias/upload-file', {
      method: 'POST',
      rawBody: formData,
    });
    // Return URL
    return result.url || result.fileId || '';
  }
};

export const templatesService = {
  async list(): Promise<Template[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ templates: Template[] }>(`/locations/${locationId}/templates`);
    return result.templates || [];
  }
};
