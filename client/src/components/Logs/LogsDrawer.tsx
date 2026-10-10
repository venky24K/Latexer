import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useAgentStore } from '../../store/useAgentStore';
import { formatDoctorFixAllPrompt, formatDoctorFixSinglePrompt } from '../../services/aiDoctor';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  ListFilter,
  Maximize2,
  Minimize2,
  Stethoscope,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const LogsDrawer: React.FC = () => {
  const {
    logsDrawerOpen,
    toggleLogsDrawer,
    logsActiveTab,
    setLogsActiveTab,
    errors,
    warnings,
    rawLog,
    jumpToLine,
  } = useProjectStore();

  const { setActiveSidebarTab } = useLayoutStore();
  const { isRunning: isAgentRunning, startAgentTask } = useAgentStore();

  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'warnings'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!logsDrawerOpen) return null;

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(rawLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFixAll = () => {
    const prompt = formatDoctorFixAllPrompt(errors, rawLog);
    setActiveSidebarTab('ai');
    startAgentTask(prompt);
  };

  const handleAutoFixSingle = (item: any) => {
    const prompt = formatDoctorFixSinglePrompt(item);
    setActiveSidebarTab('ai');
    startAgentTask(prompt);
  };

  const allDiagnostics = [
    ...errors.map((e) => ({ ...e, isError: true })),
    ...warnings.map((w) => ({ ...w, isError: false })),
  ];

  const filteredDiagnostics = allDiagnostics.filter((d) => {
    if (filterType === 'errors') return d.isError;
    if (filterType === 'warnings') return !d.isError;
    return true;
  });

  return (
    <div className={`logs-drawer-container ${isExpanded ? 'expanded' : ''}`}>
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-tabs">
          <button
            className={`drawer-tab ${logsActiveTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setLogsActiveTab('diagnostics')}
          >
            <ListFilter size={14} />
            <span>Diagnostics</span>
            {errors.length > 0 && <span className="tab-badge error">{errors.length}</span>}
            {warnings.length > 0 && <span className="tab-badge warn">{warnings.length}</span>}
          </button>

          <button
            className={`drawer-tab ${logsActiveTab === 'raw' ? 'active' : ''}`}
            onClick={() => setLogsActiveTab('raw')}
          >
            <Terminal size={14} />
            <span>Raw Logs</span>
          </button>
        </div>

        {/* Header Right Controls */}
        <div className="drawer-controls">
          {logsActiveTab === 'raw' && (
            <button className="control-btn" onClick={handleCopyLogs} title="Copy Raw Log">
              {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            className="control-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            className="control-btn close"
            onClick={() => toggleLogsDrawer(false)}
            title="Close Drawer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="drawer-body">
        {logsActiveTab === 'diagnostics' ? (
          <div className="diagnostics-panel">
            {/* AI Compiler Doctor Banner */}
            {errors.length > 0 && (
              <div className="ai-doctor-banner">
                <div className="ai-doctor-banner-main">
                  <div className="ai-doctor-icon-badge">
                    <Stethoscope size={16} />
                  </div>
                  <div className="ai-doctor-text">
                    <div className="ai-doctor-title">
                      <span>AI Compiler Doctor</span>
                      <span className="ai-doctor-count">
                        {errors.length} {errors.length === 1 ? 'error' : 'errors'} detected
                      </span>
                    </div>
                    <p className="ai-doctor-subtitle">
                      Autonomous agent will inspect your code, fix syntax or packages, and recompile.
                    </p>
                  </div>
                </div>
                <button
                  className="btn-ai-doctor-run"
                  onClick={handleAutoFixAll}
                  disabled={isAgentRunning}
                  title="Run Autonomous Agent to resolve all errors"
                >
                  {isAgentRunning ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      <span>Diagnosing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Auto-Fix All Errors</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Filter buttons */}
            <div className="filter-bar">
              <button
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All ({allDiagnostics.length})
              </button>
              <button
                className={`filter-btn ${filterType === 'errors' ? 'active' : ''}`}
                onClick={() => setFilterType('errors')}
              >
                Errors ({errors.length})
              </button>
              <button
                className={`filter-btn ${filterType === 'warnings' ? 'active' : ''}`}
                onClick={() => setFilterType('warnings')}
              >
                Warnings ({warnings.length})
              </button>
            </div>

            {/* Diagnostics List */}
            {filteredDiagnostics.length === 0 ? (
              <div className="empty-diagnostics">
                <Check size={28} className="text-green" />
                <p>No compilation errors or warnings found. Document looks clean!</p>
              </div>
            ) : (
              <div className="diagnostic-items">
                {filteredDiagnostics.map((item, idx) => (
                  <div
                    key={idx}
                    className={`diagnostic-card ${item.type}`}
                    onClick={() => {
                      if (item.line) jumpToLine(item.line, item.file);
                    }}
                  >
                    <div className="diagnostic-icon-col">
                      {item.type === 'error' && (
                        <AlertOctagon size={16} className="diag-icon error" />
                      )}
                      {item.type === 'warning' && (
                        <AlertTriangle size={16} className="diag-icon warning" />
                      )}
                      {item.type === 'badbox' && <Info size={16} className="diag-icon badbox" />}
                    </div>

                    <div className="diagnostic-content">
                      <div className="diagnostic-meta">
                        <span className="diag-type-badge">{item.type.toUpperCase()}</span>
                        <span className="diag-file-loc">
                          {item.file || 'main.tex'}
                          {item.line ? ` : Line ${item.line}` : ''}
                        </span>

                        <div className="diagnostic-actions-right">
                          {item.isError && (
                            <button
                              className="btn-diag-fix-ai"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoFixSingle(item);
                              }}
                              disabled={isAgentRunning}
                              title="Fix this error with AI Doctor"
                            >
                              <Sparkles size={11} />
                              <span>Fix with AI</span>
                            </button>
                          )}
                          {item.line && (
                            <span className="jump-hint">
                              <ExternalLink size={11} /> Jump to line
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="diagnostic-msg">{item.message}</div>

                      {item.snippet && (
                        <div className="diagnostic-snippet">
                          <code>{item.snippet}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Raw Log Console */
          <div className="raw-log-console">
            <pre className="raw-log-text">{rawLog || 'No compilation logs yet.'}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
