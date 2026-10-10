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
    <div
      className={`absolute bottom-0 left-[46px] right-0 bg-sidebar border-t border-border-light flex flex-col z-[15] shadow-[-8px_24px_rgba(44,38,30,0.12)] transition-[height] duration-200 ${
        isExpanded ? 'h-[480px]' : 'h-[240px]'
      }`}
    >
      {/* Drawer Header */}
      <div className="h-[38px] flex items-center justify-between px-3 border-b border-border-subtle bg-sidebar">
        <div className="flex gap-1">
          <button
            className={`bg-transparent border-none text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
              logsActiveTab === 'diagnostics'
                ? 'text-text-primary bg-card shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-card/60'
            }`}
            onClick={() => setLogsActiveTab('diagnostics')}
          >
            <ListFilter size={14} />
            <span>Diagnostics</span>
            {errors.length > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600">{errors.length}</span>}
            {warnings.length > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600">{warnings.length}</span>}
          </button>

          <button
            className={`bg-transparent border-none text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
              logsActiveTab === 'raw'
                ? 'text-text-primary bg-card shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-card/60'
            }`}
            onClick={() => setLogsActiveTab('raw')}
          >
            <Terminal size={14} />
            <span>Raw Logs</span>
          </button>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-1">
          {logsActiveTab === 'raw' && (
            <button
              className="bg-transparent border-none text-text-muted hover:text-text-primary hover:bg-card px-2 py-1 text-[11.5px] flex items-center gap-1 rounded cursor-pointer transition-all"
              onClick={handleCopyLogs}
              title="Copy Raw Log"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            className="bg-transparent border-none text-text-muted hover:text-text-primary hover:bg-card px-2 py-1 text-[11.5px] flex items-center gap-1 rounded cursor-pointer transition-all"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            className="bg-transparent border-none text-text-muted hover:text-text-primary hover:bg-card px-2 py-1 text-[11.5px] flex items-center gap-1 rounded cursor-pointer transition-all"
            onClick={() => toggleLogsDrawer(false)}
            title="Close Drawer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-hidden flex">
        {logsActiveTab === 'diagnostics' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* AI Compiler Doctor Banner */}
            {errors.length > 0 && (
              <div className="mx-3.5 my-2.5 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-purple-600/30 rounded-lg p-2.5 px-3.5 flex items-center justify-between gap-3.5 shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/40">
                    <Stethoscope size={16} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-[12.5px] font-semibold text-text-primary">
                      <span>AI Compiler Doctor</span>
                      <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 border border-rose-500/30">
                        {errors.length} {errors.length === 1 ? 'error' : 'errors'} detected
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug m-0">
                      Autonomous agent will inspect your code, fix syntax or packages, and recompile.
                    </p>
                  </div>
                </div>
                <button
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:not-disabled:from-indigo-500 hover:not-disabled:to-purple-500 text-white border border-white/20 px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/35 transition-all hover:not-disabled:-translate-y-0.5 disabled:opacity-65 disabled:cursor-not-allowed"
                  onClick={handleAutoFixAll}
                  disabled={isAgentRunning}
                  title="Run Autonomous Agent to resolve all errors"
                >
                  {isAgentRunning ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
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
            <div className="flex gap-1.5 px-3.5 py-2 border-b border-border-subtle">
              <button
                className={`bg-transparent border border-border-subtle text-[11px] px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                  filterType === 'all'
                    ? 'bg-card text-text-primary border-border-light font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-card/50'
                }`}
                onClick={() => setFilterType('all')}
              >
                All ({allDiagnostics.length})
              </button>
              <button
                className={`bg-transparent border border-border-subtle text-[11px] px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                  filterType === 'errors'
                    ? 'bg-card text-text-primary border-border-light font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-card/50'
                }`}
                onClick={() => setFilterType('errors')}
              >
                Errors ({errors.length})
              </button>
              <button
                className={`bg-transparent border border-border-subtle text-[11px] px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                  filterType === 'warnings'
                    ? 'bg-card text-text-primary border-border-light font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-card/50'
                }`}
                onClick={() => setFilterType('warnings')}
              >
                Warnings ({warnings.length})
              </button>
            </div>

            {/* Diagnostics List */}
            {filteredDiagnostics.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-2 p-6 text-text-secondary">
                <Check size={28} className="text-emerald-600" />
                <p className="text-xs">No compilation errors or warnings found. Document looks clean!</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-3.5 py-2.5 flex flex-col gap-2">
                {filteredDiagnostics.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 bg-card border border-border-subtle hover:border-border-light rounded-md p-2.5 px-3 cursor-pointer transition-all duration-150 hover:translate-x-0.5 ${
                      item.type === 'error'
                        ? 'border-l-[3px] border-l-rose-500'
                        : item.type === 'warning'
                        ? 'border-l-[3px] border-l-amber-500'
                        : 'border-l-[3px] border-l-sky-500'
                    }`}
                    onClick={() => {
                      if (item.line) jumpToLine(item.line, item.file);
                    }}
                  >
                    <div className="pt-0.5">
                      {item.type === 'error' && <AlertOctagon size={16} className="text-rose-500" />}
                      {item.type === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                      {item.type === 'badbox' && <Info size={16} className="text-sky-500" />}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-[9.5px] px-1 py-0.5 rounded bg-black/5 text-text-secondary">
                          {item.type.toUpperCase()}
                        </span>
                        <span className="font-mono text-text-secondary truncate">
                          {item.file || 'main.tex'}
                          {item.line ? ` : Line ${item.line}` : ''}
                        </span>

                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          {item.isError && (
                            <button
                              className="bg-purple-600/10 hover:not-disabled:bg-purple-600/20 border border-purple-600/30 hover:border-purple-600 text-purple-700 hover:text-purple-800 px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
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
                            <span className="flex items-center gap-1 text-sky-600 text-[10.5px]">
                              <ExternalLink size={11} /> Jump to line
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[12.5px] text-text-primary font-mono leading-relaxed break-words">
                        {item.message}
                      </div>

                      {item.snippet && (
                        <div className="bg-card-hover border border-border-subtle px-2 py-1 rounded font-mono text-[11.5px] text-sky-700 mt-0.5 overflow-x-auto">
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
          <div className="flex-1 overflow-y-auto p-3 bg-[#201c18] rounded m-2">
            <pre className="font-mono text-[11.5px] leading-relaxed text-[#e5ded2] whitespace-pre-wrap break-all select-text m-0">
              {rawLog || 'No compilation logs yet.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
