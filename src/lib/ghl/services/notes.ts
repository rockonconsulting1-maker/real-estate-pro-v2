import { ghlFetch } from '../client';
import { GhlNote, ghlNoteSchema } from '@/types/ghl';

export const notesService = {
  async list(contactId: string): Promise<GhlNote[]> {
    const result = await ghlFetch<any>(`/contacts/${contactId}/notes`);
    return (result.notes || []).map((n: any) => ghlNoteSchema.parse(n));
  },

  async get(contactId: string, noteId: string): Promise<GhlNote> {
    const result = await ghlFetch<any>(`/contacts/${contactId}/notes/${noteId}`);
    return ghlNoteSchema.parse(result.note);
  },

  async create(contactId: string, data: Partial<GhlNote>): Promise<GhlNote> {
    const result = await ghlFetch<{note: any}>(`/contacts/${contactId}/notes`, {
      method: 'POST',
      body: data
    });
    return ghlNoteSchema.parse(result.note);
  },

  async update(contactId: string, noteId: string, data: Partial<GhlNote>): Promise<GhlNote> {
    const result = await ghlFetch<{note: any}>(`/contacts/${contactId}/notes/${noteId}`, {
      method: 'PUT',
      body: data
    });
    return ghlNoteSchema.parse(result.note);
  },

  async delete(contactId: string, noteId: string): Promise<void> {
    await ghlFetch(`/contacts/${contactId}/notes/${noteId}`, { method: 'DELETE' });
  }
};
