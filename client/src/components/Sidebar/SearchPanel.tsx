import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import {
  Search,
  Replace,
  ChevronDown,
  ChevronRight,
  CaseSensitive,
  FileText,
  Check,
} from 'lucide-react';

interface SearchMatch {
  file: string;
  line: number;
  preview: string;
  matchIndex: number;
  matchLength: number;
}

export const SearchPanel: React.FC = () => {
  const { files, updateFileContent, jumpToLine, setActiveFile } = useProjectStore();

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});
  const [replacedNotice, setReplacedNotice] = useState<string | null>(null);

  // Compute matches across all non-binary text files
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: Array<{ file: string; matches: SearchMatch[] }> = [];

    Object.values(files).forEach((f) => {
      if (f.isBinary) return;

      const lines = f.content.split('\n');
      const fileMatches: SearchMatch[] = [];

      lines.forEach((lineText, lineIdx) => {
        const lineNum = lineIdx + 1;
        let index = 0;
        const targetLine = matchCase ? lineText : lineText.toLowerCase();
        const targetQuery = matchCase ? query : query.toLowerCase();

        while ((index = targetLine.indexOf(targetQuery, index)) !== -1) {
          fileMatches.push({
            file: f.path,
            line: lineNum,
            preview: lineText.trim(),
            matchIndex: index,
            matchLength: query.length,
          });
          index += targetQuery.length;
        }
      });

      if (fileMatches.length > 0) {
        results.push({ file: f.path, matches: fileMatches });
      }
    });

    return results;
  }, [files, query, matchCase]);

  const totalMatches = searchResults.reduce((acc, r) => acc + r.matches.length, 0);

  const toggleFileCollapse = (filePath: string) => {
    setCollapsedFiles((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const handleMatchClick = (match: SearchMatch) => {
    setActiveFile(match.file);
    jumpToLine(match.line, match.file);
  };

  const handleReplaceAll = () => {
    if (!query.trim()) return;

    let replaceCount = 0;
    searchResults.forEach(({ file }) => {
      const current = files[file];
      if (!current || current.isBinary) return;

      const regexFlags = matchCase ? 'g' : 'gi';
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(escapedQuery, regexFlags);

      const updated = current.content.replace(reg, replacement);
      if (updated !== current.content) {
        updateFileContent(file, updated);
        replaceCount++;
      }
    });

    setReplacedNotice(`Replaced in ${replaceCount} files.`);
    setTimeout(() => setReplacedNotice(null), 2500);
  };

  return (
    <div className="sidebar-search-panel">
      {/* Panel Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">SEARCH IN PROJECT</span>
      </div>

      {/* Search Input Controls */}
      <div className="search-controls-container">
        <div className="search-input-row">
          <button
            type="button"
            className="search-toggle-btn"
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            title={isReplaceOpen ? 'Hide Replace' : 'Toggle Replace'}
          >
            {isReplaceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <div className="search-field-wrapper">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            <button
              type="button"
              className={`search-option-btn ${matchCase ? 'active' : ''}`}
              onClick={() => setMatchCase(!matchCase)}
              title="Match Case (Aa)"
            >
              <CaseSensitive size={14} />
            </button>
          </div>
        </div>

        {/* Replace Row */}
        {isReplaceOpen && (
          <div className="search-input-row replace-row">
            <div className="search-field-wrapper indent">
              <Replace size={13} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Replace with..."
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              />

              <button
                type="button"
                className="replace-action-btn"
                onClick={handleReplaceAll}
                disabled={!query.trim() || totalMatches === 0}
                title="Replace All Occurrences Across Files"
              >
                Replace All
              </button>
            </div>
          </div>
        )}

        {replacedNotice && (
          <div className="search-notice">
            <Check size={12} className="text-green" />
            <span>{replacedNotice}</span>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {query.trim() && (
        <div className="search-results-summary">
          {totalMatches > 0 ? (
            <span>
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} in {searchResults.length}{' '}
              {searchResults.length === 1 ? 'file' : 'files'}
            </span>
          ) : (
            <span>No results found for &ldquo;{query}&rdquo;</span>
          )}
        </div>
      )}

      {/* Results List */}
      <div className="search-results-list">
        {searchResults.map(({ file, matches }) => {
          const isCollapsed = collapsedFiles[file];
          return (
            <div key={file} className="search-file-group">
              <div
                className="search-file-header"
                onClick={() => toggleFileCollapse(file)}
                role="button"
                tabIndex={0}
              >
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                <FileText size={13} className="tree-icon icon-tex" />
                <span className="search-file-path">{file}</span>
                <span className="search-match-count">{matches.length}</span>
              </div>

              {!isCollapsed && (
                <div className="search-file-matches">
                  {matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="search-match-item"
                      onClick={() => handleMatchClick(m)}
                    >
                      <span className="search-line-number">{m.line}</span>
                      <span className="search-match-snippet">{m.preview}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
