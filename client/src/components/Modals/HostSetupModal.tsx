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
    <div className="fixed inset-0 bg-[rgba(44,38,30,0.45)] backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setHostSetupModalOpen(false)}>
      <div className="bg-sidebar border border-border-light rounded-xl shadow-2xl w-[90%] max-w-[620px] max-h-[85vh] flex flex-col p-6 gap-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-accent-blue" />
            <h2 className="text-[17px] font-bold text-text-primary">Host LaTeX Engine Status</h2>
          </div>
          <button className="text-text-muted hover:text-text-primary p-1 rounded cursor-pointer transition-colors" onClick={() => setHostSetupModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Current Detection Status */}
        <div className={`flex items-start gap-3 p-3.5 rounded-lg text-[12.5px] leading-relaxed ${hasEngine ? 'bg-brand/12 border border-brand/30 text-brand' : 'bg-accent-amber/10 border border-accent-amber/30 text-accent-amber'}`}>
          {hasEngine ? (
            <>
              <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">LaTeX Engine Active: {engineStatus.recommendedEngine}</strong>
                <p className="text-xs text-text-secondary mt-0.5">Native compilation is enabled and running directly on your local system.</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={18} className="text-accent-amber shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">No Local LaTeX Compiler Found</strong>
                <p className="text-xs text-text-secondary mt-0.5">To compile raw LaTeX documents into PDF locally, install an engine below.</p>
              </div>
            </>
          )}
        </div>

        {/* Available Engines Grid */}
        <div className="flex flex-col gap-1.5 bg-card p-3.5 rounded-lg border border-border-subtle">
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-medium text-text-primary">Tectonic (Modern Rust/TeX)</span>
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${engineStatus?.availableEngines.tectonic ? 'bg-brand/15 text-brand' : 'bg-[rgba(44,38,30,0.08)] text-text-muted'}`}>
              {engineStatus?.availableEngines.tectonic ? 'Installed' : 'Not found'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-medium text-text-primary">latexmk</span>
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${engineStatus?.availableEngines.latexmk ? 'bg-brand/15 text-brand' : 'bg-[rgba(44,38,30,0.08)] text-text-muted'}`}>
              {engineStatus?.availableEngines.latexmk ? 'Installed' : 'Not found'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-medium text-text-primary">pdflatex (TeXLive/MacTeX)</span>
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${engineStatus?.availableEngines.pdflatex ? 'bg-brand/15 text-brand' : 'bg-[rgba(44,38,30,0.08)] text-text-muted'}`}>
              {engineStatus?.availableEngines.pdflatex ? 'Installed' : 'Not found'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-medium text-text-primary">xelatex</span>
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${engineStatus?.availableEngines.xelatex ? 'bg-brand/15 text-brand' : 'bg-[rgba(44,38,30,0.08)] text-text-muted'}`}>
              {engineStatus?.availableEngines.xelatex ? 'Installed' : 'Not found'}
            </span>
          </div>
        </div>

        {/* Recommended Setup Box */}
        <div className="bg-card border border-border-subtle rounded-lg p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold text-[13px] text-text-primary">
            <Sparkles size={15} className="text-accent-amber" />
            <span>Recommended: Install Tectonic (Fastest & Zero Configuration)</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Tectonic is a modern, single-binary LaTeX engine. It downloads LaTeX packages automatically on the fly, eliminating the need for a 5GB MacTeX download.
          </p>

          <div className="flex items-center justify-between bg-card-hover border border-border-subtle rounded px-3 py-2 mt-1">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-text-muted" />
              <code className="font-mono text-xs text-accent-blue font-semibold">brew install tectonic</code>
            </div>
            <button
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-[rgba(44,38,30,0.08)] cursor-pointer transition-all"
              onClick={() => copyCommand('brew install tectonic')}
              title="Copy to clipboard"
            >
              {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle mt-1">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border-subtle bg-card hover:bg-card-hover text-text-secondary hover:text-text-primary cursor-pointer transition-all disabled:opacity-50"
            onClick={handleRecheck}
            disabled={checking}
          >
            <RefreshCw size={14} className={checking ? 'spin' : ''} />
            <span>{checking ? 'Checking System...' : 'Re-check Engines'}</span>
          </button>
          <button
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm cursor-pointer transition-all"
            onClick={() => setHostSetupModalOpen(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
