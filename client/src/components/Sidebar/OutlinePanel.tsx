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
        return <Bookmark size={13} className="outline-icon section" />;
      case 'subsection':
        return <Hash size={12} className="outline-icon subsection" />;
      case 'subsubsection':
        return <Hash size={11} className="outline-icon subsubsection" />;
      case 'figure':
        return <ImageIcon size={12} className="outline-icon figure" />;
      case 'table':
        return <TableIcon size={12} className="outline-icon table" />;
      case 'equation':
        return <Sigma size={12} className="outline-icon equation" />;
      default:
        return <FileText size={12} />;
    }
  };

  return (
    <div className="sidebar-outline-panel">
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">DOCUMENT OUTLINE</span>
        <span className="sidebar-active-file" title={activeFilePath}>
          {activeFilePath}
        </span>
      </div>

      {/* Outline List */}
      <div className="outline-list">
        {outlineItems.length === 0 ? (
          <div className="empty-outline-state">
            <Bookmark size={24} className="text-muted" />
            <p>No sections or environments found in {activeFilePath}</p>
          </div>
        ) : (
          outlineItems.map((item, idx) => (
            <div
              key={idx}
              className={`outline-item ${item.type}`}
              onClick={() => jumpToLine(item.line, activeFilePath)}
              title={`Jump to line ${item.line}`}
            >
              <div className="outline-item-content">
                {getItemIcon(item.type)}
                <span className="outline-title">{item.title}</span>
              </div>
              <span className="outline-line-hint">{item.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
