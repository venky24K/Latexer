import { create } from 'zustand';
import type { CompilationState, CompileResponse, EngineStatus, LaTeXDiagnostic, VirtualFile } from '../types';
import { compileWorkspace, fetchEngineStatus } from '../services/api';
import { TEMPLATES } from '../templates';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProjectState {
  projectName: string;
  files: Record<string, VirtualFile>;
  activeFilePath: string;
  openTabs: string[];
  folders: string[];
  
  // Compilation
  compilationState: CompilationState;
  pdfUrl: string | null;
  compileDuration: number | null;
  errors: LaTeXDiagnostic[];
  warnings: LaTeXDiagnostic[];
  rawLog: string;
  engineUsed: string;
  selectedEngine: string;
  autoCompile: boolean;

  // UI state
  logsDrawerOpen: boolean;
  logsActiveTab: 'diagnostics' | 'raw';
  engineStatus: EngineStatus | null;
  templateModalOpen: boolean;
  hostSetupModalOpen: boolean;

  // Jump to line callback registered by Monaco
  jumpToLineFn: ((line: number, file?: string) => void) | null;

  // Actions
  setProjectName: (name: string) => void;
  setActiveFile: (path: string) => void;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  closeOtherTabs: (keepPath: string) => void;
  createFolder: (folderPath: string) => void;
  deleteFolder: (folderPath: string) => void;
  updateFileContent: (path: string, content: string) => void;
  createFile: (path: string, content?: string, isBinary?: boolean) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  uploadFile: (file: File) => Promise<void>;
  loadTemplate: (templateId: string) => void;
  compileNow: () => Promise<void>;
  setSelectedEngine: (engine: string) => void;
  setAutoCompile: (enabled: boolean) => void;
  toggleLogsDrawer: (open?: boolean) => void;
  setLogsActiveTab: (tab: 'diagnostics' | 'raw') => void;
  setTemplateModalOpen: (open: boolean) => void;
  setHostSetupModalOpen: (open: boolean) => void;
  registerJumpToLine: (fn: (line: number, file?: string) => void) => void;
  jumpToLine: (line: number, file?: string) => void;
  exportZip: () => Promise<void>;
  downloadPdf: () => void;
  initProject: () => Promise<void>;
}

const STORAGE_KEY = 'latexer_project_v1';

