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
    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-30 flex items-start justify-center pt-16" onClick={closeInlineCommand}>
      <div
        className={`w-[90%] max-w-[540px] bg-sidebar border border-border-light rounded-xl shadow-2xl p-3.5 flex flex-col gap-2.5 animate-scaleUp ${isInlineLoading ? 'ring-1 ring-accent-blue/40' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <Sparkles size={14} className="text-accent-blue" />
            <span>{provider === 'groq' ? 'Groq AI Edit' : 'Gemini AI Edit'}</span>
            <span className="text-[10px] bg-[rgba(44,38,30,0.08)] px-1.5 py-0.5 rounded text-text-secondary font-mono">⌘K</span>
          </div>

          <button className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer transition-colors" onClick={closeInlineCommand}>
            <X size={14} />
          </button>
        </div>

        {hasSelection ? (
          <div className="text-[11px] text-text-muted flex items-center gap-1.5 overflow-hidden">
            <span className="shrink-0">Selected code:</span>
            <code className="text-accent-blue font-mono bg-accent-blue/10 border border-accent-blue/20 px-1 py-0.5 rounded truncate">
              {inlineSelection.selectedText.length > 80
                ? `${inlineSelection.selectedText.slice(0, 80)}...`
                : inlineSelection.selectedText}
            </code>
          </div>
        ) : (
          <div className="text-[11px] text-text-muted">
            <span>Insert at cursor position</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center gap-2 bg-card border border-border-light rounded-md px-3 py-1.5 focus-within:border-accent-blue">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none text-text-primary text-[12.5px] outline-none placeholder:text-text-muted"
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
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
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

        <div className="text-[10.5px] text-text-muted">
          <span>Press <strong className="font-semibold text-text-primary">Enter</strong> to apply • <strong className="font-semibold text-text-primary">Esc</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
};
