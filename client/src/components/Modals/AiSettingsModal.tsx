import React, { useState } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { Sparkles, X, Key, ExternalLink, Check, Eye, EyeOff, Cpu } from 'lucide-react';

export const AiSettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    serverConfigured,
  } = useAiStore();

  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!settingsModalOpen) return null;

  const handleSave = () => {
    setApiKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSettingsModalOpen(false);
    }, 800);
  };

  return (
    <div className="modal-backdrop" onClick={() => setSettingsModalOpen(false)}>
      <div className="modal-window ai-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={18} className="modal-icon text-blue" />
            <h2>Google Gemini AI Configuration</h2>
          </div>
          <button className="modal-close-btn" onClick={() => setSettingsModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Latexer connects directly to Google Gemini models for real-time document drafting,
          academic proofreading, table/math generation, and inline <code>⌘K</code> editing.
        </p>

        {serverConfigured && (
          <div className="ai-server-configured-badge">
            <Check size={14} className="text-green" />
            <span>Server environment key is active (<code>GEMINI_API_KEY</code>). You can also override it with your personal key below.</span>
          </div>
        )}

        {/* API Key Input */}
        <div className="settings-field-group">
          <label className="field-label">
            <Key size={14} />
            <span>Gemini API Key</span>
          </label>
          <div className="key-input-wrapper">
            <input
              type={showKey ? 'text' : 'password'}
              className="key-input"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
            <button
              type="button"
              className="key-toggle-btn"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="field-helper">
            <span>Don't have a key?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="helper-link"
            >
              Get a free API key at Google AI Studio <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Model Selector */}
        <div className="settings-field-group">
          <label className="field-label">
            <Cpu size={14} />
            <span>Select Model</span>
          </label>
          <select
            className="model-select-dropdown"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended: Ultra fast & high quota)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-gen speed & reasoning)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep analytical reasoning for research)</option>
          </select>
        </div>

        {/* Footer */}
        <div className="modal-actions-footer">
          <button className="btn-recheck" onClick={() => setSettingsModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-modal-done" onClick={handleSave}>
            {saved ? (
              <>
                <Check size={14} />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
