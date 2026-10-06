import React from 'react';
import { useLayoutStore, type SidebarTab } from '../../store/useLayoutStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useAiStore } from '../../store/useAiStore';
import {
  Files,
  Search,
  Sparkles,
  ListTree,
  Settings,
} from 'lucide-react';

export const ActivityBar: React.FC = () => {
  const {
    activeSidebarTab,
    sidebarCollapsed,
    toggleSidebarTab,
  } = useLayoutStore();

  const { files } = useProjectStore();
  const { setSettingsModalOpen, provider } = useAiStore();

  const fileCount = Object.keys(files).length;

  const topItems: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    badge?: number | string;
  }> = [
    {
      id: 'files',
      label: 'Project Explorer',
      shortcut: '⌘⇧E',
      icon: <Files size={19} />,
      badge: fileCount > 0 ? fileCount : undefined,
    },
    {
      id: 'search',
      label: 'Search in Project',
      shortcut: '⌘⇧F',
      icon: <Search size={19} />,
    },
    {
      id: 'ai',
      label: `AI Copilot (${provider.toUpperCase()})`,
      icon: <Sparkles size={19} className="text-blue" />,
    },
    {
      id: 'outline',
      label: 'Document Outline',
      icon: <ListTree size={19} />,
    },
  ];

  return (
    <nav className="activity-bar" aria-label="Activity Bar">
      {/* Top Group: Primary Navigation Views */}
      <div className="activity-bar-group top">
        {topItems.map((item) => {
          const isActive = !sidebarCollapsed && activeSidebarTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`activity-bar-btn ${isActive ? 'active' : ''}`}
              onClick={() => toggleSidebarTab(item.id)}
              title={`${item.label} ${item.shortcut ? `(${item.shortcut})` : ''}`}
            >
              <div className="activity-icon-wrapper">
                {item.icon}
                {item.badge && <span className="activity-badge">{item.badge}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Group: Settings & Engine Configuration */}
      <div className="activity-bar-group bottom">
        <button
          type="button"
          className="activity-bar-btn settings"
          onClick={() => setSettingsModalOpen(true)}
          title="AI & Engine Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </nav>
  );
};
