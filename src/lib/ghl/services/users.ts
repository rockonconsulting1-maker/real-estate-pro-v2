import { ghlFetch, getGhlCredentials } from '../client';
import { GhlUser, ghlUserSchema } from '@/types/ghl';

export const usersService = {
  async list(): Promise<GhlUser[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ users: unknown[] }>('/users/', {
      query: { locationId }
    });
    return (result.users || []).map((u) => ghlUserSchema.parse(u));
  },

  async get(id: string): Promise<GhlUser> {
    const result = await ghlFetch<{user: unknown}>(`/users/${id}`);
    return ghlUserSchema.parse(result.user);
  }
};
