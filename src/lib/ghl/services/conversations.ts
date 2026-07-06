import { ghlFetch, getGhlCredentials } from '../client';
import { Conversation, conversationSchema, Message, messageSchema } from '@/types/ghl';

export const conversationsService = {
  async list(params: { contactId?: string; page?: number } = {}): Promise<{ conversations: Conversation[]; meta: any }> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/conversations/search', {
      query: { locationId, ...params }
    });
    
    const conversations = (result.conversations || []).map((c: any) => conversationSchema.parse(c));
    return { conversations, meta: result.meta || {} };
  },

  async messages(conversationId: string, params: { page?: number } = {}): Promise<{ messages: Message[]; meta: any }> {
    const result = await ghlFetch<any>(`/conversations/${conversationId}/messages`, {
      query: params
    });
    
    const messages = (result.messages || []).map((m: any) => messageSchema.parse(m));
    return { messages, meta: result.meta || {} };
  },

  async sendMessage(conversationId: string, data: any): Promise<Message> {
    const result = await ghlFetch<{message: any}>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: data
    });
    return messageSchema.parse(result.message);
  },

  async markRead(conversationId: string): Promise<void> {
    await ghlFetch(`/conversations/${conversationId}/read`, {
      method: 'PUT'
    });
  }
};
