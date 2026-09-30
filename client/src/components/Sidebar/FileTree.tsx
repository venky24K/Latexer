import { useState, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Upload,
  File,
} from 'lucide-react';

export const FileTree: React.FC = () => {
  const {
    files,
    activeFilePath,
    setActiveFile,
    createFile,
    deleteFile,
    renameFile,
    uploadFile,
  } = useProjectStore();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileList = Object.values(files).sort((a, b) => {
    // main.tex always first
    if (a.path === 'main.tex') return -1;
    if (b.path === 'main.tex') return 1;
    return a.path.localeCompare(b.path);
  });

  const getFileIcon = (filePath: string, isBinary?: boolean) => {
    if (isBinary || /\.(png|jpe?g|gif|webp|svg|eps)$/i.test(filePath)) {
      return <ImageIcon size={14} className="tree-icon icon-image" />;
    }
    if (filePath.endsWith('.tex')) {
      return <FileText size={14} className="tree-icon icon-tex" />;
    }
    if (filePath.endsWith('.bib')) {
      return <BookOpen size={14} className="tree-icon icon-bib" />;
    }
    if (filePath.endsWith('.cls') || filePath.endsWith('.sty')) {
      return <FileCode size={14} className="tree-icon icon-code" />;
    }
    return <File size={14} className="tree-icon icon-generic" />;
  };

  const handleStartCreate = () => {
    setIsCreatingFile(true);
    setNewFileName('');
  };

  const handleConfirmCreate = () => {
    let name = newFileName.trim();
    if (!name) {
      setIsCreatingFile(false);
      return;
    }
    if (!name.includes('.')) {
      name += '.tex';
    }
    if (files[name]) {
      alert(`File '${name}' already exists.`);
      return;
    }
    createFile(name, name.endsWith('.tex') ? `% File: ${name}\n\n` : '');
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const handleStartRename = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (path === 'main.tex') {
      alert('main.tex cannot be renamed.');
      return;
    }
    setEditingPath(path);
    setEditName(path);
  };

  const handleConfirmRename = () => {
    if (!editingPath) return;
    const newName = editName.trim();
    if (newName && newName !== editingPath) {
      renameFile(editingPath, newName);
    }
    setEditingPath(null);
  };

  const handleDelete = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (path === 'main.tex') {
      alert('main.tex cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${path}?`)) {
      deleteFile(path);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (uploaded && uploaded.length > 0) {
      Array.from(uploaded).forEach((f) => uploadFile(f));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="file-tree-sidebar">
      {/* File Explorer Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">PROJECT FILES</span>
        <div className="sidebar-actions">
          <button
            className="icon-btn"
            onClick={handleStartCreate}
            title="New File (.tex, .bib, etc.)"
          >
            <Plus size={14} />
          </button>
          <button
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Figure / Image / Asset"
          >
            <Upload size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            multiple
          />
        </div>
      </div>

      {/* File List */}
      <div className="file-list">
        {/* Inline file creation input */}
        {isCreatingFile && (
          <div className="file-item-create">
            <FileText size={14} className="tree-icon icon-tex" />
            <input
              type="text"
              autoFocus
              className="inline-input"
              placeholder="filename.tex"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setIsCreatingFile(false);
              }}
              onBlur={handleConfirmCreate}
            />
          </div>
        )}

        {fileList.map((file) => {
          const isActive = file.path === activeFilePath;
          const isEditing = editingPath === file.path;

          return (
            <div
              key={file.path}
              className={`file-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFile(file.path)}
            >
              <div className="file-item-main">
                {getFileIcon(file.path, file.isBinary)}
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    className="inline-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') setEditingPath(null);
                    }}
                    onBlur={handleConfirmRename}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="file-name" title={file.path}>
                    {file.path}
                    {file.path === 'main.tex' && <span className="main-tag">main</span>}
                  </span>
                )}
              </div>

              {/* Action buttons on hover */}
              {!isEditing && file.path !== 'main.tex' && (
                <div className="file-hover-actions">
                  <button
                    className="file-action-btn"
                    onClick={(e) => handleStartRename(file.path, e)}
                    title="Rename"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="file-action-btn delete"
                    onClick={(e) => handleDelete(file.path, e)}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <span className="file-count-badge">{fileList.length} files</span>
        <span className="root-indicator">Root: main.tex</span>
      </div>
    </aside>
  );
};
