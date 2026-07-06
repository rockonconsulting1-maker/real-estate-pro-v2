import { ghlFetch, getGhlCredentials } from '../client';
import { Contact, contactSchema } from '@/types/ghl';

export const contactsService = {
  async search(params: { query?: string; tags?: string[]; page?: number; limit?: number } = {}): Promise<{ contacts: Contact[]; meta: any }> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/contacts/', {
      query: { locationId, query: params.query, limit: params.limit || 20, page: params.page || 1 }
    });
    
    let contacts = (result.contacts || []).map((c: any) => contactSchema.parse(c));
    
    if (params.tags && params.tags.length > 0) {
      contacts = contacts.filter((c: Contact) => 
        c.tags && params.tags!.some(t => c.tags!.includes(t))
      );
    }
    
    return { contacts, meta: result.meta || {} };
  },

  async get(id: string): Promise<Contact> {
    const result = await ghlFetch<{contact: any}>(`/contacts/${id}`);
    return contactSchema.parse(result.contact);
  },

  async create(data: Partial<Contact>): Promise<Contact> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{contact: any}>('/contacts/', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return contactSchema.parse(result.contact);
  },

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    const result = await ghlFetch<{contact: any}>(`/contacts/${id}`, {
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

  async appointments(id: string): Promise<any[]> {
    const result = await ghlFetch<any>(`/contacts/${id}/appointments`);
    return result.events || [];
  }
};
