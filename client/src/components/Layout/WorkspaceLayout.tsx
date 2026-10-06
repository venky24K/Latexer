import React, { useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { FileTree } from '../Sidebar/FileTree';
import { MonacoLatexEditor } from '../Editor/MonacoLatexEditor';
import { PdfViewer } from '../Preview/PdfViewer';
import { LogsDrawer } from '../Logs/LogsDrawer';
import { AiSidebar } from '../AI/AiSidebar';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useProjectStore } from '../../store/useProjectStore';
import { PanelLeftOpen, FileText } from 'lucide-react';

export const WorkspaceLayout: React.FC = () => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    viewMode,
    panelSizes,
    setPanelSizes,
  } = useLayoutStore();

  const { files, toggleLogsDrawer } = useProjectStore();
  const fileCount = Object.keys(files).length;

  // Global keyboard shortcuts: ⌘B / Ctrl+B for Sidebar, ⌘J / Ctrl+J for Logs Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Cmd is pressed
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      // ⌘B / Ctrl+B -> Toggle Sidebar
      if (e.key.toLowerCase() === 'b' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }

      // ⌘J / Ctrl+J -> Toggle Logs & Diagnostics Drawer
      if (e.key.toLowerCase() === 'j' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        toggleLogsDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleLogsDrawer]);

  return (
    <main className="latexer-workspace">
      {/* Collapsed Slim Sidebar Rail (shows when primary sidebar is collapsed in split mode) */}
      {sidebarCollapsed && viewMode === 'split' && (
        <aside className="collapsed-sidebar-rail" title="Expand Project Files (⌘B)">
          <button
            className="rail-btn toggle"
            onClick={() => toggleSidebar(true)}
            title="Expand Project Files (⌘B)"
          >
            <PanelLeftOpen size={15} />
          </button>

          <button
            className="rail-btn file-counter"
            onClick={() => toggleSidebar(true)}
            title={`${fileCount} files in project`}
          >
            <FileText size={14} />
            <span className="rail-badge">{fileCount}</span>
          </button>
        </aside>
      )}

      {/* Primary Resizable Workspace Panel Group */}
      <Group
        orientation="horizontal"
        className="workspace-panels"
        id="latexer-panels-group"
        onLayoutChanged={(layout) => {
          if (layout.sidebar && layout.editor && layout.preview) {
            setPanelSizes([layout.sidebar, layout.editor, layout.preview]);
          }
        }}
      >
        {/* Panel 1: Project File Tree */}
        {!sidebarCollapsed && viewMode === 'split' && (
          <>
            <Panel
              id="sidebar"
              defaultSize={`${panelSizes[0]}%`}
              minSize="10%"
              maxSize="40%"
              className="panel-sidebar"
            >
              <FileTree />
            </Panel>

            <Separator className="resize-handle" />
          </>
        )}

        {/* Panel 2: Monaco LaTeX Code Editor */}
        {viewMode !== 'preview-only' && (
          <Panel
            id="editor"
            defaultSize={viewMode === 'editor-only' ? '100%' : `${panelSizes[1]}%`}
            minSize={viewMode === 'editor-only' ? '100%' : '20%'}
            className="panel-editor"
          >
            <MonacoLatexEditor />
          </Panel>
        )}

        {/* Separator between Editor and PDF Preview (shown when both are visible in split mode) */}
        {viewMode === 'split' && <Separator className="resize-handle" />}

        {/* Panel 3: Hardware-Accelerated PDF.js Preview */}
        {viewMode !== 'editor-only' && (
          <Panel
            id="preview"
            defaultSize={viewMode === 'preview-only' ? '100%' : `${panelSizes[2]}%`}
            minSize={viewMode === 'preview-only' ? '100%' : '20%'}
            className="panel-preview"
          >
            <PdfViewer />
          </Panel>
        )}
      </Group>

      {/* Expandable Bottom Drawer for Compiler Diagnostics & Raw Logs */}
      <LogsDrawer />

      {/* Gemini AI Copilot Sidebar */}
      <AiSidebar />
    </main>
  );
};
