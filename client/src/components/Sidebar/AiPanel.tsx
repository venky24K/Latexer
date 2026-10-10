import React, { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useAgentStore, type AgentToolCallLog, type PendingEdit } from '../../store/useAgentStore';
import {
  Send,
  Trash2,
  Settings,
  Copy,
  Check,
  CornerDownLeft,
  Loader2,
  Bot,
  AlertCircle,
  Play,
  Square,
  ChevronRight,
  GitBranch,
  X,
} from 'lucide-react';

/** Helper to provide color-coded file extension badges */
const getFileBadge = (path: string) => {
  const ext = (path.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'tex':
      return { label: 'TEX', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    case 'bib':
      return { label: 'BIB', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' };
    case 'ts':
      return { label: 'TS', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' };
    case 'tsx':
      return { label: 'TSX', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' };
    case 'js':
    case 'jsx':
      return { label: 'JS', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)' };
    case 'json':
      return { label: 'JSON', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' };
    case 'md':
      return { label: 'MD', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    case 'css':
      return { label: 'CSS', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    default:
      return { label: (ext || 'FILE').toUpperCase().slice(0, 4), color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
};

/** Summary card for edited files in chat panel */
const EditedFileSummary: React.FC<{
  tc: AgentToolCallLog;
  onSelectFile: (path: string) => void;
}> = ({ tc, onSelectFile }) => {
  const path = tc.args.path || tc.diff?.path || 'unknown';
  const badge = getFileBadge(path);
  const fileName = path.split('/').pop() || path;
  const added = tc.diff?.addedLines ?? 1;
  const removed = tc.diff?.removedLines ?? 1;

  return (
    <div
      className="chat-summary-row edited-file-row"
      onClick={() => onSelectFile(path)}
      title={`Click to review diff for ${path} in editor`}
    >
      <div className="summary-left">
        <span className="summary-action-tag">Edited</span>
        <span
          className="ai-file-ext-badge"
          style={{ color: badge.color, backgroundColor: badge.bg }}
        >
          {badge.label}
        </span>
        <span className="summary-filename">{fileName}</span>
      </div>
      <div className="summary-right">
        <span className="summary-diff-counts">
          <span className="diff-plus">+{added}</span>
          <span className="diff-minus">-{removed}</span>
        </span>
      </div>
    </div>
  );
};

/** Compact collapsible row for read/list/search tools */
const ExploredToolSummary: React.FC<{
  tc: AgentToolCallLog;
  onSelectFile: (path: string) => void;
}> = ({ tc, onSelectFile }) => {
  const [expanded, setExpanded] = useState(false);
  const targetPath = tc.args.path as string | undefined;
  const fileName = targetPath ? targetPath.split('/').pop() || targetPath : null;

  const label =
    tc.name === 'search_files'
      ? `Searched "${tc.args.query || ''}"`
      : fileName
      ? `Explored ${fileName}`
      : 'Explored files';

  return (
    <div className="chat-summary-row explored-row">
      <button
        type="button"
        className="summary-toggle-btn"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="summary-left">
          <span className="summary-action-tag">Explored</span>
          <span className="summary-filename">{label.replace('Explored ', '')}</span>
        </div>
        <ChevronRight size={12} className={`summary-arrow ${expanded ? 'rotated' : ''}`} />
      </button>

      {expanded && (
        <div className="summary-details">
          {tc.resultMessage && <div className="summary-details-msg">{tc.resultMessage}</div>}
          {targetPath && (
            <button
              type="button"
              className="summary-open-file-link"
              onClick={() => onSelectFile(targetPath)}
            >
              Open {targetPath} in editor
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/** Compact collapsible row for compiler/diagnostic tools */
const RanToolSummary: React.FC<{ tc: AgentToolCallLog }> = ({ tc }) => {
  const [expanded, setExpanded] = useState(false);
  const isCompile = tc.name === 'compile_and_diagnose';

  return (
    <div className={`chat-summary-row ran-row ${tc.status}`}>
      <button
        type="button"
        className="summary-toggle-btn"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="summary-left">
          <span className="summary-action-tag">Ran</span>
          <span className="summary-command-badge">
            {isCompile ? `compile (${tc.args.engine || 'tectonic'})` : tc.name}
          </span>
          {tc.status === 'running' && <Loader2 size={11} className="spin text-amber" />}
        </div>
        <ChevronRight size={12} className={`summary-arrow ${expanded ? 'rotated' : ''}`} />
      </button>

      {expanded && tc.resultMessage && (
        <div className="summary-details">
          <div className="summary-details-msg">{tc.resultMessage}</div>
        </div>
      )}
    </div>
  );
};

/** Staged Edited Files container on top of Chat Composer */
const EditedFilesBox: React.FC<{
  pendingEdits: Record<string, PendingEdit>;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onAcceptFile: (path: string) => void;
  onRejectFile: (path: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}> = ({
  pendingEdits,
  activeFilePath,
  onSelectFile,
  onAcceptFile,
  onRejectFile,
  onAcceptAll,
  onRejectAll,
}) => {
  const editsList = Object.values(pendingEdits);
  if (editsList.length === 0) return null;

  return (
    <div className="ai-edited-files-box">
      <div className="ai-edited-files-list">
        {editsList.map((edit) => {
          const isActive = activeFilePath === edit.path;
          const badge = getFileBadge(edit.path);
          const fileName = edit.path.split('/').pop() || edit.path;

          return (
            <div
              key={edit.path}
              className={`ai-edited-file-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFile(edit.path)}
              title={`Click to review diff for ${edit.path}`}
            >
              <div className="ai-edited-file-left">
                <span
                  className="ai-file-ext-badge"
                  style={{ color: badge.color, backgroundColor: badge.bg }}
                >
                  {badge.label}
                </span>
                <span className="ai-diff-stats">
                  <span className="diff-plus">+{edit.addedLines}</span>
                  <span className="diff-minus">-{edit.removedLines}</span>
                </span>
                <span className="ai-edited-file-name">{fileName}</span>
                <span className="ai-edited-file-path">{edit.path}</span>
              </div>

              <div className="ai-edited-file-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="ai-file-action-btn accept"
                  onClick={() => onAcceptFile(edit.path)}
                  title="Accept changes for this file"
                >
                  <Check size={11} />
                </button>
                <button
                  type="button"
                  className="ai-file-action-btn reject"
                  onClick={() => onRejectFile(edit.path)}
                  title="Reject changes for this file"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ai-edited-files-footer">
        <div className="ai-edited-files-count">
          <GitBranch size={13} className="text-muted" />
          <span>
            {editsList.length} {editsList.length === 1 ? 'File' : 'Files'} With Changes
          </span>
        </div>

        <div className="ai-edited-files-global-actions">
          <button
            type="button"
            className="btn-reject-all"
            onClick={onRejectAll}
            title="Reject all pending changes"
          >
            Reject all
          </button>
          <button
            type="button"
            className="btn-accept-all"
            onClick={onAcceptAll}
            title="Accept all pending changes"
          >
            <Check size={12} />
            <span>Accept all</span>
          </button>
        </div>
      </div>
    </div>
  );
};

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
    pendingEdits,
    startAgentTask,
    stopAgent,
    clearAgentLogs,
    acceptEdit,
    rejectEdit,
    acceptAllEdits,
    rejectAllEdits,
  } = useAgentStore();

  const { files, activeFilePath, setActiveFile } = useProjectStore();

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

            {/* Agent Steps & Response: Compact summaries instead of raw diff blocks */}
            {agentLogs.map((step) => {
              const responseText = step.completedSummary;
              return (
                <div key={step.stepIndex} className="agent-step-container">
                  {/* Tool Invocations: Rendered as clean summary rows matching the AI IDE style */}
                  {step.toolCalls && step.toolCalls.map((tc) => {
                    if (tc.name === 'edit_file' || tc.name === 'write_file') {
                      return (
                        <EditedFileSummary
                          key={tc.id}
                          tc={tc}
                          onSelectFile={(p) => setActiveFile(p)}
                        />
                      );
                    }
                    if (tc.name === 'read_file' || tc.name === 'list_files' || tc.name === 'search_files') {
                      return (
                        <ExploredToolSummary
                          key={tc.id}
                          tc={tc}
                          onSelectFile={(p) => setActiveFile(p)}
                        />
                      );
                    }
                    return (
                      <RanToolSummary
                        key={tc.id}
                        tc={tc}
                      />
                    );
                  })}

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

          {/* Staged Edited Files bar right on top of Chat Composer */}
          <EditedFilesBox
            pendingEdits={pendingEdits}
            activeFilePath={activeFilePath}
            onSelectFile={(p) => setActiveFile(p)}
            onAcceptFile={acceptEdit}
            onRejectFile={rejectEdit}
            onAcceptAll={acceptAllEdits}
            onRejectAll={rejectAllEdits}
          />

          {/* Agent Goal Input Composer */}
          <div className="ai-panel-composer">
            <textarea
              className="ai-panel-textarea"
              placeholder="Ask anything, @ to mention, / for actions..."
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

          {/* Staged Edited Files bar on top of Chat Composer */}
          <EditedFilesBox
            pendingEdits={pendingEdits}
            activeFilePath={activeFilePath}
            onSelectFile={(p) => setActiveFile(p)}
            onAcceptFile={acceptEdit}
            onRejectFile={rejectEdit}
            onAcceptAll={acceptAllEdits}
            onRejectAll={rejectAllEdits}
          />

          {/* Chat Input Composer */}
          <div className="ai-panel-composer">
            <textarea
              ref={textareaRef}
              className="ai-panel-textarea"
              placeholder="Ask anything, @ to mention, / for actions..."
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
