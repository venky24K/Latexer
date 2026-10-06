import React, { useState } from 'react';
import { useAiStore, type AiProvider } from '../../store/useAiStore';
import { Sparkles, X, Key, ExternalLink, Check, Eye, EyeOff, Cpu, Zap } from 'lucide-react';

export const AiSettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    provider,
    setProvider,
    groqKey,
    setGroqKey,
    geminiKey,
    setGeminiKey,
    selectedModel,
    setSelectedModel,
    supportedModels,
  } = useAiStore();

  const [activeTab, setActiveTab] = useState<AiProvider>(provider);
  const [inputGroqKey, setInputGroqKey] = useState(groqKey);
  const [inputGeminiKey, setInputGeminiKey] = useState(geminiKey);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!settingsModalOpen) return null;

  const handleSave = () => {
    setGroqKey(inputGroqKey.trim());
    setGeminiKey(inputGeminiKey.trim());
    setProvider(activeTab);

    // If selected model does not belong to the selected provider, switch to provider default
    if (activeTab === 'groq' && selectedModel.startsWith('gemini-')) {
      setSelectedModel('openai/gpt-oss-120b');
    } else if (activeTab === 'gemini' && !selectedModel.startsWith('gemini-')) {
      setSelectedModel('gemini-1.5-flash');
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSettingsModalOpen(false);
    }, 700);
  };

  const providerModels = supportedModels.filter((m) => m.provider === activeTab);

  return (
    <div className="modal-backdrop" onClick={() => setSettingsModalOpen(false)}>
      <div className="modal-window ai-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={18} className="modal-icon text-blue" />
            <h2>AI Copilot Configuration</h2>
          </div>
          <button className="modal-close-btn" onClick={() => setSettingsModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Latexer provides real-time document drafting, publication-grade academic English proofreading,
          and inline <code>⌘K</code> transformations powered by high-speed AI engines.
        </p>

        {/* Provider Switcher Tabs */}
        <div className="ai-provider-tabs">
          <button
            type="button"
            className={`provider-tab ${activeTab === 'groq' ? 'active' : ''}`}
            onClick={() => setActiveTab('groq')}
          >
            <Zap size={14} className="text-amber" />
            <span>Groq LPU (Ultra Fast)</span>
            <span className="provider-pill">Recommended</span>
          </button>

          <button
            type="button"
            className={`provider-tab ${activeTab === 'gemini' ? 'active' : ''}`}
            onClick={() => setActiveTab('gemini')}
          >
            <Sparkles size={14} className="text-blue" />
            <span>Google Gemini</span>
          </button>
        </div>

        {/* Tab 1: Groq Configuration */}
        {activeTab === 'groq' && (
          <div className="provider-settings-section">
            <div className="ai-server-configured-badge">
              <Check size={14} className="text-green" />
              <span>
                Groq LPU provides <strong>~250+ tokens/sec</strong> near-instant inference for academic proofreading, English grammar, and LaTeX editing.
              </span>
            </div>

            {/* Groq API Key Input */}
            <div className="settings-field-group">
              <label className="field-label">
                <Key size={14} />
                <span>Groq API Key</span>
              </label>
              <div className="key-input-wrapper">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  className="key-input"
                  placeholder="gsk_..."
                  value={inputGroqKey}
                  onChange={(e) => setInputGroqKey(e.target.value)}
                />
                <button
                  type="button"
                  className="key-toggle-btn"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  title={showGroqKey ? 'Hide key' : 'Show key'}
                >
                  {showGroqKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="field-helper">
                <span>Manage your keys at</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="helper-link"
                >
                  Groq Console <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Groq Model Selector */}
            <div className="settings-field-group">
              <label className="field-label">
                <Cpu size={14} />
                <span>Select Groq Model</span>
              </label>
              <select
                className="model-select-dropdown"
                value={selectedModel.startsWith('gemini-') ? 'openai/gpt-oss-120b' : selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {providerModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Tab 2: Gemini Configuration */}
        {activeTab === 'gemini' && (
          <div className="provider-settings-section">
            <div className="settings-field-group">
              <label className="field-label">
                <Key size={14} />
                <span>Google Gemini API Key</span>
              </label>
              <div className="key-input-wrapper">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  className="key-input"
                  placeholder="AIzaSy..."
                  value={inputGeminiKey}
                  onChange={(e) => setInputGeminiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="key-toggle-btn"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  title={showGeminiKey ? 'Hide key' : 'Show key'}
                >
                  {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="field-helper">
                <span>Get a free key at</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="helper-link"
                >
                  Google AI Studio <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="settings-field-group">
              <label className="field-label">
                <Cpu size={14} />
                <span>Select Gemini Model</span>
              </label>
              <select
                className="model-select-dropdown"
                value={selectedModel.startsWith('gemini-') ? selectedModel : 'gemini-1.5-flash'}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {providerModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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
