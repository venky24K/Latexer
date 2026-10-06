import { create } from 'zustand';

export type ViewMode = 'split' | 'editor-only' | 'preview-only';

interface LayoutPreferences {
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  panelSizes: [number, number, number];
}

interface LayoutState extends LayoutPreferences {
  // Actions
  toggleSidebar: (force?: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setPanelSizes: (sizes: [number, number, number]) => void;
  resetLayout: () => void;
}

const STORAGE_KEY = 'latexer_layout_preferences_v1';
const DEFAULT_SIZES: [number, number, number] = [18, 42, 40];

function sanitizeSizes(sizes: any): [number, number, number] {
  if (Array.isArray(sizes) && sizes.length === 3) {
    const s = Math.min(Math.max(Number(sizes[0]) || 18, 10), 40);
    const e = Math.min(Math.max(Number(sizes[1]) || 42, 20), 80);
    const p = Math.min(Math.max(Number(sizes[2]) || 40, 20), 80);
    return [s, e, p];
  }
  return DEFAULT_SIZES;
}

function loadSavedPreferences(): LayoutPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
        viewMode: (['split', 'editor-only', 'preview-only'].includes(parsed.viewMode)
          ? parsed.viewMode
          : 'split') as ViewMode,
        panelSizes: sanitizeSizes(parsed.panelSizes),
      };
    }
  } catch {
    // ignore local storage errors
  }
  return {
    sidebarCollapsed: false,
    viewMode: 'split',
    panelSizes: DEFAULT_SIZES,
  };
}

function savePreferences(prefs: LayoutPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

const initialPrefs = loadSavedPreferences();

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarCollapsed: initialPrefs.sidebarCollapsed,
  viewMode: initialPrefs.viewMode,
  panelSizes: initialPrefs.panelSizes,

  toggleSidebar: (force) => {
    set((state) => {
      const nextCollapsed = force !== undefined ? !force : !state.sidebarCollapsed;
      const updated: LayoutPreferences = {
        sidebarCollapsed: nextCollapsed,
        viewMode: state.viewMode,
        panelSizes: state.panelSizes,
      };
      savePreferences(updated);
      return { sidebarCollapsed: nextCollapsed };
    });
  },

  setSidebarCollapsed: (collapsed) => {
    set((state) => {
      const updated: LayoutPreferences = {
        sidebarCollapsed: collapsed,
        viewMode: state.viewMode,
        panelSizes: state.panelSizes,
      };
      savePreferences(updated);
      return { sidebarCollapsed: collapsed };
    });
  },

  setViewMode: (mode) => {
    set((state) => {
      const updated: LayoutPreferences = {
        sidebarCollapsed: mode === 'editor-only' || mode === 'preview-only' ? true : state.sidebarCollapsed,
        viewMode: mode,
        panelSizes: state.panelSizes,
      };
      savePreferences(updated);
      return {
        viewMode: mode,
        sidebarCollapsed: updated.sidebarCollapsed,
      };
    });
  },

  setPanelSizes: (sizes) => {
    set((state) => {
      const updated: LayoutPreferences = {
        sidebarCollapsed: state.sidebarCollapsed,
        viewMode: state.viewMode,
        panelSizes: sizes,
      };
      savePreferences(updated);
      return { panelSizes: sizes };
    });
  },

  resetLayout: () => {
    const updated: LayoutPreferences = {
      sidebarCollapsed: false,
      viewMode: 'split',
      panelSizes: DEFAULT_SIZES,
    };
    savePreferences(updated);
    set(updated);
  },
}));
