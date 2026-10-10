import { create } from 'zustand';

export type SettingsTab =
  | 'appearance'
  | 'editor'
  | 'compiler'
  | 'spelling'
  | 'references'
  | 'notifications'
  | 'ai';

export interface SettingsPreferences {
  // Appearance (matches user's screenshot)
  editorTheme: string;
  darkModePdf: boolean;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  pdfBgColor: string;

  // Editor
  wordWrap: boolean;
  lineNumbers: 'on' | 'off';
  bracketPairColorization: boolean;
  codeSnippets: boolean;

  // Spelling & Language
  spellCheck: boolean;
  spellLanguage: string;

  // Notifications
  notifyOnCompileError: boolean;
  notifyOnSuccess: boolean;
}

export interface SettingsState extends SettingsPreferences {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;

  // Appearance actions
  setEditorTheme: (theme: string) => void;
  setDarkModePdf: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setLineHeight: (height: number) => void;
  setPdfBgColor: (color: string) => void;

  // Editor actions
  setWordWrap: (wrap: boolean) => void;
  setLineNumbers: (mode: 'on' | 'off') => void;
  setBracketPairColorization: (enabled: boolean) => void;
  setCodeSnippets: (enabled: boolean) => void;

  // Spelling actions
  setSpellCheck: (enabled: boolean) => void;
  setSpellLanguage: (lang: string) => void;

  // Notification actions
  setNotifyOnCompileError: (enabled: boolean) => void;
  setNotifyOnSuccess: (enabled: boolean) => void;

  // Reset
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'latexer_settings_v1';

const DEFAULT_SETTINGS: SettingsPreferences = {
  editorTheme: 'elsewhere-warm',
  darkModePdf: false,
  fontSize: 12,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', monospace",
  lineHeight: 19,
  pdfBgColor: '#F2EEF9',
  wordWrap: true,
  lineNumbers: 'on',
  bracketPairColorization: true,
  codeSnippets: true,
  spellCheck: true,
  spellLanguage: 'en_US',
  notifyOnCompileError: true,
  notifyOnSuccess: false,
};

function loadSettings(): SettingsPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(prefs: SettingsPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export const useSettingsStore = create<SettingsState>((set) => {
  const initial = loadSettings();

  const update = (patch: Partial<SettingsPreferences>) => {
    set((state) => {
      const updated = {
        editorTheme: patch.editorTheme ?? state.editorTheme,
        darkModePdf: patch.darkModePdf ?? state.darkModePdf,
        fontSize: patch.fontSize ?? state.fontSize,
        fontFamily: patch.fontFamily ?? state.fontFamily,
        lineHeight: patch.lineHeight ?? state.lineHeight,
        pdfBgColor: patch.pdfBgColor ?? state.pdfBgColor,
        wordWrap: patch.wordWrap ?? state.wordWrap,
        lineNumbers: patch.lineNumbers ?? state.lineNumbers,
        bracketPairColorization: patch.bracketPairColorization ?? state.bracketPairColorization,
        codeSnippets: patch.codeSnippets ?? state.codeSnippets,
        spellCheck: patch.spellCheck ?? state.spellCheck,
        spellLanguage: patch.spellLanguage ?? state.spellLanguage,
        notifyOnCompileError: patch.notifyOnCompileError ?? state.notifyOnCompileError,
        notifyOnSuccess: patch.notifyOnSuccess ?? state.notifyOnSuccess,
      };
      saveSettings(updated);
      return updated;
    });
  };

  return {
    ...initial,
    isOpen: false,
    setIsOpen: (open) => set({ isOpen: open }),
    activeTab: 'appearance',
    setActiveTab: (tab) => set({ activeTab: tab }),

    setEditorTheme: (theme) => update({ editorTheme: theme }),
    setDarkModePdf: (dark) => update({ darkModePdf: dark }),
    setFontSize: (size) => update({ fontSize: size }),
    setFontFamily: (family) => update({ fontFamily: family }),
    setLineHeight: (height) => update({ lineHeight: height }),
    setPdfBgColor: (color) => {
      update({ pdfBgColor: color });
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--color-preview', color);
      }
    },

    setWordWrap: (wrap) => update({ wordWrap: wrap }),
    setLineNumbers: (mode) => update({ lineNumbers: mode }),
    setBracketPairColorization: (enabled) => update({ bracketPairColorization: enabled }),
    setCodeSnippets: (enabled) => update({ codeSnippets: enabled }),

    setSpellCheck: (enabled) => update({ spellCheck: enabled }),
    setSpellLanguage: (lang) => update({ spellLanguage: lang }),

    setNotifyOnCompileError: (enabled) => update({ notifyOnCompileError: enabled }),
    setNotifyOnSuccess: (enabled) => update({ notifyOnSuccess: enabled }),

    resetToDefaults: () => {
      saveSettings(DEFAULT_SETTINGS);
      set({ ...DEFAULT_SETTINGS });
    },
  };
});
