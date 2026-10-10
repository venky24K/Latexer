import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import {
  Bookmark,
  Hash,
  Image as ImageIcon,
  Table as TableIcon,
  Sigma,
  FileText,
} from 'lucide-react';

interface OutlineItem {
  type: 'section' | 'subsection' | 'subsubsection' | 'figure' | 'table' | 'equation';
  title: string;
  line: number;
}

export const OutlinePanel: React.FC = () => {
  const { files, activeFilePath, jumpToLine } = useProjectStore();
  const activeFile = files[activeFilePath];

  const outlineItems = useMemo(() => {
    if (!activeFile || activeFile.isBinary) return [];

    const lines = activeFile.content.split('\n');
    const items: OutlineItem[] = [];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();

      // Sections
      const secMatch = trimmed.match(/^\\section\*?\{([^}]+)\}/);
      if (secMatch) {
        items.push({ type: 'section', title: secMatch[1], line: lineNum });
        return;
      }

      // Subsections
      const subsecMatch = trimmed.match(/^\\subsection\*?\{([^}]+)\}/);
      if (subsecMatch) {
        items.push({ type: 'subsection', title: subsecMatch[1], line: lineNum });
        return;
      }

      // Subsubsections
      const subsubsecMatch = trimmed.match(/^\\subsubsection\*?\{([^}]+)\}/);
      if (subsubsecMatch) {
        items.push({ type: 'subsubsection', title: subsubsecMatch[1], line: lineNum });
        return;
      }

      // Figures
      if (trimmed.startsWith('\\begin{figure}')) {
        items.push({ type: 'figure', title: 'Figure', line: lineNum });
        return;
      }

      // Tables
      if (trimmed.startsWith('\\begin{table}')) {
        items.push({ type: 'table', title: 'Table', line: lineNum });
        return;
      }

      // Math Equations
      if (trimmed.startsWith('\\begin{equation}')) {
        items.push({ type: 'equation', title: 'Equation', line: lineNum });
        return;
      }
    });

    return items;
  }, [activeFile]);

  const getItemIcon = (type: OutlineItem['type']) => {
    switch (type) {
      case 'section':
        return <Bookmark size={13} className="text-brand shrink-0" />;
      case 'subsection':
        return <Hash size={12} className="text-accent-blue shrink-0" />;
      case 'subsubsection':
        return <Hash size={11} className="text-accent-purple shrink-0" />;
      case 'figure':
        return <ImageIcon size={12} className="text-[#ec4899] shrink-0" />;
      case 'table':
        return <TableIcon size={12} className="text-accent-amber shrink-0" />;
      case 'equation':
        return <Sigma size={12} className="text-accent-blue shrink-0" />;
      default:
        return <FileText size={12} className="shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      {/* Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-bold tracking-wider text-text-muted">DOCUMENT OUTLINE</span>
        <span className="text-[10.5px] text-text-muted font-mono max-w-[120px] truncate" title={activeFilePath}>
          {activeFilePath}
        </span>
      </div>

      {/* Outline List */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        {outlineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2 text-text-muted text-center text-xs">
            <Bookmark size={24} className="text-text-muted opacity-50" />
            <p>No sections or environments found in {activeFilePath}</p>
          </div>
        ) : (
          outlineItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-all duration-150 hover:bg-card-hover group ${
                item.type === 'section'
                  ? 'font-semibold text-text-primary'
                  : item.type === 'subsection'
                  ? 'pl-4 text-text-secondary'
                  : item.type === 'subsubsection'
                  ? 'pl-6 text-text-muted'
                  : 'text-text-secondary'
              }`}
              onClick={() => jumpToLine(item.line, activeFilePath)}
              title={`Jump to line ${item.line}`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {getItemIcon(item.type)}
                <span className="text-xs truncate">{item.title}</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted group-hover:text-accent-blue ml-2">{item.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
