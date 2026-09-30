import type { CompileResponse, EngineStatus, VirtualFile } from '../types';

export async function fetchEngineStatus(): Promise<EngineStatus> {
  const res = await fetch('/api/engine-status');
  if (!res.ok) {
    throw new Error(`Failed to fetch engine status: ${res.statusText}`);
  }
  return res.json();
}

export async function compileWorkspace(
  files: VirtualFile[],
  mainFile: string = 'main.tex',
  engine: string = 'auto'
): Promise<CompileResponse> {
  const res = await fetch('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, mainFile, engine }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    try {
      const parsed = JSON.parse(errorText);
      throw new Error(parsed.error || errorText);
    } catch {
      throw new Error(errorText || 'Server compilation request failed');
    }
  }

  return res.json();
}
