import { ghlFetch, getGhlCredentials } from '../client';
import { GhlTask, ghlTaskSchema } from '@/types/ghl';

export const tasksGlobalService = {
  async search(params: { contactId?: string; completed?: boolean; page?: number; assignedTo?: string } = {}): Promise<{ tasks: GhlTask[]; meta: any }> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>(`/locations/${locationId}/tasks/search`, {
      method: 'POST',
      body: params
    });
    
    const tasks = (result.tasks || []).map((t: any) => ghlTaskSchema.parse(t));
    return { tasks, meta: result.meta || {} };
  },

  async create(contactId: string, data: Partial<GhlTask>): Promise<GhlTask> {
    const result = await ghlFetch<{task: any}>(`/contacts/${contactId}/tasks`, {
      method: 'POST',
      body: data
    });
    return ghlTaskSchema.parse(result.task);
  },

  async update(contactId: string, taskId: string, data: Partial<GhlTask>): Promise<GhlTask> {
    const result = await ghlFetch<{task: any}>(`/contacts/${contactId}/tasks/${taskId}`, {
      method: 'PUT',
      body: data
    });
    return ghlTaskSchema.parse(result.task);
  },

  async delete(contactId: string, taskId: string): Promise<void> {
    await ghlFetch(`/contacts/${contactId}/tasks/${taskId}`, { method: 'DELETE' });
  }
};
