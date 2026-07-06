import { ghlFetch, getGhlCredentials } from '../client';
import { GhlUser, ghlUserSchema } from '@/types/ghl';

export const usersService = {
  async list(): Promise<GhlUser[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/users/search', {
      query: { locationId }
    });
    return (result.users || []).map((u: any) => ghlUserSchema.parse(u));
  },

  async get(id: string): Promise<GhlUser> {
    const result = await ghlFetch<{user: any}>(`/users/${id}`);
    return ghlUserSchema.parse(result.user);
  }
};
