import express from 'express';
import cors from 'cors';
import { compileWorkspace, detectEngines, pdfCache } from './compiler.js';
import { CompileRequest } from './types.js';
import { chatWithGemini, inlineEditWithGemini } from './aiService.js';

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

// AI Endpoints
app.get('/api/ai/status', (req, res) => {
  const hasEnvKey = !!process.env.GEMINI_API_KEY;
  res.json({
    configured: hasEnvKey,
    defaultModel: 'gemini-1.5-flash',
    supportedModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, history, documentContext, selectedText, model, apiKey } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const reply = await chatWithGemini({
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
    const { instruction, selectedText, surroundingContext, model, apiKey } = req.body;
    if (!instruction || !selectedText) {
      return res.status(400).json({ error: 'Instruction and selectedText are required' });
    }

    const replacement = await inlineEditWithGemini({
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

app.listen(PORT, () => {
  console.log(`🚀 Latexer Compilation Server running on http://localhost:${PORT}`);
});
