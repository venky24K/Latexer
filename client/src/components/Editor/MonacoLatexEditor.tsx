import { useEffect, useRef, useState } from 'react';
import Editor, { DiffEditor, type Monaco, type OnMount } from '@monaco-editor/react';
import { setupMonacoLatex } from './latexLanguage';
import { useProjectStore } from '../../store/useProjectStore';
import { useAiStore } from '../../store/useAiStore';
import { useAgentStore } from '../../store/useAgentStore';
import { sendAiInlineCompletionRequest } from '../../services/aiApi';
import { InlineCommandPalette } from '../AI/InlineCommandPalette';
import { useSettingsStore } from '../../store/useSettingsStore';
import { FileText, Image as ImageIcon, X, FileCode, BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export const MonacoLatexEditor: React.FC = () => {
  const {
    files,
    activeFilePath,
    openTabs,
    setActiveFile,
    closeTab,
    closeOtherTabs,
    updateFileContent,
    errors,
    warnings,
    compileNow,
    autoCompile,
    registerJumpToLine,
  } = useProjectStore();

  const {
    openInlineCommand,
    registerEditorActions,
  } = useAiStore();

  const {
    fontSize,
    fontFamily,
    lineHeight,
    wordWrap,
    lineNumbers,
    bracketPairColorization,
    editorTheme,
  } = useSettingsStore();

  const editorRef = useRef<any>(null);
  const diffEditorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const autoCompileTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inlineProviderRef = useRef<any>(null);

  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabPath: string } | null>(null);

  const handleTabContextMenu = (e: React.MouseEvent, tabPath: string) => {
    e.preventDefault();
    setTabContextMenu({ x: e.clientX, y: e.clientY, tabPath });
  };

  useEffect(() => {
    const handleClose = () => setTabContextMenu(null);
    if (tabContextMenu) {
      window.addEventListener('click', handleClose);
      return () => window.removeEventListener('click', handleClose);
    }
  }, [tabContextMenu]);

  const pendingEdits = useAgentStore((state) => state.pendingEdits);
  const acceptEdit = useAgentStore((state) => state.acceptEdit);
  const rejectEdit = useAgentStore((state) => state.rejectEdit);

  const pendingEdit = pendingEdits[activeFilePath];
  const editedFilePaths = Object.keys(pendingEdits);
  const currentEditIndex = editedFilePaths.indexOf(activeFilePath);

  const handleAcceptCurrent = () => {
    acceptEdit(activeFilePath);
    const remaining = editedFilePaths.filter((p) => p !== activeFilePath);
    if (remaining.length > 0) {
      setActiveFile(remaining[0]);
    }
  };

  const handleRejectCurrent = () => {
    rejectEdit(activeFilePath);
    const remaining = editedFilePaths.filter((p) => p !== activeFilePath);
    if (remaining.length > 0) {
      setActiveFile(remaining[0]);
    }
  };

  const handlePrevEditedFile = () => {
    if (editedFilePaths.length <= 1) return;
    const prevIdx = (currentEditIndex - 1 + editedFilePaths.length) % editedFilePaths.length;
    setActiveFile(editedFilePaths[prevIdx]);
  };

  const handleNextEditedFile = () => {
    if (editedFilePaths.length <= 1) return;
    const nextIdx = (currentEditIndex + 1) % editedFilePaths.length;
    setActiveFile(editedFilePaths[nextIdx]);
  };

  // Keyboard shortcuts for accepting/rejecting diff in editor
  useEffect(() => {
    if (!pendingEdit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAcceptCurrent();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        handleRejectCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingEdit, activeFilePath, editedFilePaths]);

  const activeFile = files[activeFilePath];

  // Auto-compilation debounce
  const handleContentChange = (value: string | undefined) => {
    if (value === undefined || !activeFile || activeFile.isBinary) return;
    updateFileContent(activeFilePath, value);

    if (autoCompile) {
      if (autoCompileTimerRef.current) {
        clearTimeout(autoCompileTimerRef.current);
      }
      autoCompileTimerRef.current = setTimeout(() => {
        compileNow();
      }, 1500);
    }
  };

  // Dispose inline provider on component unmount
  useEffect(() => {
    return () => {
      if (inlineProviderRef.current) {
        inlineProviderRef.current.dispose();
        inlineProviderRef.current = null;
      }
    };
  }, []);

  // Setup Monaco on mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure LaTeX language, Monarch syntax highlighter and theme
    setupMonacoLatex(monaco);

    // Register LaTeX snippets & autocompletions
    monaco.languages.registerCompletionItemProvider('latex', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: '\\begin{equation}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{equation}\n\t$0\n\\end{equation}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Numbered mathematical display equation',
            range,
          },
          {
            label: '\\begin{figure}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\linewidth]{$1}\n\t\\caption{$2}\n\t\\label{fig:$3}\n\\end{figure}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Centered figure with caption and label',
            range,
          },
          {
            label: '\\begin{table}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{table}[h!]\n\t\\centering\n\t\\caption{$1}\n\t\\label{tab:$2}\n\t\\begin{tabular}{${3:lcc}}\n\t\t\\toprule\n\t\t$4 \\\\\n\t\t\\midrule\n\t\t$0 \\\\\n\t\t\\bottomrule\n\t\\end{tabular}\n\\end{table}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Professional table environment',
            range,
          },
          {
            label: '\\begin{itemize}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{itemize}\n\t\\item $0\n\\end{itemize}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Unordered bulleted list',
            range,
          },
          {
            label: '\\begin{enumerate}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{enumerate}\n\t\\item $0\n\\end{enumerate}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Numbered list environment',
            range,
          },
          {
            label: '\\frac{}{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\frac{$1}{$2}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Fraction',
            range,
          },
          {
            label: '\\section{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\section{$1}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Major section heading',
            range,
          },
          {
            label: '\\subsection{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\subsection{$1}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Subsection heading',
            range,
          },
          {
            label: '\\textbf{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\textbf{$1}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Bold font formatting',
            range,
          },
          {
            label: '\\textit{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\textit{$1}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Italic font formatting',
            range,
          },
          {
            label: '\\cite{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\cite{$1}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Bibliographic citation',
            range,
          },
          {
            label: '\\ref{}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\ref{$1}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Cross-reference label',
            range,
          },
        ];

        return { suggestions };
      },
    });

    // Keybinding: Cmd+Enter / Ctrl+Enter -> Recompile
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      compileNow();
    });

    // Keybinding: Cmd+S / Ctrl+S -> Save / Recompile
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      compileNow();
    });

    // Keybinding: Cmd+K / Ctrl+K -> Gemini Inline Command Palette
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      let selectedText = '';
      if (selection && model) {
        selectedText = model.getValueInRange(selection);
      }
      openInlineCommand(selectedText, selection);
    });

    // Keybinding: Option+\ / Alt+\ -> Trigger Copilot Inline Autocompletion
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Backslash, () => {
      editor.trigger('copilot', 'editor.action.inlineSuggest.trigger', {});
    });

    // Register Monaco Inline Completions Provider (Copilot Ghost Text)
    if (inlineProviderRef.current) {
      inlineProviderRef.current.dispose();
      inlineProviderRef.current = null;
    }

    inlineProviderRef.current = monaco.languages.registerInlineCompletionsProvider('latex', {
      provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
        if (!useAiStore.getState().ghostTextEnabled) {
          return { items: [] };
        }

        const fullText = model.getValue();
        const offset = model.getOffsetAt(position);

        const prefix = fullText.slice(Math.max(0, offset - 1500), offset);
        const suffix = fullText.slice(offset, Math.min(fullText.length, offset + 800));

        if (!prefix.trim()) {
          return { items: [] };
        }

        // Debounce 250ms
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (token.isCancellationRequested) {
          return { items: [] };
        }

        try {
          useAiStore.getState().setGhostTextLoading(true);
          const { provider, groqKey, geminiKey, selectedModel } = useAiStore.getState();
          const apiKey = provider === 'gemini' ? geminiKey : groqKey;

          const completion = await sendAiInlineCompletionRequest({
            prefix,
            suffix,
            provider,
            apiKey,
            model: selectedModel,
          });

          if (token.isCancellationRequested || !completion || !completion.trim()) {
            return { items: [] };
          }

          return {
            items: [
              {
                insertText: completion,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                ),
              },
            ],
          };
        } catch (err) {
          return { items: [] };
        } finally {
          useAiStore.getState().setGhostTextLoading(false);
        }
      },
      freeInlineCompletions: () => {},
    });

    // Register editor actions for AI insertions
    registerEditorActions(
      (text: string) => {
        const selection = editor.getSelection();
        if (selection) {
          editor.executeEdits('ai-copilot', [
            {
              range: selection,
              text,
              forceMoveMarkers: true,
            },
          ]);
          editor.focus();
        }
      },
      (replacement: string, range?: any) => {
        const targetRange = range || editor.getSelection();
        if (targetRange) {
          editor.executeEdits('ai-inline-edit', [
            {
              range: targetRange,
              text: replacement,
              forceMoveMarkers: true,
            },
          ]);
          editor.focus();
        }
      }
    );

    // Register jump to line action
    registerJumpToLine((line: number) => {
      if (editor) {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
      }
    });
  };

  // Sync Diagnostics / Error markers with Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: any[] = [];

    // Filter diagnostics that match the current open file
    const fileErrors = errors.filter((e) => !e.file || e.file === activeFilePath || e.file.endsWith(activeFilePath));
    const fileWarnings = warnings.filter((w) => !w.file || w.file === activeFilePath || w.file.endsWith(activeFilePath));

    fileErrors.forEach((err) => {
      const line = err.line && err.line > 0 && err.line <= model.getLineCount() ? err.line : 1;
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: err.message + (err.snippet ? `\n> ${err.snippet}` : ''),
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: model.getLineMaxColumn(line),
      });
    });

    fileWarnings.forEach((warn) => {
      const line = warn.line && warn.line > 0 && warn.line <= model.getLineCount() ? warn.line : 1;
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: warn.message,
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: model.getLineMaxColumn(line),
      });
    });

    monaco.editor.setModelMarkers(model, 'latexer-diagnostics', markers);
  }, [errors, warnings, activeFilePath]);

  // Tab keyboard shortcuts (⌘W to close tab, ⌘1-⌘9 to switch tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      // ⌘W / Ctrl+W -> Close active tab
      if (e.key.toLowerCase() === 'w' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        closeTab(activeFilePath);
      }

      // ⌘1 - ⌘9 -> Switch to tab index
      if (!e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (openTabs[idx]) {
          e.preventDefault();
          setActiveFile(openTabs[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeTab, activeFilePath, openTabs, setActiveFile]);

  if (!activeFile) {
    return (
      <div className="editor-empty-state">
        <FileText size={48} className="empty-icon" />
        <p>No file selected</p>
      </div>
    );
  }

  const getTabIcon = (path: string) => {
    if (/\.(png|jpe?g|gif|webp|svg|eps)$/i.test(path) || files[path]?.isBinary) {
      return <ImageIcon size={12} className="tab-icon text-green" />;
    }
    if (path.endsWith('.tex')) {
      return <FileText size={12} className="tab-icon text-blue" />;
    }
    if (path.endsWith('.bib')) {
      return <BookOpen size={12} className="tab-icon text-amber" />;
    }
    if (path.endsWith('.cls') || path.endsWith('.sty')) {
      return <FileCode size={12} className="tab-icon" />;
    }
    return <FileText size={12} className="tab-icon" />;
  };

  const language = activeFilePath.endsWith('.bib') ? 'latex' : activeFilePath.endsWith('.json') ? 'json' : 'latex';

  return (
    <div className="relative flex-1 flex flex-col h-full bg-editor overflow-hidden">
      {/* Multi-File Tab Bar */}
      <div className="h-[38px] bg-app border-b border-border-subtle flex items-end justify-between px-2 select-none z-[4] shrink-0">
        <div className="flex items-end gap-1 overflow-x-auto overflow-y-hidden flex-1 min-w-0 h-full" role="tablist">
          {openTabs.map((tabPath) => {
            const isActive = tabPath === activeFilePath;
            const isPending = Boolean(pendingEdits[tabPath]);
            return (
              <div
                key={tabPath}
                role="tab"
                aria-selected={isActive}
                className={`group relative flex items-center gap-1.5 px-3 h-[31px] rounded-t-md text-xs font-medium cursor-pointer transition-all border border-b-0 select-none shrink-0 ${
                  isActive
                    ? 'bg-editor text-text-primary border-border-subtle font-semibold shadow-xs z-[2] -mb-px'
                    : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-card/70 border-transparent'
                } ${isPending ? 'border-b-2 border-b-amber-500!' : ''}`}
                onClick={() => setActiveFile(tabPath)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    closeTab(tabPath);
                  }
                }}
                onContextMenu={(e) => handleTabContextMenu(e, tabPath)}
                title={isPending ? `${tabPath} (Pending AI changes)` : tabPath}
              >
                {/* Active tab top indicator accent */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand rounded-t-md" />
                )}

                <div className="flex items-center gap-1.5 min-w-0">
                  {getTabIcon(tabPath)}
                  <span className={`truncate max-w-[140px] ${isActive ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                    {tabPath}
                  </span>
                </div>

                {isPending && (
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-500/15 px-1 py-0.5 rounded ml-0.5" title="Pending changes to review">
                    M
                  </span>
                )}

                {/* Visible Close Button */}
                <button
                  type="button"
                  className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all cursor-pointer border-0 bg-transparent ml-1 ${
                    isActive
                      ? 'text-text-secondary hover:text-text-primary hover:bg-black/10 opacity-70 hover:opacity-100'
                      : 'text-text-muted hover:text-text-primary hover:bg-black/10 opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabPath);
                  }}
                  title="Close tab (⌘W)"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Context Menu */}
      {tabContextMenu && (
        <div
          className="fixed z-50 bg-card border border-border-light shadow-xl rounded-md py-1 min-w-[150px] text-xs backdrop-blur-md"
          style={{ top: tabContextMenu.y, left: tabContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-card-hover flex items-center justify-between text-text-primary cursor-pointer border-0 bg-transparent"
            onClick={() => {
              closeTab(tabContextMenu.tabPath);
              setTabContextMenu(null);
            }}
          >
            <span>Close</span>
            <span className="text-[10px] text-text-muted font-mono">⌘W</span>
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-card-hover text-text-primary cursor-pointer border-0 bg-transparent"
            onClick={() => {
              closeOtherTabs(tabContextMenu.tabPath);
              setTabContextMenu(null);
            }}
          >
            Close Others
          </button>
          {openTabs.indexOf(tabContextMenu.tabPath) < openTabs.length - 1 && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-card-hover text-text-primary cursor-pointer border-0 bg-transparent"
              onClick={() => {
                const idx = openTabs.indexOf(tabContextMenu.tabPath);
                openTabs.slice(idx + 1).forEach((t) => closeTab(t));
                setTabContextMenu(null);
              }}
            >
              Close to the Right
            </button>
          )}
        </div>
      )}

      {/* Editor Canvas or Binary Image Preview or Diff Editor or Empty state */}
      {!activeFile ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-editor text-center select-none">
          <div className="w-12 h-12 rounded-xl bg-app border border-border-subtle flex items-center justify-center text-text-muted mb-3 shadow-xs">
            <FileText size={22} />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">No File Open</h3>
          <p className="text-xs text-text-muted mb-4 max-w-xs">
            Open a file from the Project Explorer or reopen the root document.
          </p>
          <button
            type="button"
            className="bg-brand hover:bg-brand-hover text-white text-xs px-3.5 py-1.5 rounded font-medium cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
            onClick={() => setActiveFile('main.tex')}
          >
            <FileText size={13} />
            <span>Open main.tex</span>
          </button>
        </div>
      ) : activeFile?.isBinary ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-editor">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary mb-4">
            <ImageIcon size={14} className="text-emerald-600" />
            <span>{activeFile.path} (Image Preview)</span>
          </div>
          <div className="max-w-full max-h-[80%] flex items-center justify-center bg-white p-4 rounded border border-border-subtle shadow-md">
            <img
              src={`data:image/png;base64,${activeFile.content}`}
              alt={activeFile.path}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      ) : pendingEdit ? (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <DiffEditor
            height="100%"
            language={language}
            theme={editorTheme}
            beforeMount={setupMonacoLatex}
            original={pendingEdit.originalContent}
            modified={pendingEdit.newContent}
            onMount={(diffEditor) => {
              diffEditorRef.current = diffEditor;

              try {
                diffEditor.updateOptions({
                  renderSideBySide: false,
                  compactMode: true,
                  hideOriginalLineNumbers: true,
                } as any);

                // Disable line numbers and margin on original (hidden) sub-editor completely
                const orig = diffEditor.getOriginalEditor();
                orig.updateOptions({
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                });

                // Configure modified editor with compact line numbers
                const mod = diffEditor.getModifiedEditor();
                mod.updateOptions({
                  lineNumbers: 'on',
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 4,
                });
              } catch (e) {
                console.error('Error configuring diff editor options:', e);
              }

              const modifiedEditor = diffEditor.getModifiedEditor();
              modifiedEditor.onDidChangeModelContent(() => {
                const val = modifiedEditor.getValue();
                updateFileContent(activeFilePath, val);
              });
            }}
            options={{
              renderSideBySide: false, // Unified inline diff view like Cursor/Windsurf
              hideOriginalLineNumbers: true,
              compactMode: true,
              readOnly: false,
              originalEditable: false,
              fontSize,
              fontWeight: '400',
              fontFamily,
              fontLigatures: true,
              lineHeight,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 4,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: wordWrap ? 'on' : 'off',
              automaticLayout: true,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              diffWordWrap: 'on',
              mouseWheelZoom: true,
            } as any}
          />

          {/* Floating Action Toolbar Overlay */}
          <div className="absolute top-3 right-6 z-20 flex items-center gap-1.5 bg-card/95 backdrop-blur-md border border-border-light px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/15">
            <button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              onClick={handleAcceptCurrent}
              title="Accept Changes (⌘Enter)"
            >
              <Check size={12} />
              <span>Accept Changes</span>
              <span className="opacity-70 text-[10px] ml-0.5 font-mono">⌘⏎</span>
            </button>

            <button
              type="button"
              className="bg-rose-600 hover:bg-rose-500 text-white border-0 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              onClick={handleRejectCurrent}
              title="Reject Changes (⌘Backspace)"
            >
              <X size={12} />
              <span>Reject</span>
              <span className="opacity-70 text-[10px] ml-0.5 font-mono">⌘⌫</span>
            </button>

            <div className="w-px h-4 bg-border-light mx-1" />

            <button
              type="button"
              className="bg-transparent hover:bg-card-hover border border-border-subtle text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all"
              onClick={() => {
                if (diffEditorRef.current?.goToDiff) {
                  diffEditorRef.current.goToDiff('previous');
                }
              }}
              title="Previous change"
            >
              <span>↑K</span>
            </button>

            <button
              type="button"
              className="bg-transparent hover:bg-card-hover border border-border-subtle text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all"
              onClick={() => {
                if (diffEditorRef.current?.goToDiff) {
                  diffEditorRef.current.goToDiff('next');
                }
              }}
              title="Next change"
            >
              <span>↓J</span>
            </button>

            {editedFilePaths.length > 1 && (
              <>
                <div className="w-px h-4 bg-border-light mx-1" />
                <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                  <button
                    type="button"
                    className="bg-transparent hover:bg-card-hover text-text-secondary hover:text-text-primary p-0.5 rounded cursor-pointer border-0 transition-all"
                    onClick={handlePrevEditedFile}
                    title="Previous edited file"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="font-mono px-1">
                    Edited files {currentEditIndex + 1}/{editedFilePaths.length}
                  </span>
                  <button
                    type="button"
                    className="bg-transparent hover:bg-card-hover text-text-secondary hover:text-text-primary p-0.5 rounded cursor-pointer border-0 transition-all"
                    onClick={handleNextEditedFile}
                    title="Next edited file"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <InlineCommandPalette />
          <Editor
            height="100%"
            language={language}
            theme={editorTheme}
            beforeMount={setupMonacoLatex}
            value={activeFile?.content || ''}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize,
              fontWeight: '400',
              fontFamily,
              fontLigatures: true,
              lineHeight,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: wordWrap ? 'on' : 'off',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              bracketPairColorization: { enabled: bracketPairColorization },
              lineNumbers,
              lineNumbersMinChars: 3,
              glyphMargin: false,
              lineDecorationsWidth: 4,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              mouseWheelZoom: true,
              inlineSuggest: {
                enabled: true,
                mode: 'subwordSmart',
                showToolbar: 'onHover',
                suppressSuggestions: false,
              },
            }}
          />
        </div>
      )}
    </div>
  );
};
