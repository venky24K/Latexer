import React, { useEffect, useRef } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Sparkles, X, Loader2, CornerDownLeft } from 'lucide-react';

export const InlineCommandPalette: React.FC = () => {
  const {
    inlineOpen,
    inlineInstruction,
    setInlineInstruction,
    closeInlineCommand,
    executeInlineEdit,
    isInlineLoading,
    inlineSelection,
    provider,
    setSettingsModalOpen,
  } = useAiStore();

  const { files, activeFilePath } = useProjectStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFile = files[activeFilePath];
  const isKeyConfigured = true;

  useEffect(() => {
    if (inlineOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inlineOpen]);

  if (!inlineOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineInstruction.trim() || isInlineLoading) return;

    if (!isKeyConfigured) {
      setSettingsModalOpen(true);
      return;
    }

    executeInlineEdit(activeFile ? activeFile.content : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeInlineCommand();
    }
  };

  const hasSelection = inlineSelection && inlineSelection.selectedText.trim().length > 0;

  return (
    <div className="inline-palette-overlay" onClick={closeInlineCommand}>
      <div
        className={`inline-palette-card ${isInlineLoading ? 'generating' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="inline-palette-header">
          <div className="inline-badge">
            <Sparkles size={14} className="text-blue" />
            <span>{provider === 'groq' ? 'Groq AI Edit' : 'Gemini AI Edit'}</span>
            <span className="kbd-shortcut">⌘K</span>
          </div>

          <button className="inline-close-btn" onClick={closeInlineCommand}>
            <X size={14} />
          </button>
        </div>

        {hasSelection ? (
          <div className="inline-context-snippet">
            <span className="context-label">Selected code:</span>
            <code>
              {inlineSelection.selectedText.length > 80
                ? `${inlineSelection.selectedText.slice(0, 80)}...`
                : inlineSelection.selectedText}
            </code>
          </div>
        ) : (
          <div className="inline-context-snippet">
            <span className="context-label">Insert at cursor position</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="inline-form">
          <div className="inline-input-row">
            <input
              ref={inputRef}
              type="text"
              className="inline-palette-input"
              placeholder={
                hasSelection
                  ? 'e.g. "Rephrase formally", "Make this a booktabs table", "Add inline math"...'
                  : 'e.g. "Insert a 3x3 matrix equation", "Create a modern author bio"...'
              }
              value={inlineInstruction}
              onChange={(e) => setInlineInstruction(e.target.value)}
              disabled={isInlineLoading}
            />

            <button
              type="submit"
              className="inline-submit-btn"
              disabled={!inlineInstruction.trim() || isInlineLoading}
            >
              {isInlineLoading ? (
                <>
                  <Loader2 size={13} className="spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Apply</span>
                  <CornerDownLeft size={13} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="inline-palette-footer">
          <span>Press <strong>Enter</strong> to apply • <strong>Esc</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
};
