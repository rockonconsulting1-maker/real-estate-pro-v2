import { ghlFetch, getGhlCredentials } from '../client';
import { Conversation, conversationSchema, Message, messageSchema } from '@/types/ghl';

export const conversationsService = {
  async list(params: { contactId?: string; page?: number } = {}): Promise<{ conversations: Conversation[]; meta: Record<string, unknown> }> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ conversations: unknown[]; meta?: Record<string, unknown> }>('/conversations/search', {
      query: { locationId, ...params }
    });
    
    const conversations = (result.conversations || []).map((c) => conversationSchema.parse(c));
    return { conversations, meta: result.meta || {} };
  },

  async messages(conversationId: string, params: { page?: number } = {}): Promise<{ messages: Message[]; meta: Record<string, unknown> }> {
    const result = await ghlFetch<{ messages: unknown[]; meta?: Record<string, unknown> }>(`/conversations/${conversationId}/messages`, {
      query: params
    });
    
    const messages = (result.messages || []).map((m) => messageSchema.parse(m));
    return { messages, meta: result.meta || {} };
  },

  async sendMessage(data: Record<string, unknown>): Promise<Message> {
    const result = await ghlFetch<{message: unknown}>(`/conversations/messages`, {
      method: 'POST',
      body: data
    });
    return messageSchema.parse(result.message);
  },

  async markRead(conversationId: string): Promise<void> {
    await ghlFetch(`/conversations/${conversationId}`, {
      method: 'PUT',
      body: { unreadCount: 0 }
    });
  }
};
