import { ghlFetch, getGhlCredentials } from '../client';
import { Opportunity, opportunitySchema, Pipeline, pipelineSchema } from '@/types/ghl';

export const opportunitiesService = {
  async search(params: { pipelineId?: string; pipelineStageId?: string; contactId?: string; q?: string; page?: number; limit?: number; assignedTo?: string; status?: string; date?: string } = {}): Promise<{ opportunities: Opportunity[]; meta: Record<string, unknown> }> {
    const { locationId } = getGhlCredentials();
    const query: Record<string, string | number> = { location_id: locationId! };
    
    if (params.q) query.q = params.q;
    if (params.pipelineId) query.pipeline_id = params.pipelineId;
    if (params.pipelineStageId) query.pipeline_stage_id = params.pipelineStageId;
    if (params.contactId) query.contact_id = params.contactId;
    if (params.assignedTo) query.assigned_to = params.assignedTo;
    if (params.status) query.status = params.status;
    if (params.date) query.date = params.date;
    if (params.limit) query.limit = params.limit;
    if (params.page) query.page = params.page;

    const result = await ghlFetch<{ opportunities: unknown[]; meta?: Record<string, unknown> }>('/opportunities/search', {
      query
    });
    
    const opportunities = (result.opportunities || []).map((o) => opportunitySchema.parse(o));
    return { opportunities, meta: result.meta || {} };
  },

  async get(id: string): Promise<Opportunity> {
    const result = await ghlFetch<{opportunity: unknown}>(`/opportunities/${id}`);
    return opportunitySchema.parse(result.opportunity);
  },

  async create(data: Partial<Opportunity>): Promise<Opportunity> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{opportunity: unknown}>('/opportunities/', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return opportunitySchema.parse(result.opportunity);
  },

  async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    const result = await ghlFetch<{opportunity: unknown}>(`/opportunities/${id}`, {
      method: 'PUT',
      body: data
    });
    return opportunitySchema.parse(result.opportunity);
  },

  async updateStatus(id: string, status: 'open' | 'won' | 'lost' | 'abandoned'): Promise<Opportunity> {
    const result = await ghlFetch<{opportunity: unknown}>(`/opportunities/${id}/status`, {
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
    const result = await ghlFetch<{ pipelines: unknown[] }>(`/opportunities/pipelines`, {
      query: { locationId }
    });
    return (result.pipelines || []).map((p) => pipelineSchema.parse(p));
  }
};
