import { LaTeXDiagnostic } from './types.js';

export function parseLaTeXLog(rawLog: string, defaultFile: string = 'main.tex'): {
  errors: LaTeXDiagnostic[];
  warnings: LaTeXDiagnostic[];
} {
  const errors: LaTeXDiagnostic[] = [];
  const warnings: LaTeXDiagnostic[] = [];

  const lines = rawLog.split(/\r?\n/);
  let currentFile = defaultFile;
  const fileStack: string[] = [defaultFile];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect file open/close parenthesis heuristics in standard TeX logs
    // E.g.: (./subfile.tex or (./chapter1.tex
    const openFileMatch = line.match(/\((\.\/[^)\s]+\.tex|\/[^)\s]+\.tex)/);
    if (openFileMatch) {
      currentFile = openFileMatch[1].replace(/^\.\//, '');
      fileStack.push(currentFile);
    }

    // Tectonic / Compiler error prefixes: error: or main.tex:12: error:
    const tectonicErrorMatch = line.match(/^(?:.*\.tex:(\d+):\s*)?error:\s*(.*)$/i);
    if (tectonicErrorMatch) {
      const lineNum = tectonicErrorMatch[1] ? parseInt(tectonicErrorMatch[1], 10) : undefined;
      const errorMsg = tectonicErrorMatch[2].trim();
      errors.push({
        type: 'error',
        file: currentFile,
        line: lineNum,
        message: errorMsg,
      });
      continue;
    }

    // LaTeX Fatal / Syntax Errors: starting with '!'
    if (line.startsWith('!')) {
      const errorMessage = line.substring(1).trim();
      let errorLineNumber: number | undefined;
      let snippet: string | undefined;

      // Scan subsequent 4 lines for `l.<number>` context
      for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
        const nextLine = lines[j];
        const lineMatch = nextLine.match(/^l\.(\d+)\s*(.*)$/);
        if (lineMatch) {
          errorLineNumber = parseInt(lineMatch[1], 10);
          snippet = lineMatch[2];
          break;
        }
      }

      errors.push({
        type: 'error',
        file: currentFile,
        line: errorLineNumber,
        message: errorMessage,
        snippet: snippet,
      });
      continue;
    }

    // Warnings: LaTeX Warning: ... or Package <pkg> Warning: ...
    if (line.includes('Warning:') || line.includes('LaTeX Warning:')) {
      const warnMatch = line.match(/^(?:LaTeX Warning:|Package \w+ Warning:)\s*(.*)$/);
      const message = warnMatch ? warnMatch[1].trim() : line.trim();
      let warnLineNumber: number | undefined;

      // Check if line contains "on input line <number>"
      const inputLineMatch = line.match(/on input line (\d+)/i);
      if (inputLineMatch) {
        warnLineNumber = parseInt(inputLineMatch[1], 10);
      }

      warnings.push({
        type: 'warning',
        file: currentFile,
        line: warnLineNumber,
        message: message,
      });
      continue;
    }

    // Bad boxes (Overfull / Underfull \hbox or \vbox)
    if (line.startsWith('Overfull \\hbox') || line.startsWith('Underfull \\hbox')) {
      const match = line.match(/at lines (\d+)(?:--\d+)?/);
      warnings.push({
        type: 'badbox',
        file: currentFile,
        line: match ? parseInt(match[1], 10) : undefined,
        message: line.trim(),
      });
    }
  }

  return { errors, warnings };
}
