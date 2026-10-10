import { useEffect, useRef } from 'react';
import Editor, { DiffEditor, type Monaco, type OnMount } from '@monaco-editor/react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAiStore } from '../../store/useAiStore';
import { useAgentStore } from '../../store/useAgentStore';
import { InlineCommandPalette } from '../AI/InlineCommandPalette';
import { FileText, Image as ImageIcon, Sparkles, X, FileCode, BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export const MonacoLatexEditor: React.FC = () => {
  const {
    files,
    activeFilePath,
    openTabs,
    setActiveFile,
    closeTab,
    updateFileContent,
    errors,
    warnings,
    compileNow,
    autoCompile,
    registerJumpToLine,
  } = useProjectStore();

  const { openInlineCommand, registerEditorActions } = useAiStore();

  const editorRef = useRef<any>(null);
  const diffEditorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const autoCompileTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Setup Monaco on mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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
    <div className="editor-container">
      {/* Multi-File Tab Pills Bar */}
      <div className="editor-tab-bar">
        <div className="editor-tabs-scroll" role="tablist">
          {openTabs.map((tabPath) => {
            const isActive = tabPath === activeFilePath;
            const isPending = Boolean(pendingEdits[tabPath]);
            return (
              <div
                key={tabPath}
                role="tab"
                aria-selected={isActive}
                className={`editor-tab-pill ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                onClick={() => setActiveFile(tabPath)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    closeTab(tabPath);
                  }
                }}
                title={isPending ? `${tabPath} (Pending AI changes)` : tabPath}
              >
                {getTabIcon(tabPath)}
                <span className="tab-label">{tabPath}</span>
                {isPending && (
                  <span className="tab-pending-badge" title="Pending changes to review">
                    M
                  </span>
                )}
                {openTabs.length > 1 && (
                  <button
                    type="button"
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tabPath);
                    }}
                    title="Close tab (⌘W)"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="editor-actions-hint">
          <button
            type="button"
            className="ai-hint-badge"
            onClick={() => openInlineCommand('', null)}
            title="Open AI Inline Command Palette (Cmd+K)"
          >
            <Sparkles size={11} className="text-blue" />
            <span>⌘K AI Edit</span>
          </button>
          <span className="compile-hint-badge">⌘↵ compile</span>
        </div>
      </div>

      {/* Editor Canvas or Binary Image Preview or Diff Editor */}
      {activeFile?.isBinary ? (
        <div className="binary-preview-container">
          <div className="binary-header">
            <ImageIcon size={14} className="text-green" />
            <span>{activeFile.path} (Image Preview)</span>
          </div>
          <div className="binary-body">
            <img
              src={`data:image/png;base64,${activeFile.content}`}
              alt={activeFile.path}
              className="binary-image"
            />
          </div>
        </div>
      ) : pendingEdit ? (
        <div className="diff-editor-container">
          <DiffEditor
            height="100%"
            language={language}
            theme="vs-dark"
            original={pendingEdit.originalContent}
            modified={pendingEdit.newContent}
            onMount={(diffEditor) => {
              diffEditorRef.current = diffEditor;
              const modifiedEditor = diffEditor.getModifiedEditor();
              modifiedEditor.onDidChangeModelContent(() => {
                const val = modifiedEditor.getValue();
                updateFileContent(activeFilePath, val);
              });
            }}
            options={{
              renderSideBySide: false, // Unified inline diff view like Cursor/Windsurf
              readOnly: false,
              originalEditable: false,
              fontSize: 13.5,
              fontFamily: "'Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: true, scale: 0.8 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              diffWordWrap: 'on',
            }}
          />

          {/* Floating Action Toolbar Overlay */}
          <div className="diff-floating-toolbar">
            <button
              type="button"
              className="diff-action-btn accept"
              onClick={handleAcceptCurrent}
              title="Accept Changes (⌘Enter)"
            >
              <Check size={12} />
              <span>Accept Changes</span>
              <span className="diff-shortcut">⌘⏎</span>
            </button>

            <button
              type="button"
              className="diff-action-btn reject"
              onClick={handleRejectCurrent}
              title="Reject Changes (⌘Backspace)"
            >
              <X size={12} />
              <span>Reject</span>
              <span className="diff-shortcut">⌘⌫</span>
            </button>

            <div className="diff-toolbar-divider" />

            <button
              type="button"
              className="diff-nav-btn"
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
              className="diff-nav-btn"
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
                <div className="diff-toolbar-divider" />
                <div className="diff-files-pager">
                  <button
                    type="button"
                    className="diff-pager-arrow"
                    onClick={handlePrevEditedFile}
                    title="Previous edited file"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="diff-pager-text">
                    Edited files {currentEditIndex + 1}/{editedFilePaths.length}
                  </span>
                  <button
                    type="button"
                    className="diff-pager-arrow"
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
        <div className="editor-wrapper">
          <InlineCommandPalette />
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={activeFile?.content || ''}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13.5,
              fontFamily: "'Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: true, scale: 0.8 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              bracketPairColorization: { enabled: true },
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
          />
        </div>
      )}
    </div>
  );
};
