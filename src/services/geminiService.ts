export interface InlineImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export type ChatPart = { text: string } | InlineImagePart;

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatPart[];
}

export class GeminiService {
  private history: ChatMessage[] = [];

  async sendMessage(message: string, image?: { data: string; mimeType: string }) {
    const userParts: ChatPart[] = [{ text: message }];
    if (image) {
      userParts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        image,
        history: this.history,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error ?? 'Raahi API request failed');
    }

    const fullResponse = String(payload?.response ?? '');

    this.history.push({ role: 'user', parts: userParts });
    this.history.push({ role: 'model', parts: [{ text: fullResponse }] });

    return fullResponse;
  }

  getHistory() {
    return this.history;
  }
}

export const raahiAI = new GeminiService();
