import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import {
  Play,
  Download,
  FileArchive,
  Layers,
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
    setTemplateModalOpen,
    exportZip,
    downloadPdf,
    pdfUrl,
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
    <header className="top-nav">
      {/* Left: Brand, Sidebar Toggle & Project Name */}
      <div className="nav-left">
        <div className="brand-logo">
          <div className="logo-badge">
            <span className="logo-tex">E</span>
          </div>
          <span className="brand-title">ElseWhere</span>
        </div>


        <div className="project-title-container">
          <input
            type="text"
            className="project-title-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            title="Click to rename project"
          />
        </div>
      </div>

      {/* Center: Recompile Button & Status */}
      <div className="nav-center">
        <div className="compile-control-group">
          <button
            className={`btn-recompile ${isCompiling ? 'loading' : ''} ${hasErrors ? 'has-errors' : ''}`}
            onClick={compileNow}
            disabled={isCompiling}
            title="Recompile Project (Cmd+Enter or Ctrl+Enter)"
          >
            {isCompiling ? (
              <>
                <Loader2 className="btn-icon spin" size={15} />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Play className="btn-icon fill-current" size={15} />
                <span>Recompile</span>
                <span className="btn-shortcut">⌘↵</span>
              </>
            )}
          </button>

          {/* Engine Selector */}
          <div className="engine-select-wrapper" title="Select LaTeX Compilation Engine">
            <Cpu size={14} className="engine-icon" />
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="engine-select"
            >
              <option value="auto">Engine: Auto</option>
              <option value="tectonic">Tectonic</option>
              <option value="latexmk">LaTeXmk</option>
              <option value="pdflatex">pdfLaTeX</option>
              <option value="xelatex">XeLaTeX</option>
            </select>
          </div>

          {/* Auto-compile switch */}
          <label className="toggle-label" title="Toggle Auto-compile on save or edit">
            <input
              type="checkbox"
              checked={autoCompile}
              onChange={(e) => setAutoCompile(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">Auto</span>
          </label>
        </div>

        {/* Status indicator */}
        <div
          className={`status-pill ${compilationState} ${logsDrawerOpen ? 'drawer-active' : ''}`}
          onClick={() => toggleLogsDrawer()}
          role="button"
          tabIndex={0}
          title="Click to view compilation logs & diagnostics (⌘J)"
        >
          {isCompiling && (
            <>
              <Loader2 size={13} className="spin status-icon" />
              <span>Building...</span>
            </>
          )}
          {!isCompiling && compilationState === 'success' && !hasErrors && (
            <>
              <CheckCircle2 size={13} className="status-icon success-color" />
              <span>
                {compileDuration ? `${(compileDuration / 1000).toFixed(2)}s` : 'Compiled'}
              </span>
              {hasWarnings && (
                <span className="warning-badge" title={`${warnings.length} warnings`}>
                  {warnings.length}w
                </span>
              )}
            </>
          )}
          {!isCompiling && hasErrors && (
            <>
              <XCircle size={13} className="status-icon error-color" />
              <span className="error-count-text">{errors.length} {errors.length === 1 ? 'Error' : 'Errors'}</span>
            </>
          )}
          {compilationState === 'idle' && (
            <>
              <Terminal size={13} className="status-icon" />
              <span>Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Layout Switcher, AI, Templates, Engine & Downloads */}
      <div className="nav-right">
        {/* Workspace Layout Mode Segmented Control */}
        <div className="layout-mode-group" title="Workspace Layout Mode">
          <button
            className={`layout-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split View (Editor + PDF)"
          >
            <Columns2 size={13} />
          </button>
          <button
            className={`layout-btn ${viewMode === 'editor-only' ? 'active' : ''}`}
            onClick={() => setViewMode('editor-only')}
            title="Code Focus (Full-Width Editor)"
          >
            <Code2 size={13} />
          </button>
          <button
            className={`layout-btn ${viewMode === 'preview-only' ? 'active' : ''}`}
            onClick={() => setViewMode('preview-only')}
            title="Reading Focus (Full-Width PDF)"
          >
            <BookOpen size={13} />
          </button>
          <button
            className="layout-btn reset"
            onClick={resetLayout}
            title="Reset Panel Proportions to Default (18 / 42 / 40)"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Template Gallery Trigger */}
        <button
          className="nav-btn secondary"
          onClick={() => setTemplateModalOpen(true)}
          title="Browse starter LaTeX templates"
        >
          <Layers size={14} />
          <span>Templates</span>
        </button>

        {/* Download PDF button */}
        <button
          className="nav-btn primary-action"
          onClick={downloadPdf}
          disabled={!pdfUrl}
          title="Download Compiled PDF"
        >
          <Download size={14} />
          <span>PDF</span>
        </button>

        {/* Export ZIP */}
        <button
          className="nav-btn secondary"
          onClick={exportZip}
          title="Download Project as ZIP Archive"
        >
          <FileArchive size={14} />
          <span>ZIP</span>
        </button>
      </div>
    </header>
  );
};
