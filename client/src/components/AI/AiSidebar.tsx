import React, { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { useProjectStore } from '../../store/useProjectStore';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Settings,
  Copy,
  Check,
  CornerDownLeft,
  FileCode2,
  Table,
  Sigma,
  Pencil,
  Loader2,
  FileText,
} from 'lucide-react';

export const AiSidebar: React.FC = () => {
  const {
    aiSidebarOpen,
    toggleAiSidebar,
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChat,
    setSettingsModalOpen,
    selectedModel,
    insertAtCursor,
    provider,
    serverConfigured,
  } = useAiStore();

  const { files, activeFilePath } = useProjectStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [includeDocContext, setIncludeDocContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files[activeFilePath];
  const isKeyConfigured = serverConfigured;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  if (!aiSidebarOpen) return null;

  const handleSend = () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || isChatLoading) return;

    const docContext = includeDocContext && activeFile ? activeFile.content : undefined;
    sendChatMessage(trimmed, docContext);
    setInputPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    const docContext = includeDocContext && activeFile ? activeFile.content : undefined;
    sendChatMessage(prompt, docContext);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse message content and render interactive code blocks
  const renderMessageContent = (content: string, messageId: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="ai-text-block">
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      const lang = match[1] || 'latex';
      const code = match[2];
      const blockId = `${messageId}-code-${blockIndex++}`;
      const isCopied = copiedId === blockId;

      parts.push(
        <div key={blockId} className="ai-code-card">
          <div className="ai-code-header">
            <span className="ai-code-lang">{lang.toUpperCase()}</span>
            <div className="ai-code-actions">
              <button
                className="ai-code-btn"
                onClick={() => handleCopyCode(code, blockId)}
                title="Copy code"
              >
                {isCopied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                className="ai-code-btn primary"
                onClick={() => insertAtCursor(code)}
                title="Insert directly into active LaTeX document"
              >
                <CornerDownLeft size={12} />
                <span>Insert</span>
              </button>
            </div>
          </div>
          <pre className="ai-code-pre">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="ai-text-block">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <aside className="ai-sidebar-container">
      {/* Sidebar Header */}
      <div className="ai-sidebar-header">
        <div className="ai-header-title">
          <div className="ai-spark-icon">
            <Sparkles size={15} />
          </div>
          <span className="ai-title-text">{provider === 'groq' ? 'Groq Copilot' : 'Gemini Copilot'}</span>
          <span className="ai-model-pill" title={`Active Model: ${selectedModel}`}>
            {selectedModel.includes('/') ? selectedModel.split('/')[1] : selectedModel.replace('gemini-', '')}
          </span>
        </div>

        <div className="ai-header-actions">
          <button
            className="ai-icon-btn"
            onClick={() => setSettingsModalOpen(true)}
            title="AI Settings & API Key"
          >
            <Settings size={14} />
          </button>
          <button
            className="ai-icon-btn"
            onClick={clearChat}
            title="Clear Chat History"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="ai-icon-btn"
            onClick={() => toggleAiSidebar(false)}
            title="Close AI Copilot"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* API Key missing banner */}
      {!isKeyConfigured && (
        <div className="ai-warning-banner" onClick={() => setSettingsModalOpen(true)}>
          <Sparkles size={14} />
          <span>Click here to enter your free Gemini API key to activate AI features.</span>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="ai-quick-prompts">
        <button
          className="quick-chip"
          onClick={() => handleQuickAction('Please proofread and polish the academic tone of this document.')}
        >
          <Pencil size={11} />
          <span>Polish Tone</span>
        </button>
        <button
          className="quick-chip"
          onClick={() => handleQuickAction('Generate a professional LaTeX table using the booktabs package for experimental results.')}
        >
          <Table size={11} />
          <span>Table</span>
        </button>
        <button
          className="quick-chip"
          onClick={() => handleQuickAction('Generate a numbered LaTeX display equation with a 3x3 matrix and determinant.')}
        >
          <Sigma size={11} />
          <span>Math Equation</span>
        </button>
        <button
          className="quick-chip"
          onClick={() => handleQuickAction('Create a clean TikZ diagram showing a modern deep learning or software architecture pipeline.')}
        >
          <FileCode2 size={11} />
          <span>TikZ Graphic</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="ai-messages-list">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`ai-message-row ${msg.role}`}>
            <div className="ai-message-bubble">
              <div className="ai-bubble-meta">
                <span className="ai-sender-name">
                  {msg.role === 'user' ? 'You' : 'Gemini'}
                </span>
                <span className="ai-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="ai-bubble-body">
                {renderMessageContent(msg.content, msg.id)}
              </div>
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="ai-message-row assistant">
            <div className="ai-message-bubble loading">
              <Loader2 size={16} className="spin text-blue" />
              <span>Gemini is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="ai-input-container">
        {/* Context Attachment Switch */}
        <div className="ai-context-indicator">
          <label className="context-toggle-label">
            <input
              type="checkbox"
              checked={includeDocContext}
              onChange={(e) => setIncludeDocContext(e.target.checked)}
              className="toggle-checkbox"
            />
            <FileText size={12} className="text-muted" />
            <span className="context-text">
              Context: {activeFilePath} ({includeDocContext ? 'Attached' : 'Ignored'})
            </span>
          </label>
        </div>

        <div className="ai-input-wrapper">
          <textarea
            ref={textareaRef}
            rows={2}
            className="ai-textarea"
            placeholder="Ask Gemini to draft, polish, or generate LaTeX... (Enter to send)"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="ai-send-btn"
            onClick={handleSend}
            disabled={!inputPrompt.trim() || isChatLoading}
            title="Send prompt"
          >
            {isChatLoading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
