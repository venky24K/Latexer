import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { fetchEngineStatus } from '../../services/api';
import {
  X,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const HostSetupModal: React.FC = () => {
  const {
    hostSetupModalOpen,
    setHostSetupModalOpen,
    engineStatus,
    compileNow,
  } = useProjectStore();

  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!hostSetupModalOpen) return null;

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const status = await fetchEngineStatus();
      useProjectStore.setState({ engineStatus: status });
      if (status.hasAnyEngine) {
        compileNow();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const hasEngine = engineStatus?.hasAnyEngine;

  return (
    <div className="modal-backdrop" onClick={() => setHostSetupModalOpen(false)}>
      <div className="modal-window host-setup-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Cpu size={18} className="modal-icon text-blue" />
            <h2>Host LaTeX Engine Status</h2>
          </div>
          <button className="modal-close-btn" onClick={() => setHostSetupModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Current Detection Status */}
        <div className={`status-banner ${hasEngine ? 'success' : 'warning'}`}>
          {hasEngine ? (
            <>
              <CheckCircle2 size={18} className="status-banner-icon green" />
              <div>
                <strong>LaTeX Engine Active: {engineStatus.recommendedEngine}</strong>
                <p>Native compilation is enabled and running directly on your local system.</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={18} className="status-banner-icon amber" />
              <div>
                <strong>No Local LaTeX Compiler Found</strong>
                <p>To compile raw LaTeX documents into PDF locally, install an engine below.</p>
              </div>
            </>
          )}
        </div>

        {/* Available Engines Grid */}
        <div className="engines-status-list">
          <div className="engine-status-row">
            <span className="engine-name">Tectonic (Modern Rust/TeX)</span>
            <span className={`engine-badge ${engineStatus?.availableEngines.tectonic ? 'found' : 'missing'}`}>
              {engineStatus?.availableEngines.tectonic ? 'Installed' : 'Not found'}
            </span>
          </div>
          <div className="engine-status-row">
            <span className="engine-name">latexmk</span>
            <span className={`engine-badge ${engineStatus?.availableEngines.latexmk ? 'found' : 'missing'}`}>
              {engineStatus?.availableEngines.latexmk ? 'Installed' : 'Not found'}
            </span>
          </div>
          <div className="engine-status-row">
            <span className="engine-name">pdflatex (TeXLive/MacTeX)</span>
            <span className={`engine-badge ${engineStatus?.availableEngines.pdflatex ? 'found' : 'missing'}`}>
              {engineStatus?.availableEngines.pdflatex ? 'Installed' : 'Not found'}
            </span>
          </div>
          <div className="engine-status-row">
            <span className="engine-name">xelatex</span>
            <span className={`engine-badge ${engineStatus?.availableEngines.xelatex ? 'found' : 'missing'}`}>
              {engineStatus?.availableEngines.xelatex ? 'Installed' : 'Not found'}
            </span>
          </div>
        </div>

        {/* Recommended Setup Box */}
        <div className="quick-install-box">
          <div className="install-box-header">
            <Sparkles size={15} className="text-amber" />
            <span>Recommended: Install Tectonic (Fastest & Zero Configuration)</span>
          </div>
          <p className="install-box-desc">
            Tectonic is a modern, single-binary LaTeX engine. It downloads LaTeX packages automatically on the fly, eliminating the need for a 5GB MacTeX download.
          </p>

          <div className="command-terminal-block">
            <Terminal size={14} className="cmd-icon" />
            <code>brew install tectonic</code>
            <button
              className="copy-cmd-btn"
              onClick={() => copyCommand('brew install tectonic')}
              title="Copy to clipboard"
            >
              {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions-footer">
          <button
            className="btn-recheck"
            onClick={handleRecheck}
            disabled={checking}
          >
            <RefreshCw size={14} className={checking ? 'spin' : ''} />
            <span>{checking ? 'Checking System...' : 'Re-check Engines'}</span>
          </button>
          <button
            className="btn-modal-done"
            onClick={() => setHostSetupModalOpen(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
