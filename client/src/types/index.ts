export interface VirtualFile {
  path: string;
  content: string;
  isBinary?: boolean;
}

export interface LaTeXDiagnostic {
  type: 'error' | 'warning' | 'badbox' | 'info';
  file?: string;
  line?: number;
  message: string;
  snippet?: string;
}

export interface CompileResponse {
  success: boolean;
  buildId: string;
  pdfUrl?: string;
  errors: LaTeXDiagnostic[];
  warnings: LaTeXDiagnostic[];
  rawLog: string;
  engineUsed: string;
  durationMs: number;
}

export interface EngineStatus {
  availableEngines: {
    tectonic: boolean;
    latexmk: boolean;
    pdflatex: boolean;
    xelatex: boolean;
  };
  recommendedEngine: string | null;
  hasAnyEngine: boolean;
  instructions: string;
}

export type CompilationState = 'idle' | 'compiling' | 'success' | 'error';
