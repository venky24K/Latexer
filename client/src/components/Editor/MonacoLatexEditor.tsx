import { useEffect, useRef } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import { useProjectStore } from '../../store/useProjectStore';
import { FileText, Image as ImageIcon } from 'lucide-react';

export const MonacoLatexEditor: React.FC = () => {
  const {
    files,
    activeFilePath,
    updateFileContent,
    errors,
    warnings,
    compileNow,
    autoCompile,
    registerJumpToLine,
  } = useProjectStore();

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const autoCompileTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  if (!activeFile) {
    return (
      <div className="editor-empty-state">
        <FileText size={48} className="empty-icon" />
        <p>No file selected</p>
      </div>
    );
  }

  // Handle binary image preview
  if (activeFile.isBinary) {
    return (
      <div className="binary-preview-container">
        <div className="binary-header">
          <ImageIcon size={16} />
          <span>{activeFile.path} (Image Asset)</span>
        </div>
        <div className="binary-body">
          <img
            src={`data:image/png;base64,${activeFile.content}`}
            alt={activeFile.path}
            className="binary-image"
          />
        </div>
      </div>
    );
  }

  const language = activeFilePath.endsWith('.bib') ? 'latex' : activeFilePath.endsWith('.json') ? 'json' : 'latex';

  return (
    <div className="editor-container">
      <div className="editor-tab-bar">
        <div className="active-tab">
          <FileText size={13} className="tab-icon" />
          <span>{activeFilePath}</span>
        </div>
        <div className="editor-actions-hint">
          <span>⌘↵ to compile</span>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={activeFile.content}
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
    </div>
  );
};
