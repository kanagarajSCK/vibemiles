// ============================================================
// VIBEMILES — CLIENT ASSISTANT SERVICE
// ============================================================

import type { AssistantChatMessage, AssistantResponse } from '@/server/ai/types';

class AssistantService {
  async sendMessage(messages: AssistantChatMessage[]): Promise<AssistantResponse> {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to communicate with AI travel assistant');
    }

    return json.data;
  }
}

export const assistantService = new AssistantService();
