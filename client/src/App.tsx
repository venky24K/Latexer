import { useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { TopNav } from './components/Header/TopNav';
import { FileTree } from './components/Sidebar/FileTree';
import { MonacoLatexEditor } from './components/Editor/MonacoLatexEditor';
import { PdfViewer } from './components/Preview/PdfViewer';
import { LogsDrawer } from './components/Logs/LogsDrawer';
import { TemplateModal } from './components/Modals/TemplateModal';
import { HostSetupModal } from './components/Modals/HostSetupModal';
import { AiSidebar } from './components/AI/AiSidebar';
import { AiSettingsModal } from './components/Modals/AiSettingsModal';
import { useProjectStore } from './store/useProjectStore';
import { useAiStore } from './store/useAiStore';

export function App() {
  const initProject = useProjectStore((s) => s.initProject);
  const initAi = useAiStore((s) => s.initAi);

  useEffect(() => {
    initProject();
    initAi();
  }, [initProject, initAi]);

  return (
    <div className="latexer-app">
      <TopNav />

      <main className="latexer-workspace">
        <Group orientation="horizontal" className="workspace-panels">
          {/* Panel 1: File Tree */}
          <Panel defaultSize={18} minSize={12} maxSize={30} className="panel-sidebar">
            <FileTree />
          </Panel>

          <Separator className="resize-handle" />

          {/* Panel 2: Editor */}
          <Panel defaultSize={42} minSize={25} className="panel-editor">
            <MonacoLatexEditor />
          </Panel>

          <Separator className="resize-handle" />

          {/* Panel 3: PDF Preview */}
          <Panel defaultSize={40} minSize={25} className="panel-preview">
            <PdfViewer />
          </Panel>
        </Group>

        {/* Expandable Bottom Drawer for Logs & Diagnostics */}
        <LogsDrawer />

        {/* Gemini AI Copilot Sidebar */}
        <AiSidebar />
      </main>

      {/* Interactive Modals */}
      <TemplateModal />
      <HostSetupModal />
      <AiSettingsModal />
    </div>
  );
}

export default App;
