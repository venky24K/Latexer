import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAiStore } from '../../store/useAiStore';
import {
  Play,
  Download,
  FileArchive,
  Layers,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
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
    setHostSetupModalOpen,
    engineStatus,
    exportZip,
    downloadPdf,
    pdfUrl,
  } = useProjectStore();

  const { aiSidebarOpen, toggleAiSidebar } = useAiStore();

  const isCompiling = compilationState === 'compiling';
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <header className="top-nav">
      {/* Left: Brand & Project Name */}
      <div className="nav-left">
        <div className="brand-logo">
          <div className="logo-badge">
            <span className="logo-tex">L</span>
          </div>
          <span className="brand-title">Latexer</span>
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
          title="Click to view compilation logs & diagnostics"
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

      {/* Right: Actions, Downloads, Templates & Host Status */}
      <div className="nav-right">
        {/* Gemini AI Copilot Trigger */}
        <button
          className={`nav-btn ai-btn ${aiSidebarOpen ? 'active' : ''}`}
          onClick={() => toggleAiSidebar()}
          title="Toggle Gemini AI Copilot Sidebar"
        >
          <Sparkles size={14} className="text-blue" />
          <span>AI Copilot</span>
        </button>

        {/* Template Gallery Trigger */}
        <button
          className="nav-btn secondary"
          onClick={() => setTemplateModalOpen(true)}
          title="Browse starter LaTeX templates"
        >
          <Layers size={14} />
          <span>Templates</span>
        </button>

        {/* Host TeX Engine Check Indicator */}
        <button
          className={`nav-btn status-btn ${engineStatus?.hasAnyEngine ? 'engine-ok' : 'engine-missing'}`}
          onClick={() => setHostSetupModalOpen(true)}
          title={engineStatus?.hasAnyEngine ? `LaTeX Engine: ${engineStatus.recommendedEngine}` : 'No LaTeX engine found - click for quick install'}
        >
          {engineStatus?.hasAnyEngine ? (
            <>
              <span className="indicator-dot green" />
              <span>{engineStatus.recommendedEngine}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} className="amber-color" />
              <span>Setup TeX</span>
            </>
          )}
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
