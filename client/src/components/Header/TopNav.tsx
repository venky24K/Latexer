import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import {
  Play,
  Terminal,
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  Columns2,
  Code2,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    projectName,
    setProjectName,
    compilationState,
    compileDuration,
    errors,
    warnings,
    compileNow,
    selectedEngine,
    setSelectedEngine,
    autoCompile,
    setAutoCompile,
    toggleLogsDrawer,
    logsDrawerOpen,
  } = useProjectStore();

  const {
    viewMode,
    setViewMode,
    resetLayout,
  } = useLayoutStore();

  const isCompiling = compilationState === 'compiling';
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <header className="h-12 min-h-[48px] bg-sidebar border-b border-border-subtle flex items-center justify-between px-3.5 z-20 select-none">
      {/* Left: Brand, Sidebar Toggle & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="ElseWhere Logo" className="w-[26px] h-[26px] object-contain" />
          <span className="font-bold text-[15px] tracking-tight text-text-primary">ElseWhere</span>
        </div>

        <div className="flex items-center">
          <input
            type="text"
            className="bg-transparent border border-transparent hover:border-border-subtle hover:bg-card text-text-primary text-[13px] font-medium px-2 py-1 rounded transition-all duration-150 w-[220px] outline-none focus:bg-card focus:border-brand"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            title="Click to rename project"
          />
        </div>
      </div>

      {/* Center: Recompile Button & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-card rounded-md border border-border-subtle p-0.5 shadow-sm">
          <button
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold text-white transition-all duration-150 cursor-pointer ${
              isCompiling
                ? 'bg-brand/70 cursor-not-allowed'
                : hasErrors
                ? 'bg-accent-red hover:bg-accent-red/90'
                : 'bg-brand hover:bg-brand-hover shadow-sm'
            }`}
            onClick={compileNow}
            disabled={isCompiling}
            title="Recompile Project (Cmd+Enter or Ctrl+Enter)"
          >
            {isCompiling ? (
              <>
                <Loader2 className="spin" size={14} />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Play className="fill-current" size={14} />
                <span>Recompile</span>
                <span className="text-[10px] bg-black/20 px-1 py-0.5 rounded font-mono">⌘↵</span>
              </>
            )}
          </button>

          {/* Engine Selector */}
          <div className="flex items-center gap-1 px-2 text-text-muted" title="Select LaTeX Compilation Engine">
            <Cpu size={14} />
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="bg-transparent border-none text-text-secondary text-[11.5px] font-medium outline-none cursor-pointer"
            >
              <option value="auto">Engine: Auto</option>
              <option value="tectonic">Tectonic</option>
              <option value="latexmk">LaTeXmk</option>
              <option value="pdflatex">pdfLaTeX</option>
              <option value="xelatex">XeLaTeX</option>
            </select>
          </div>

          {/* Auto-compile switch */}
          <label className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-text-secondary cursor-pointer hover:bg-card-hover select-none" title="Toggle Auto-compile on save or edit">
            <input
              type="checkbox"
              checked={autoCompile}
              onChange={(e) => setAutoCompile(e.target.checked)}
              className="accent-brand cursor-pointer"
            />
            <span className="text-[11px] font-medium">Auto</span>
          </label>
        </div>

        {/* Status indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-all duration-150 ${
            logsDrawerOpen ? 'ring-1 ring-border-light' : ''
          } ${
            isCompiling
              ? 'bg-card border-border-subtle text-text-secondary'
              : hasErrors
              ? 'bg-accent-red/10 border-accent-red/30 text-accent-red'
              : hasWarnings
              ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
              : compilationState === 'success'
              ? 'bg-brand/10 border-brand/30 text-brand'
              : 'bg-card border-border-subtle text-text-muted hover:text-text-primary'
          }`}
          onClick={() => toggleLogsDrawer()}
          role="button"
          tabIndex={0}
          title="Click to view compilation logs & diagnostics (⌘J)"
        >
          {isCompiling && (
            <>
              <Loader2 size={13} className="spin" />
              <span>Building...</span>
            </>
          )}
          {!isCompiling && compilationState === 'success' && !hasErrors && (
            <>
              <CheckCircle2 size={13} className="text-brand" />
              <span>
                {compileDuration ? `${(compileDuration / 1000).toFixed(2)}s` : 'Compiled'}
              </span>
              {hasWarnings && (
                <span className="text-[10px] bg-accent-amber/20 text-accent-amber px-1 rounded font-bold" title={`${warnings.length} warnings`}>
                  {warnings.length}w
                </span>
              )}
            </>
          )}
          {!isCompiling && hasErrors && (
            <>
              <XCircle size={13} className="text-accent-red" />
              <span className="font-semibold">{errors.length} {errors.length === 1 ? 'Error' : 'Errors'}</span>
            </>
          )}
          {compilationState === 'idle' && (
            <>
              <Terminal size={13} />
              <span>Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Layout Switcher, AI, Templates, Engine & Downloads */}
      <div className="flex items-center gap-2">
        {/* Workspace Layout Mode Segmented Control */}
        <div className="flex items-center bg-card-hover border border-border-subtle rounded p-0.5 gap-0.5" title="Workspace Layout Mode">
          <button
            className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
              viewMode === 'split' ? 'bg-card text-brand shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-[rgba(44,38,30,0.06)]'
            }`}
            onClick={() => setViewMode('split')}
            title="Split View (Editor + PDF)"
          >
            <Columns2 size={13} />
          </button>
          <button
            className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
              viewMode === 'editor-only' ? 'bg-card text-brand shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-[rgba(44,38,30,0.06)]'
            }`}
            onClick={() => setViewMode('editor-only')}
            title="Code Focus (Full-Width Editor)"
          >
            <Code2 size={13} />
          </button>
          <button
            className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
              viewMode === 'preview-only' ? 'bg-card text-brand shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-[rgba(44,38,30,0.06)]'
            }`}
            onClick={() => setViewMode('preview-only')}
            title="Reading Focus (Full-Width PDF)"
          >
            <BookOpen size={13} />
          </button>
          <button
            className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-accent-amber hover:bg-[rgba(44,38,30,0.06)] transition-all duration-150 cursor-pointer"
            onClick={resetLayout}
            title="Reset Panel Proportions to Default (18 / 42 / 40)"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
    </header>
  );
};
