import React, { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { useProjectStore } from '../../store/useProjectStore';
import {
  Sparkles,
  Send,
  Trash2,
  Settings,
  Copy,
  Check,
  CornerDownLeft,
  Loader2,
  Zap,
} from 'lucide-react';

export const AiPanel: React.FC = () => {
  const {
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChat,
    setSettingsModalOpen,
    selectedModel,
    provider,
    insertAtCursor,
  } = useAiStore();

  const { files, activeFilePath } = useProjectStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files[activeFilePath];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSend = () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || isChatLoading) return;

    const docContext = activeFile ? activeFile.content : undefined;
    sendChatMessage(trimmed, docContext);
    setInputPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Prompts
  const quickChips = [
    { label: 'Polish Academic Tone', prompt: 'Polish the academic English tone and grammar of this text.' },
    { label: 'Add Math Equation', prompt: 'Generate an equation environment with explanation.' },
    { label: 'Create Table', prompt: 'Format a professional booktabs table with sample data.' },
    { label: 'Fix LaTeX Errors', prompt: 'Inspect the document and suggest fixes for common LaTeX errors.' },
  ];

  const renderContent = (content: string, messageId: string) => {
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
                type="button"
                className="ai-code-btn"
                onClick={() => handleCopyCode(code, blockId)}
                title="Copy code"
              >
                {isCopied ? <Check size={11} className="text-green" /> : <Copy size={11} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="ai-code-btn primary"
                onClick={() => insertAtCursor(code)}
                title="Insert at Monaco cursor"
              >
                <CornerDownLeft size={11} />
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

  const modelShortName = selectedModel
    ? (selectedModel.includes('/') ? selectedModel.split('/')[1] : selectedModel.replace('gemini-', ''))
    : 'AI';

  return (
    <div className="sidebar-ai-panel">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          {provider === 'groq' ? <Zap size={14} className="text-amber" /> : <Sparkles size={14} className="text-blue" />}
          <span className="sidebar-title">{provider === 'groq' ? 'GROQ COPILOT' : 'GEMINI COPILOT'}</span>
          <span className="sidebar-model-badge" title={selectedModel}>
            {modelShortName}
          </span>
        </div>

        <div className="sidebar-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={clearChat}
            title="Clear Chat History"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettingsModalOpen(true)}
            title="Configure AI Keys & Models"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="ai-panel-quick-chips">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="quick-chip"
            onClick={() => {
              const docContext = activeFile ? activeFile.content : undefined;
              sendChatMessage(chip.prompt, docContext);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="ai-panel-messages">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`ai-message-row ${msg.role}`}>
            <div className="ai-message-bubble">
              <div className="ai-bubble-meta">
                <span className="ai-sender-name">{msg.role === 'user' ? 'You' : provider === 'groq' ? 'Groq LPU' : 'Gemini'}</span>
              </div>
              <div className="ai-bubble-body">{renderContent(msg.content, msg.id)}</div>
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="ai-message-row assistant">
            <div className="ai-message-bubble loading">
              <Loader2 size={13} className="spin text-blue" />
              <span>Generating response with {provider === 'groq' ? 'Groq LPU' : 'Gemini'}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="ai-panel-composer">
        <textarea
          ref={textareaRef}
          className="ai-panel-textarea"
          placeholder="Ask Groq to proofread grammar, generate equations, or format tables..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isChatLoading}
        />

        <div className="ai-panel-composer-footer">
          <span className="ai-context-hint">
            Context: <strong>{activeFilePath}</strong>
          </span>

          <button
            type="button"
            className="ai-panel-send-btn"
            onClick={handleSend}
            disabled={!inputPrompt.trim() || isChatLoading}
            title="Send prompt (Enter)"
          >
            <Send size={13} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
