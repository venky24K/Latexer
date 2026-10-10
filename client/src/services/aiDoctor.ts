import type { LaTeXDiagnostic } from '../types';

/**
 * Formats a comprehensive prompt for the Autonomous Agent to diagnose and fix all compiler errors.
 */
export function formatDoctorFixAllPrompt(errors: LaTeXDiagnostic[], rawLog?: string): string {
  const errorDetails = errors
    .slice(0, 8)
    .map((e, idx) => {
      const loc = e.file || 'main.tex';
      const lineStr = e.line ? ` (Line ${e.line})` : '';
      const snippetStr = e.snippet ? `\n   Snippet: "${e.snippet}"` : '';
      return `${idx + 1}. [${loc}${lineStr}] ${e.message}${snippetStr}`;
    })
    .join('\n');

  let logSnippet = '';
  if (rawLog && rawLog.length > 0) {
    // Extract the tail of the log where the fatal error usually appears
    const tailLines = rawLog.split('\n').slice(-15).join('\n');
    logSnippet = `\n\nRecent TeX engine log tail:\n\`\`\`\n${tailLines}\n\`\`\``;
  }

  return `Fix all LaTeX compiler errors in the project. The build failed with ${errors.length} error(s):\n${errorDetails}${logSnippet}\n\nPlease inspect the offending file(s), surgically repair the syntax or missing package declarations, stage the edits, and compile the workspace to verify zero errors.`;
}

/**
 * Formats a focused prompt for fixing a specific diagnostic error.
 */
export function formatDoctorFixSinglePrompt(item: LaTeXDiagnostic): string {
  const loc = item.file || 'main.tex';
  const lineStr = item.line ? ` at line ${item.line}` : '';
  const snippetStr = item.snippet ? ` Offending code snippet: "${item.snippet}".` : '';
  return `Fix the LaTeX compilation error in ${loc}${lineStr}: "${item.message}".${snippetStr} Inspect the file around this location, apply the fix, and compile the workspace to verify zero errors.`;
}
