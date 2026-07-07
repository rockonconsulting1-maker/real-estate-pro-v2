import { ghlFetch, getGhlCredentials } from '../client';
import { Contact, contactSchema } from '@/types/ghl';

export const contactsService = {
  async search(params: { query?: string; tags?: string[]; page?: number; limit?: number } = {}): Promise<{ contacts: Contact[]; meta: any }> {
    const { locationId } = getGhlCredentials();
    
    let filters: any[] = [];
    if (params.tags && params.tags.length > 0) {
      filters.push({
        group: 'OR',
        filters: params.tags.map(tag => ({
          field: 'tag',
          operator: 'eq',
          value: tag
        }))
      });
    }

    const result = await ghlFetch<{ contacts: unknown[]; meta?: Record<string, unknown> }>('/contacts/search', {
      method: 'POST',
      body: { 
        locationId, 
        query: params.query, 
        limit: params.limit || 20, 
        page: params.page || 1,
        filters: filters.length > 0 ? filters : undefined
      }
    });
    
    let contacts = (result.contacts || []).map((c) => contactSchema.parse(c));
    
    return { contacts, meta: result.meta || {} };
  },

  async get(id: string): Promise<Contact> {
    const result = await ghlFetch<{contact: unknown}>(`/contacts/${id}`);
    return contactSchema.parse(result.contact);
  },

  async create(data: Partial<Contact>): Promise<Contact> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{contact: unknown}>('/contacts/', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return contactSchema.parse(result.contact);
  },

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    const result = await ghlFetch<{contact: unknown}>(`/contacts/${id}`, {
      method: 'PUT',
      body: data
    });
    return contactSchema.parse(result.contact);
  },

  async delete(id: string): Promise<void> {
    await ghlFetch(`/contacts/${id}`, { method: 'DELETE' });
  },

  async addTags(id: string, tags: string[]): Promise<void> {
    await ghlFetch(`/contacts/${id}/tags`, {
      method: 'POST',
      body: { tags }
    });
  },

  async removeTags(id: string, tags: string[]): Promise<void> {
    await ghlFetch(`/contacts/${id}/tags`, {
      method: 'DELETE',
      body: { tags }
    });
  },

  async appointments(id: string): Promise<unknown[]> {
    const result = await ghlFetch<{ events: unknown[] }>(`/contacts/${id}/appointments`);
    return result.events || [];
  }
};
