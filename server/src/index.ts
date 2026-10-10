import express from 'express';
import cors from 'cors';
import { compileWorkspace, detectEngines, pdfCache } from './compiler.js';
import { CompileRequest } from './types.js';
import { dispatchAiChat, dispatchAiInlineEdit, dispatchAiAgentStep } from './aiService.js';

// Load .env automatically if present
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // .env file might not exist or already loaded
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Latexer Compilation Engine', timestamp: new Date().toISOString() });
});

app.get('/api/engine-status', async (req, res) => {
  try {
    const status = await detectEngines();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compile', async (req, res) => {
  try {
    const compileReq: CompileRequest = req.body;
    if (!compileReq.files || !Array.isArray(compileReq.files) || compileReq.files.length === 0) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    const result = await compileWorkspace(compileReq);
    res.json(result);
  } catch (err: any) {
    console.error('Compilation error:', err);
    res.status(500).json({ error: err.message || 'Internal compilation failure' });
  }
});

app.get('/api/pdf/:buildId', (req, res) => {
  const { buildId } = req.params;
  const cached = pdfCache.get(buildId);

  if (!cached) {
    return res.status(404).send('PDF build expired or not found.');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${cached.filename}"`);
  res.send(cached.buffer);
});

// AI Endpoints (Groq & Gemini)
app.get('/api/ai/status', (req, res) => {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  res.json({
    configured: hasGroq || hasGemini,
    hasGroq,
    hasGemini,
    defaultModel: hasGroq ? 'openai/gpt-oss-120b' : 'gemini-1.5-flash',
    defaultProvider: hasGroq ? 'groq' : 'gemini',
    supportedModels: [
      { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (Groq • Deep Reasoning & MoE)', provider: 'groq' },
      { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Groq • High-Speed Multimodal & Tools)', provider: 'groq' },
      { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT-OSS 20B (Groq • Fast Lightweight Execution)', provider: 'groq' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Google)', provider: 'gemini' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Google)', provider: 'gemini' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Google)', provider: 'gemini' },
    ],
  });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, history, documentContext, selectedText, model, apiKey, provider } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const reply = await dispatchAiChat({
      provider,
      apiKey,
      model,
      prompt,
      history,
      documentContext,
      selectedText,
    });

    res.json({ reply });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

app.post('/api/ai/inline-edit', async (req, res) => {
  try {
    const { instruction, selectedText, surroundingContext, model, apiKey, provider } = req.body;
    if (!instruction || !selectedText) {
      return res.status(400).json({ error: 'Instruction and selectedText are required' });
    }

    const replacement = await dispatchAiInlineEdit({
      provider,
      apiKey,
      model,
      instruction,
      selectedText,
      surroundingContext,
    });

    res.json({ replacement });
  } catch (err: any) {
    console.error('AI Inline Edit Error:', err);
    res.status(500).json({ error: err.message || 'AI inline edit failed' });
  }
});

app.post('/api/ai/agent-step', async (req, res) => {
  try {
    const { messages, tools, model, apiKey, provider, temperature } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const stepResult = await dispatchAiAgentStep({
      provider,
      apiKey,
      model,
      messages,
      tools: tools || [],
      temperature,
    });

    res.json(stepResult);
  } catch (err: any) {
    console.error('AI Agent Step Error:', err);
    res.status(500).json({ error: err.message || 'Agent step failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Latexer Compilation Server running on http://localhost:${PORT}`);
});
