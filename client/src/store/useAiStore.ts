import { create } from 'zustand';
import { type ChatMessage, fetchAiStatus, sendAiChatRequest, sendAiInlineEditRequest } from '../services/aiApi';

interface AiState {
  apiKey: string;
  selectedModel: string;
  serverConfigured: boolean;
  aiSidebarOpen: boolean;
  settingsModalOpen: boolean;
  
  // Chat
  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  // Inline Command (Cmd+K)
  inlineOpen: boolean;
  inlineInstruction: string;
  isInlineLoading: boolean;
  inlineSelection: {
    selectedText: string;
    range: any;
  } | null;

  // Editor insertion hook
  insertAtCursorFn: ((text: string) => void) | null;
  replaceSelectionFn: ((replacement: string, range?: any) => void) | null;

  // Actions
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  toggleAiSidebar: (open?: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  sendChatMessage: (prompt: string, documentContext?: string, selectedText?: string) => Promise<void>;
  clearChat: () => void;
  openInlineCommand: (selectedText: string, range: any) => void;
  closeInlineCommand: () => void;
  setInlineInstruction: (text: string) => void;
  executeInlineEdit: (documentContext?: string) => Promise<void>;
  registerEditorActions: (
    insertAtCursor: (text: string) => void,
    replaceSelection: (replacement: string, range?: any) => void
  ) => void;
  insertAtCursor: (text: string) => void;
  initAi: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'latexer_gemini_api_key';
const LOCAL_MODEL_KEY = 'latexer_gemini_model';

export const useAiStore = create<AiState>((set, get) => ({
  apiKey: typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) || '' : '',
  selectedModel: typeof window !== 'undefined' ? localStorage.getItem(LOCAL_MODEL_KEY) || 'gemini-1.5-flash' : 'gemini-1.5-flash',
  serverConfigured: false,
  aiSidebarOpen: true,
  settingsModalOpen: false,

  chatMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **Latexer AI Copilot** powered by Google Gemini. 
I can help you:
- 📝 **Polish and rewrite** sections in formal academic tone
- 📐 **Generate equations** (matrices, integrals, systems)
- 📊 **Create complex tables** with \`booktabs\`
- 🎨 **Draft TikZ vector graphics** and diagrams
- 🔍 **Fix compilation errors** and explain LaTeX syntax

How can I assist your document today?`,
      timestamp: Date.now(),
    },
  ],
  isChatLoading: false,

  inlineOpen: false,
  inlineInstruction: '',
  isInlineLoading: false,
  inlineSelection: null,

  insertAtCursorFn: null,
  replaceSelectionFn: null,

  setApiKey: (key: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
    set({ apiKey: key });
  },

  setSelectedModel: (model: string) => {
    localStorage.setItem(LOCAL_MODEL_KEY, model);
    set({ selectedModel: model });
  },

  toggleAiSidebar: (open) => {
    set((state) => ({ aiSidebarOpen: open !== undefined ? open : !state.aiSidebarOpen }));
  },

  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),

  sendChatMessage: async (prompt, documentContext, selectedText) => {
    const { apiKey, selectedModel, chatMessages } = get();

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    set({
      chatMessages: [...chatMessages, userMessage],
      isChatLoading: true,
    });

    try {
      // Build conversation history for multi-turn chat
      const history = chatMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.content }],
        }));

      const replyText = await sendAiChatRequest({
        prompt,
        history,
        documentContext,
        selectedText,
        model: selectedModel,
        apiKey: apiKey || undefined,
      });

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: replyText,
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMessage],
        isChatLoading: false,
      }));
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `⚠️ **AI Error**: ${err.message || 'Unable to communicate with Gemini.'}\n\nPlease verify your API key in **AI Settings** (gear icon).`,
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, errorMessage],
        isChatLoading: false,
      }));
    }
  },

  clearChat: () => {
    set({
      chatMessages: [
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: 'Chat history cleared. How can I help you with your LaTeX document?',
          timestamp: Date.now(),
        },
      ],
    });
  },

  openInlineCommand: (selectedText, range) => {
    set({
      inlineOpen: true,
      inlineInstruction: '',
      inlineSelection: { selectedText, range },
      isInlineLoading: false,
    });
  },

  closeInlineCommand: () => {
    set({
      inlineOpen: false,
      inlineInstruction: '',
      inlineSelection: null,
      isInlineLoading: false,
    });
  },

  setInlineInstruction: (text) => set({ inlineInstruction: text }),

  executeInlineEdit: async (documentContext) => {
    const { inlineInstruction, inlineSelection, apiKey, selectedModel, replaceSelectionFn } = get();
    if (!inlineInstruction.trim() || !inlineSelection) return;

    set({ isInlineLoading: true });

    try {
      const replacement = await sendAiInlineEditRequest({
        instruction: inlineInstruction,
        selectedText: inlineSelection.selectedText,
        surroundingContext: documentContext,
        model: selectedModel,
        apiKey: apiKey || undefined,
      });

      if (replaceSelectionFn && replacement) {
        replaceSelectionFn(replacement, inlineSelection.range);
      }

      set({
        inlineOpen: false,
        inlineInstruction: '',
        inlineSelection: null,
        isInlineLoading: false,
      });
    } catch (err: any) {
      alert(`AI Inline Edit failed: ${err.message}`);
      set({ isInlineLoading: false });
    }
  },

  registerEditorActions: (insertAtCursor, replaceSelection) => {
    set({
      insertAtCursorFn: insertAtCursor,
      replaceSelectionFn: replaceSelection,
    });
  },

  insertAtCursor: (text) => {
    const fn = get().insertAtCursorFn;
    if (fn) {
      fn(text);
    }
  },

  initAi: async () => {
    try {
      const status = await fetchAiStatus();
      set({ serverConfigured: status.configured });
    } catch (err) {
      console.warn('AI status check failed:', err);
    }
  },
}));
