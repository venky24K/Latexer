import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_SYSTEM_INSTRUCTION = `You are Latexer AI Copilot, an expert LaTeX typesetter, scientific researcher, and computer scientist.
You assist authors in writing academic manuscripts, research papers, presentations, and technical documentation in LaTeX.

Guidelines:
1. Always generate valid, compilable, and idiomatic LaTeX code.
2. Use modern best-practice packages (e.g., booktabs for tables, amsmath/amssymb for math, hyperref for links, graphicx for figures, TikZ for diagrams).
3. When providing LaTeX code blocks, ALWAYS wrap them in standard markdown fences: \`\`\`latex ... \`\`\`.
4. Keep explanations concise, professional, and clear.
5. If the user asks to format a table, generate a complete tabular or table environment with proper alignment and headers.
6. If the user asks to polish academic writing, improve tone, clarity, and grammatical precision while maintaining the author's original meaning.`;

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
    throw new Error('Gemini API key is required. Please provide your key in the AI Settings or set GEMINI_API_KEY in the environment.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = params.model || 'gemini-1.5-flash';
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
  });

  // Build context prefix
  let contextAddendum = '';
  if (params.documentContext) {
    const truncatedDoc = params.documentContext.slice(0, 15000); // safety length cap
    contextAddendum += `\n\n[Active LaTeX Document Context]:\n\`\`\`latex\n${truncatedDoc}\n\`\`\`\n`;
  }
  if (params.selectedText) {
    contextAddendum += `\n[Currently Selected LaTeX Code]:\n\`\`\`latex\n${params.selectedText}\n\`\`\`\n`;
  }

  const userMessage = `${params.prompt}${contextAddendum}`;

  const chat = model.startChat({
    history: params.history || [],
  });

  const result = await chat.sendMessage(userMessage);
  const response = result.response;
  return response.text();
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
    throw new Error('Gemini API key is required. Please provide your key in the AI Settings or set GEMINI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = params.model || 'gemini-1.5-flash';

  const systemInstruction = `You are an inline code transformation engine for a LaTeX editor.
Your task is to take the user's selected LaTeX code and instruction, and output ONLY the replacement LaTeX code.
DO NOT wrap your answer in markdown code fences unless requested.
DO NOT include conversational filler, explanations, or greetings.
Output ONLY the transformed LaTeX code ready to be dropped directly into the file.`;

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });

  const prompt = `Instruction: ${params.instruction}

Selected LaTeX code to modify:
${params.selectedText}

${params.surroundingContext ? `Surrounding file context:\n${params.surroundingContext.slice(0, 5000)}` : ''}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Strip accidental markdown fences if returned
  if (text.startsWith('```latex')) {
    text = text.replace(/^```latex\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return text.trim();
}
