import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_SYSTEM_INSTRUCTION = `You are Latexer AI Copilot, a world-class scientific editor, computational linguist, and LaTeX typesetting authority.
You assist authors in writing academic manuscripts, research papers, presentations, and technical documentation with impeccable English grammar and flawless LaTeX.

Guidelines:
1. Academic English Grammar: Fix all grammatical mistakes, subject-verb agreement errors, awkward phrasing, redundancy, and weak word choices. Elevate tone to clear, publication-grade academic English.
2. Compilable & Idiomatic LaTeX: Always generate valid, idiomatic LaTeX. Use modern best-practice packages (e.g., booktabs for tables, amsmath/amssymb for math, hyperref for links, graphicx for figures, TikZ for diagrams).
3. Code Wrapping: When providing LaTeX code blocks in chat, wrap them in standard markdown fences: \`\`\`latex ... \`\`\`.
4. Conciseness: Keep explanations concise, professional, and clear.
5. In-place Formatting: If asked to format a table or equation, generate complete environments ready for immediate use.`;

const INLINE_SYSTEM_INSTRUCTION = `You are an inline text and code transformation engine for a LaTeX editor.
Your task is to take the user's selected text/LaTeX code and instruction (such as grammar correction, academic tone enhancement, or LaTeX formatting), and output ONLY the replacement text.
DO NOT wrap your answer in markdown code fences unless the selected snippet itself was a standalone code block.
DO NOT include conversational filler, greetings, explanations, or notes.
Output ONLY the transformed text or LaTeX code ready to be dropped directly into the file.`;

export interface AiChatParams {
  provider?: 'groq' | 'gemini';
  apiKey?: string;
  model?: string;
  prompt: string;
  history?: Array<{ role: 'user' | 'model' | 'assistant'; parts?: Array<{ text: string }>; content?: string }>;
  documentContext?: string;
  selectedText?: string;
}

export interface AiInlineParams {
  provider?: 'groq' | 'gemini';
  apiKey?: string;
  model?: string;
  instruction: string;
  selectedText: string;
  surroundingContext?: string;
}

// Helper to determine AI provider based on model or keys
export function resolveProvider(model?: string, explicitProvider?: 'groq' | 'gemini'): 'groq' | 'gemini' {
  if (explicitProvider) return explicitProvider;
  if (!model) {
    if (process.env.GROQ_API_KEY) return 'groq';
    return 'gemini';
  }
  if (model.startsWith('gemini-')) return 'gemini';
  return 'groq';
}

// ================= Groq Implementation =================
async function chatWithGroq(params: AiChatParams): Promise<string> {
  const key = params.apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Groq API key is required. Please set it in AI Settings or server .env.');
  }

  const model = params.model && !params.model.startsWith('gemini-') ? params.model : 'openai/gpt-oss-120b';

  // Construct message chain for OpenAI-compatible endpoint
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: DEFAULT_SYSTEM_INSTRUCTION },
  ];

  // Convert history
  if (params.history && params.history.length > 0) {
    for (const h of params.history) {
      const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
      let content = h.content || '';
      if (!content && h.parts && h.parts.length > 0) {
        content = h.parts.map((p) => p.text).join('\n');
      }
      if (content) {
        messages.push({ role, content });
      }
    }
  }

  // Build context
  let contextAddendum = '';
  if (params.documentContext) {
    contextAddendum += `\n\n[Active LaTeX Document Context]:\n\`\`\`latex\n${params.documentContext.slice(0, 15000)}\n\`\`\`\n`;
  }
  if (params.selectedText) {
    contextAddendum += `\n[Currently Selected LaTeX Code]:\n\`\`\`latex\n${params.selectedText}\n\`\`\`\n`;
  }

  messages.push({
    role: 'user',
    content: `${params.prompt}${contextAddendum}`,
  });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(errBody.error?.message || `Groq API returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return choice?.message?.content || choice?.text || 'No response generated.';
}

async function inlineEditWithGroq(params: AiInlineParams): Promise<string> {
  const key = params.apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Groq API key is required. Please set it in AI Settings or server .env.');
  }

  const model = params.model && !params.model.startsWith('gemini-') ? params.model : 'openai/gpt-oss-120b';

  const userContent = `Instruction: ${params.instruction}

Selected LaTeX code / text to modify:
${params.selectedText}

${params.surroundingContext ? `Surrounding file context:\n${params.surroundingContext.slice(0, 5000)}` : ''}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: INLINE_SYSTEM_INSTRUCTION },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(errBody.error?.message || `Groq API returned ${res.status}`);
  }

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content?.trim() || '';

  // Strip accidental markdown fences if returned
  if (text.startsWith('```latex')) {
    text = text.replace(/^```latex\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return text.trim();
}

// ================= Gemini Implementation =================
export async function chatWithGemini(params: {
  apiKey?: string;
  model?: string;
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  documentContext?: string;
  selectedText?: string;
}): Promise<string> {
  const key = params.apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key is required.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = params.model || 'gemini-1.5-flash';

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
  });

  let contextAddendum = '';
  if (params.documentContext) {
    contextAddendum += `\n\n[Active LaTeX Document Context]:\n\`\`\`latex\n${params.documentContext.slice(0, 15000)}\n\`\`\`\n`;
  }
  if (params.selectedText) {
    contextAddendum += `\n[Currently Selected LaTeX Code]:\n\`\`\`latex\n${params.selectedText}\n\`\`\`\n`;
  }

  const userMessage = `${params.prompt}${contextAddendum}`;

  const chat = model.startChat({
    history: params.history || [],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

export async function inlineEditWithGemini(params: {
  apiKey?: string;
  model?: string;
  instruction: string;
  selectedText: string;
  surroundingContext?: string;
}): Promise<string> {
  const key = params.apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key is required.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = params.model || 'gemini-1.5-flash';

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: INLINE_SYSTEM_INSTRUCTION,
  });

  const prompt = `Instruction: ${params.instruction}

Selected LaTeX code to modify:
${params.selectedText}

${params.surroundingContext ? `Surrounding file context:\n${params.surroundingContext.slice(0, 5000)}` : ''}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  if (text.startsWith('```latex')) {
    text = text.replace(/^```latex\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return text.trim();
}

// Unified Dispatchers
export async function dispatchAiChat(params: AiChatParams): Promise<string> {
  const provider = resolveProvider(params.model, params.provider);
  if (provider === 'groq') {
    return chatWithGroq(params);
  }
  return chatWithGemini(params as any);
}

export async function dispatchAiInlineEdit(params: AiInlineParams): Promise<string> {
  const provider = resolveProvider(params.model, params.provider);
  if (provider === 'groq') {
    return inlineEditWithGroq(params);
  }
  return inlineEditWithGemini(params);
}
