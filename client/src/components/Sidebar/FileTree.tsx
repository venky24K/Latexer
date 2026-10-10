import { useState, useRef, useMemo } from 'react';
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
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export const FileTree: React.FC = () => {
  const {
    files,
    folders,
    activeFilePath,
    setActiveFile,
    createFile,
    deleteFile,
    renameFile,
    uploadFile,
    createFolder,
    deleteFolder,
  } = useProjectStore();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  const [folderNewFileName, setFolderNewFileName] = useState('');

  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute folder list and grouped files
  const { folderNames, folderFilesMap, rootFiles } = useMemo(() => {
    const allFolderSet = new Set<string>(folders);
    Object.keys(files).forEach((p) => {
      if (p.includes('/')) {
        const parts = p.split('/');
        allFolderSet.add(parts.slice(0, -1).join('/'));
      }
    });

    const folderNames = Array.from(allFolderSet).sort();
    const folderFilesMap: Record<string, typeof files[string][]> = {};
    folderNames.forEach((f) => {
      folderFilesMap[f] = [];
    });

    const rootFiles: typeof files[string][] = [];

    Object.values(files).forEach((file) => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join('/');
        if (folderFilesMap[folder]) {
          folderFilesMap[folder].push(file);
        } else {
          folderFilesMap[folder] = [file];
        }
      } else {
        rootFiles.push(file);
      }
    });

    // Sort root files with main.tex first
    rootFiles.sort((a, b) => {
      if (a.path === 'main.tex') return -1;
      if (b.path === 'main.tex') return 1;
      return a.path.localeCompare(b.path);
    });

    // Sort files within folders
    Object.keys(folderFilesMap).forEach((f) => {
      folderFilesMap[f].sort((a, b) => a.path.localeCompare(b.path));
    });

    return { folderNames, folderFilesMap, rootFiles };
  }, [files, folders]);

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

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
    setIsCreatingFolder(false);
    setCreatingInFolder(null);
    setNewFileName('');
  };

  const handleStartCreateFolder = () => {
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
    setCreatingInFolder(null);
    setNewFolderName('');
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

  const handleConfirmCreateFolder = () => {
    const name = newFolderName.trim().replace(/^\/+|\/+$/g, '');
    if (!name) {
      setIsCreatingFolder(false);
      return;
    }
    createFolder(name);
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleStartCreateInFolder = (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingInFolder(folder);
    setFolderNewFileName('');
    setCollapsedFolders((prev) => ({ ...prev, [folder]: false }));
  };

  const handleConfirmCreateInFolder = (folder: string) => {
    let name = folderNewFileName.trim();
    if (!name) {
      setCreatingInFolder(null);
      return;
    }
    if (!name.includes('.')) {
      name += '.tex';
    }
    const fullPath = `${folder}/${name}`;
    if (files[fullPath]) {
      alert(`File '${fullPath}' already exists.`);
      return;
    }
    createFile(fullPath, fullPath.endsWith('.tex') ? `% File: ${fullPath}\n\n` : '');
    setCreatingInFolder(null);
    setFolderNewFileName('');
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

  const handleDeleteFolder = (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete folder "${folder}" and all its contained files?`)) {
      deleteFolder(folder);
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

  const renderFileRow = (file: typeof files[string], isNested = false) => {
    const isActive = file.path === activeFilePath;
    const isEditing = editingPath === file.path;
    const displayName = isNested ? file.path.split('/').pop() || file.path : file.path;

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
              {displayName}
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
  };

  const totalFileCount = Object.keys(files).length;

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
            onClick={handleStartCreateFolder}
            title="New Folder"
          >
            <FolderPlus size={14} />
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
        {/* Inline root file creation input */}
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

        {/* Inline root folder creation input */}
        {isCreatingFolder && (
          <div className="file-item-create">
            <Folder size={14} className="tree-icon text-amber" />
            <input
              type="text"
              autoFocus
              className="inline-input"
              placeholder="folder_name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateFolder();
                if (e.key === 'Escape') setIsCreatingFolder(false);
              }}
              onBlur={handleConfirmCreateFolder}
            />
          </div>
        )}

        {/* Folder Groups */}
        {folderNames.map((folder) => {
          const isCollapsed = Boolean(collapsedFolders[folder]);
          const children = folderFilesMap[folder] || [];

          return (
            <div key={folder} className="tree-folder-group">
              <div className="folder-item" onClick={() => toggleFolder(folder)}>
                <div className="folder-item-left">
                  {isCollapsed ? (
                    <ChevronRight size={13} className="folder-caret" />
                  ) : (
                    <ChevronDown size={13} className="folder-caret" />
                  )}
                  {isCollapsed ? (
                    <Folder size={14} className="tree-icon text-amber" />
                  ) : (
                    <FolderOpen size={14} className="tree-icon text-amber" />
                  )}
                  <span className="folder-name">{folder}</span>
                  <span className="folder-count-badge">{children.length}</span>
                </div>

                <div className="folder-item-actions">
                  <button
                    className="file-action-btn"
                    onClick={(e) => handleStartCreateInFolder(folder, e)}
                    title={`Create file inside ${folder}`}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    className="file-action-btn delete"
                    onClick={(e) => handleDeleteFolder(folder, e)}
                    title={`Delete folder ${folder}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Folder Children */}
              {!isCollapsed && (
                <div className="folder-children">
                  {creatingInFolder === folder && (
                    <div className="file-item-create">
                      <FileText size={13} className="tree-icon icon-tex" />
                      <input
                        type="text"
                        autoFocus
                        className="inline-input"
                        placeholder="new_file.tex"
                        value={folderNewFileName}
                        onChange={(e) => setFolderNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmCreateInFolder(folder);
                          if (e.key === 'Escape') setCreatingInFolder(null);
                        }}
                        onBlur={() => handleConfirmCreateInFolder(folder)}
                      />
                    </div>
                  )}

                  {children.map((file) => renderFileRow(file, true))}
                </div>
              )}
            </div>
          );
        })}

        {/* Root Files (main.tex, references.bib, etc.) */}
        {rootFiles.map((file) => renderFileRow(file, false))}
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <span className="file-count-badge">{totalFileCount} files</span>
        <span className="root-indicator">Root: main.tex</span>
      </div>
    </aside>
  );
};
