import { ghlFetch, getGhlCredentials } from '../client';
import { Opportunity, opportunitySchema, Pipeline, pipelineSchema } from '@/types/ghl';

export const opportunitiesService = {
  async search(params: { pipelineId?: string; contactId?: string; q?: string; page?: number; limit?: number; assignedTo?: string; filters?: any } = {}): Promise<{ opportunities: Opportunity[]; meta: any }> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/opportunities/search', {
      query: { locationId, ...params }
    });
    
    const opportunities = (result.opportunities || []).map((o: any) => opportunitySchema.parse(o));
    return { opportunities, meta: result.meta || {} };
  },

  async get(id: string): Promise<Opportunity> {
    const result = await ghlFetch<{opportunity: any}>(`/opportunities/${id}`);
    return opportunitySchema.parse(result.opportunity);
  },

  async create(data: Partial<Opportunity>): Promise<Opportunity> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{opportunity: any}>('/opportunities/', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return opportunitySchema.parse(result.opportunity);
  },

  async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    const result = await ghlFetch<{opportunity: any}>(`/opportunities/${id}`, {
      method: 'PUT',
      body: data
    });
    return opportunitySchema.parse(result.opportunity);
  },

  async updateStatus(id: string, status: 'open' | 'won' | 'lost' | 'abandoned'): Promise<Opportunity> {
    const result = await ghlFetch<{opportunity: any}>(`/opportunities/${id}/status`, {
      method: 'PUT',
      body: { status }
    });
    return opportunitySchema.parse(result.opportunity);
  },

  async delete(id: string): Promise<void> {
    await ghlFetch(`/opportunities/${id}`, { method: 'DELETE' });
  },

  async getPipelines(): Promise<Pipeline[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>(`/opportunities/pipelines`, {
      query: { locationId }
    });
    return (result.pipelines || []).map((p: any) => pipelineSchema.parse(p));
  }
};
