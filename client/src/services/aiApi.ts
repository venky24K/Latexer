export interface SupportedModel {
  id: string;
  name: string;
  provider: 'groq' | 'gemini';
}

export interface AiStatus {
  configured: boolean;
  hasGroq: boolean;
  hasGemini: boolean;
  defaultModel: string;
  defaultProvider: 'groq' | 'gemini';
  supportedModels: SupportedModel[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function fetchAiStatus(): Promise<AiStatus> {
  const res = await fetch('/api/ai/status');
  if (!res.ok) throw new Error('Failed to fetch AI status');
  return res.json();
}

export async function sendAiChatRequest(params: {
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  documentContext?: string;
  selectedText?: string;
  model?: string;
  apiKey?: string;
  provider?: 'groq' | 'gemini';
}): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || 'AI Chat failed');
  }

  const data = await res.json();
  return data.reply;
}

export async function sendAiInlineEditRequest(params: {
  instruction: string;
  selectedText: string;
  surroundingContext?: string;
  model?: string;
  apiKey?: string;
  provider?: 'groq' | 'gemini';
}): Promise<string> {
  const res = await fetch('/api/ai/inline-edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || 'AI Inline Edit failed');
  }

  const data = await res.json();
  return data.replacement;
}