function getDefaultFiles(): Record<string, VirtualFile> {
  const defaultTemplate = TEMPLATES[0]; // Academic paper
  const files: Record<string, VirtualFile> = {};
  defaultTemplate.files.forEach((f) => {
    files[f.path] = { ...f };
  });
  return files;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Academic Research Manuscript',
  files: getDefaultFiles(),
  activeFilePath: 'main.tex',
  openTabs: ['main.tex'],
  folders: [],

  compilationState: 'idle',
  pdfUrl: null,
  compileDuration: null,
  errors: [],
  warnings: [],
  rawLog: '',
  engineUsed: '',
  selectedEngine: 'auto',
  autoCompile: false,

  logsDrawerOpen: false,
  logsActiveTab: 'diagnostics',
  engineStatus: null,
  templateModalOpen: false,
  hostSetupModalOpen: false,
  jumpToLineFn: null,

  setProjectName: (name) => set({ projectName: name }),

  setActiveFile: (path) => {
    if (get().files[path]) {
      const openTabs = get().openTabs;
      const nextTabs = openTabs.includes(path) ? openTabs : [...openTabs, path];
      set({ activeFilePath: path, openTabs: nextTabs });
    }
  },

  openTab: (path) => {
    if (get().files[path]) {
      const openTabs = get().openTabs;
      const nextTabs = openTabs.includes(path) ? openTabs : [...openTabs, path];
      set({ activeFilePath: path, openTabs: nextTabs });
    }
  },

  closeTab: (path) => {
    set((state) => {
      if (state.openTabs.length <= 1) return state;
      const nextTabs = state.openTabs.filter((t) => t !== path);
      let nextActive = state.activeFilePath;
      if (state.activeFilePath === path) {
        const idx = state.openTabs.indexOf(path);
        const newIdx = Math.max(0, idx - 1);
        nextActive = nextTabs[newIdx] || nextTabs[0] || 'main.tex';
      }
      return { openTabs: nextTabs, activeFilePath: nextActive };
    });
  },

  closeOtherTabs: (keepPath) => {
    set({
      openTabs: [keepPath],
      activeFilePath: keepPath,
    });
  },

  createFolder: (folderPath) => {
    const cleanFolder = folderPath.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanFolder) return;
    set((state) => {
      if (state.folders.includes(cleanFolder)) return state;
      return { folders: [...state.folders, cleanFolder] };
    });
  },

  deleteFolder: (folderPath) => {
    set((state) => {
      const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
      const updatedFiles = { ...state.files };
      Object.keys(updatedFiles).forEach((p) => {
        if (p.startsWith(prefix) && p !== 'main.tex') {
          delete updatedFiles[p];
        }
      });
      const updatedFolders = state.folders.filter((f) => f !== folderPath && !f.startsWith(prefix));
      const nextTabs = state.openTabs.filter((t) => !t.startsWith(prefix));
      let nextActive = state.activeFilePath;
      if (nextActive.startsWith(prefix)) {
        nextActive = nextTabs[0] || 'main.tex';
      }
      return {
        files: updatedFiles,
        folders: updatedFolders,
        openTabs: nextTabs.length > 0 ? nextTabs : ['main.tex'],
        activeFilePath: nextActive,
      };
    });
  },

  updateFileContent: (path, content) => {
    set((state) => {
      const current = state.files[path];
      if (!current) return state;
      const updatedFiles = {
        ...state.files,
        [path]: { ...current, content },
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          projectName: state.projectName,
          files: updatedFiles,
          activeFilePath: state.activeFilePath,
          openTabs: state.openTabs,
          folders: state.folders,
        }));
      } catch {
        // local storage quota or private browsing
      }

      return { files: updatedFiles };
    });
  },

  createFile: (path, content = '', isBinary = false) => {
    set((state) => {
      const updatedFiles = {
        ...state.files,
        [path]: { path, content, isBinary },
      };
      const parts = path.split('/');
      let updatedFolders = state.folders;
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join('/');
        if (!updatedFolders.includes(folder)) {
          updatedFolders = [...updatedFolders, folder];
        }
      }
      const nextTabs = state.openTabs.includes(path) ? state.openTabs : [...state.openTabs, path];
      return {
        files: updatedFiles,
        activeFilePath: path,
        openTabs: nextTabs,
        folders: updatedFolders,
      };
    });
  },

  deleteFile: (path) => {
    set((state) => {
      if (path === 'main.tex') {
        alert('main.tex cannot be deleted as it is the project root document.');
        return state;
      }
      const updated = { ...state.files };
      delete updated[path];
      const nextTabs = state.openTabs.filter((t) => t !== path);
      let nextActive = state.activeFilePath;
      if (state.activeFilePath === path) {
        nextActive = nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : 'main.tex';
      }
      return {
        files: updated,
        openTabs: nextTabs.length > 0 ? nextTabs : ['main.tex'],
        activeFilePath: nextActive,
      };
    });
  },

  renameFile: (oldPath, newPath) => {
    if (!newPath || oldPath === newPath) return;
    if (oldPath === 'main.tex') {
      alert('main.tex cannot be renamed as it is required as the compilation entrypoint.');
      return;
    }
    set((state) => {
      const current = state.files[oldPath];
      if (!current) return state;
      const updated = { ...state.files };
      delete updated[oldPath];
      updated[newPath] = { ...current, path: newPath };
      const nextTabs = state.openTabs.map((t) => (t === oldPath ? newPath : t));
      return {
        files: updated,
        openTabs: nextTabs,
        activeFilePath: state.activeFilePath === oldPath ? newPath : state.activeFilePath,
      };
    });
  },

  uploadFile: async (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|pdf|eps)$/i.test(file.name);
    const reader = new FileReader();

    if (isImage) {
      reader.onload = () => {
        const result = reader.result as string;
        // remove data URL prefix (e.g. "data:image/png;base64,")
        const base64 = result.split(',')[1];
        get().createFile(file.name, base64, true);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        get().createFile(file.name, text, false);
      };
      reader.readAsText(file);
    }
  },

  loadTemplate: (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const newFiles: Record<string, VirtualFile> = {};
    template.files.forEach((f) => {
      newFiles[f.path] = { ...f };
    });
    set({
      projectName: template.name,
      files: newFiles,
      activeFilePath: 'main.tex',
      templateModalOpen: false,
      pdfUrl: null,
      errors: [],
      warnings: [],
      rawLog: '',
    });
    // Trigger compilation on template load
    setTimeout(() => {
      get().compileNow();
    }, 100);
  },

  compileNow: async () => {
    const { files, selectedEngine, compilationState } = get();
    if (compilationState === 'compiling') return;

    set({ compilationState: 'compiling' });

    try {
      const filesArray = Object.values(files);
      const res: CompileResponse = await compileWorkspace(filesArray, 'main.tex', selectedEngine);

      set({
        compilationState: res.success ? 'success' : 'error',
        pdfUrl: res.pdfUrl || null,
        compileDuration: res.durationMs,
        errors: res.errors || [],
        warnings: res.warnings || [],
        rawLog: res.rawLog || '',
        engineUsed: res.engineUsed,
        // automatically open logs drawer if there are errors
        logsDrawerOpen: res.errors && res.errors.length > 0 ? true : get().logsDrawerOpen,
      });
    } catch (err: any) {
      set({
        compilationState: 'error',
        errors: [
          {
            type: 'error',
            file: 'main.tex',
            message: err.message || 'Network / Server compilation failed',
          },
        ],
        rawLog: err.message || 'Unable to connect to compilation backend.',
        logsDrawerOpen: true,
      });
    }
  },

  setSelectedEngine: (engine) => set({ selectedEngine: engine }),

  setAutoCompile: (enabled) => set({ autoCompile: enabled }),

  toggleLogsDrawer: (open) =>
    set((state) => ({ logsDrawerOpen: open !== undefined ? open : !state.logsDrawerOpen })),

  setLogsActiveTab: (tab) => set({ logsActiveTab: tab }),

  setTemplateModalOpen: (open) => set({ templateModalOpen: open }),

  setHostSetupModalOpen: (open) => set({ hostSetupModalOpen: open }),

  registerJumpToLine: (fn) => set({ jumpToLineFn: fn }),

  jumpToLine: (line, file) => {
    if (file && file !== get().activeFilePath) {
      get().setActiveFile(file);
    }
    const fn = get().jumpToLineFn;
    if (fn) {
      fn(line, file);
    }
  },

  exportZip: async () => {
    const { files, projectName } = get();
    const zip = new JSZip();

    Object.values(files).forEach((f) => {
      if (f.isBinary) {
        zip.file(f.path, f.content, { base64: true });
      } else {
        zip.file(f.path, f.content);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'latex_project';
    saveAs(blob, `${cleanName}.zip`);
  },

  downloadPdf: () => {
    const { pdfUrl, projectName } = get();
    if (!pdfUrl) return;
    const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'document';
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${cleanName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  initProject: async () => {
    try {
      const status = await fetchEngineStatus();
      set({ engineStatus: status });
      if (!status.hasAnyEngine) {
        // Automatically open host setup dialog if no LaTeX engine detected
        set({ hostSetupModalOpen: true });
      }
    } catch (err) {
      console.warn('Backend engine status check failed:', err);
    }

    // Try restoring saved local storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.files && Object.keys(parsed.files).length > 0) {
          const activeFile = parsed.activeFilePath || 'main.tex';
          const tabs = Array.isArray(parsed.openTabs) && parsed.openTabs.length > 0 ? parsed.openTabs : [activeFile];
          set({
            projectName: parsed.projectName || 'My LaTeX Project',
            files: parsed.files,
            activeFilePath: activeFile,
            openTabs: tabs.includes(activeFile) ? tabs : [...tabs, activeFile],
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
          });
        }
      }
    } catch {
      // ignore
    }

    // Run initial compilation
    get().compileNow();
  },
}));
