import { useEffect } from 'react';
import { TopNav } from './components/Header/TopNav';
import { WorkspaceLayout } from './components/Layout/WorkspaceLayout';
import { TemplateModal } from './components/Modals/TemplateModal';
import { HostSetupModal } from './components/Modals/HostSetupModal';
import { AiSettingsModal } from './components/Modals/AiSettingsModal';
import { SettingsModal } from './components/Modals/SettingsModal';
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
    <div className="flex flex-col h-screen w-screen bg-app text-text-primary overflow-hidden font-sans">
      <TopNav />
      <WorkspaceLayout />

      {/* Interactive Modals */}
      <TemplateModal />
      <HostSetupModal />
      <AiSettingsModal />
      <SettingsModal />
    </div>
  );
}

export default App;
