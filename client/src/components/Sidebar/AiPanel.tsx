import React, { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useAgentStore } from '../../store/useAgentStore';
import {
  Send,
  Trash2,
  Settings,
  Copy,
  Check,
  CornerDownLeft,
  Loader2,
  Bot,
  Hammer,
  FileEdit,
  FileText,
  Files,
  Search,
  PlusSquare,
  AlertCircle,
  Play,
  Square,
} from 'lucide-react';

export const AiPanel: React.FC = () => {
  // Mode: 'agent' | 'chat'
  const [activeMode, setActiveMode] = useState<'agent' | 'chat'>('agent');

  // Copilot Chat store
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

  // Agent Store
  const {
    isRunning: isAgentRunning,
    currentGoal,
    currentStep,
    maxSteps,
    logs: agentLogs,
    error: agentError,
    startAgentTask,
    stopAgent,
    clearAgentLogs,
  } = useAgentStore();

  const { files, activeFilePath } = useProjectStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [agentGoalInput, setAgentGoalInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const agentEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files[activeFilePath];

  useEffect(() => {
    if (activeMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      agentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, agentLogs, isAgentRunning, activeMode]);

  // Copilot Chat Handlers
  const handleChatSend = () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || isChatLoading) return;

    const docContext = activeFile ? activeFile.content : undefined;
    sendChatMessage(trimmed, docContext);
    setInputPrompt('');
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // Agent Handlers
  const handleAgentStart = (goalOverride?: string) => {
    const goal = (goalOverride || agentGoalInput).trim();
    if (!goal || isAgentRunning) return;

    startAgentTask(goal);
    if (!goalOverride) {
      setAgentGoalInput('');
    }
  };

  const handleAgentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgentStart();
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Prompts for Chat
  const quickChips = [
    { label: 'Polish Academic Tone', prompt: 'Polish the academic English tone and grammar of this text.' },
    { label: 'Add Math Equation', prompt: 'Generate an equation environment with explanation.' },
    { label: 'Create Table', prompt: 'Format a professional booktabs table with sample data.' },
    { label: 'Fix LaTeX Errors', prompt: 'Inspect the document and suggest fixes for common LaTeX errors.' },
  ];

  // Preset Goals for Agent
  const agentPresets = [
    { label: '🔨 Fix All Compiler Errors', goal: 'Inspect compiler diagnostic errors in the project, edit the offending files to fix syntax, and verify that the project compiles with zero errors.' },
    { label: '📊 Convert Tables to Booktabs', goal: 'Find all tabular environments in main.tex and convert them to clean publication-grade booktabs tables with toprule, midrule, and bottomrule. Compile to verify.' },
    { label: '📚 Add References & Citations', goal: 'Create or update references.bib with relevant bibtex citations for this paper topic, cite them in the introduction, and compile.' },
    { label: '📐 Add Mathematical Proof Appendix', goal: 'Create a new appendix section with an align mathematical proof environment, reference it in main.tex, and compile cleanly.' },
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

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'compile_and_diagnose':
        return <Hammer size={12} className="text-amber" />;
      case 'edit_file':
        return <FileEdit size={12} className="text-blue" />;
      case 'write_file':
        return <PlusSquare size={12} className="text-green" />;
      case 'read_file':
        return <FileText size={12} className="text-muted" />;
      case 'list_files':
        return <Files size={12} className="text-muted" />;
      case 'search_files':
        return <Search size={12} className="text-blue" />;
      default:
        return <Bot size={12} />;
    }
  };

  const modelShortName = selectedModel
    ? (selectedModel.includes('/') ? selectedModel.split('/')[1] : selectedModel.replace('gemini-', ''))
    : 'AI';

  return (
    <div className="sidebar-ai-panel">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <span className="sidebar-title">{modelShortName}</span>
        </div>

        <div className="sidebar-actions">
          {activeMode === 'chat' ? (
            <button
              type="button"
              className="icon-btn"
              onClick={clearChat}
              title="Clear Chat History"
            >
              <Trash2 size={13} />
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn"
              onClick={clearAgentLogs}
              title="Clear Agent Run History"
            >
              <Trash2 size={13} />
            </button>
          )}

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

      {/* Mode Switcher: Agent Mode vs Copilot Chat */}
      <div className="ai-panel-mode-switcher">
        <button
          type="button"
          className={`ai-mode-btn agent ${activeMode === 'agent' ? 'active' : ''}`}
          onClick={() => setActiveMode('agent')}
        >
          <span>Agent Mode</span>
        </button>
        <button
          type="button"
          className={`ai-mode-btn ${activeMode === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveMode('chat')}
        >
          <span>Copilot Chat</span>
        </button>
      </div>

      {/* ================= AGENT MODE VIEW ================= */}
      {activeMode === 'agent' && (
        <>
          <div className="agent-feed">
            {/* Initial Welcome & Preset Tasks */}
            {agentLogs.length === 0 && !isAgentRunning && (
              <div className="agent-welcome-card">
                <div className="agent-welcome-title">
                  <Bot size={16} className="text-amber" />
                  <span>ElseWhere Autonomous Agent</span>
                </div>
                <div className="agent-welcome-desc">
                  The agent plans multi-step tasks, surgically edits workspace files, runs compilation tests, and repairs LaTeX errors automatically.
                </div>

                <div className="agent-presets-title">Quick Agent Goals</div>
                <div className="agent-preset-grid">
                  {agentPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="agent-preset-chip"
                      onClick={() => handleAgentStart(preset.goal)}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Message in a box */}
            {currentGoal && (
              <div className="agent-user-box">
                {currentGoal}
              </div>
            )}

            {/* Agent Steps & Response without any subheading or title */}
            {agentLogs.map((step) => {
              const responseText = step.completedSummary;
              return (
                <div key={step.stepIndex} className="agent-step-container">
                  {/* Tool Invocations */}
                  {step.toolCalls && step.toolCalls.map((tc) => (
                    <div key={tc.id} className={`agent-tool-call ${tc.status}`}>
                      <div className="agent-tool-title-row">
                        <div className="agent-tool-name">
                          {getToolIcon(tc.name)}
                          <span>{tc.name}</span>
                          {tc.args.path && <span className="text-muted">({tc.args.path})</span>}
                          {tc.args.query && <span className="text-muted">("{tc.args.query}")</span>}
                        </div>
                        <span className={`agent-tool-badge ${tc.status}`}>
                          {tc.status === 'running' ? 'Executing...' : tc.status}
                        </span>
                      </div>

                      {tc.resultMessage && (
                        <div className="agent-tool-msg">{tc.resultMessage}</div>
                      )}

                      {/* Diff Preview */}
                      {tc.diff && (
                        <div className="agent-diff-card">
                          <div className="agent-diff-header">
                            Changes in {tc.diff.path}
                          </div>
                          <div className="agent-diff-body">
                            <div className="diff-target">- {tc.diff.target}</div>
                            <div className="diff-replacement">+ {tc.diff.replacement}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Clean Agent Response without any subheading or title */}
                  {responseText && (
                    <div className="agent-response-box">
                      {renderContent(responseText, `agent-step-${step.stepIndex}`)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Error Message */}
            {agentError && (
              <div className="ai-warning-banner">
                <AlertCircle size={14} className="text-red" />
                <span>{agentError}</span>
              </div>
            )}

            <div ref={agentEndRef} />
          </div>

          {/* Running Status Footer */}
          {isAgentRunning && (
            <div className="agent-running-footer">
              <div className="agent-running-status">
                <Loader2 size={13} className="spin text-amber" />
                <span>Agent running (Step {currentStep}/{maxSteps})...</span>
              </div>
              <button
                type="button"
                className="btn-stop-agent"
                onClick={stopAgent}
              >
                <Square size={11} className="inline mr-1" />
                Stop
              </button>
            </div>
          )}

          {/* Agent Goal Input Composer */}
          <div className="ai-panel-composer">
            <textarea
              className="ai-panel-textarea"
              placeholder="Give the agent a task (e.g. create a new section, add citations, fix errors)..."
              value={agentGoalInput}
              onChange={(e) => setAgentGoalInput(e.target.value)}
              onKeyDown={handleAgentKeyDown}
              rows={2}
              disabled={isAgentRunning}
            />

            <div className="ai-panel-composer-footer">
              <span className="ai-context-hint">
                {modelShortName}
              </span>

              {isAgentRunning ? (
                <button
                  type="button"
                  className="btn-stop-agent"
                  onClick={stopAgent}
                >
                  <Square size={12} />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="ai-panel-send-btn"
                  onClick={() => handleAgentStart()}
                  disabled={!agentGoalInput.trim()}
                  title="Run Autonomous Agent (Enter)"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Run Agent</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= COPILOT CHAT VIEW ================= */}
      {activeMode === 'chat' && (
        <>
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
                    <span className="ai-sender-name">
                      {msg.role === 'user' ? 'You' : provider === 'groq' ? 'Groq LPU' : 'Gemini'}
                    </span>
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

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Composer */}
          <div className="ai-panel-composer">
            <textarea
              ref={textareaRef}
              className="ai-panel-textarea"
              placeholder="Ask Groq to proofread grammar, generate equations, or format tables..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleChatKeyDown}
              rows={2}
              disabled={isChatLoading}
            />

            <div className="ai-panel-composer-footer">
              <span className="ai-context-hint">
                {modelShortName}
              </span>

              <button
                type="button"
                className="ai-panel-send-btn"
                onClick={handleChatSend}
                disabled={!inputPrompt.trim() || isChatLoading}
                title="Send prompt (Enter)"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
