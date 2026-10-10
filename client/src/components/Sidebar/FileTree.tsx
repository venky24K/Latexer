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
        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-150 group ${
          isActive ? 'bg-brand/12 text-brand font-medium' : 'text-text-secondary hover:bg-card hover:text-text-primary'
        }`}
        onClick={() => setActiveFile(file.path)}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate flex-1">
          {getFileIcon(file.path, file.isBinary)}
          {isEditing ? (
            <input
              type="text"
              autoFocus
              className="bg-card border border-brand text-text-primary text-xs font-mono px-1 py-0.5 rounded outline-none w-full"
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
            <span className="text-[12.5px] truncate flex items-center" title={file.path}>
              {displayName}
              {file.path === 'main.tex' && (
                <span className="text-[9.5px] bg-brand/15 text-brand px-1.5 py-0.2 rounded ml-1.5 font-bold">main</span>
              )}
            </span>
          )}
        </div>

        {/* Action buttons on hover */}
        {!isEditing && file.path !== 'main.tex' && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer transition-colors"
              onClick={(e) => handleStartRename(file.path, e)}
              title="Rename"
            >
              <Edit2 size={12} />
            </button>
            <button
              className="text-text-muted hover:text-accent-red p-0.5 rounded cursor-pointer transition-colors"
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
    <aside className="flex flex-col h-full w-full min-w-[200px] border-r border-border-subtle select-none overflow-hidden bg-sidebar">
      {/* File Explorer Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-bold tracking-wider text-text-muted">PROJECT FILES</span>
        <div className="flex items-center gap-1">
          <button
            className="text-text-muted hover:text-text-primary hover:bg-card p-1 rounded cursor-pointer transition-all"
            onClick={handleStartCreate}
            title="New File (.tex, .bib, etc.)"
          >
            <Plus size={14} />
          </button>
          <button
            className="text-text-muted hover:text-text-primary hover:bg-card p-1 rounded cursor-pointer transition-all"
            onClick={handleStartCreateFolder}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            className="text-text-muted hover:text-text-primary hover:bg-card p-1 rounded cursor-pointer transition-all"
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
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        {/* Inline root file creation input */}
        {isCreatingFile && (
          <div className="flex items-center gap-2 px-2 py-1 bg-card rounded border border-brand">
            <FileText size={14} className="text-accent-blue" />
            <input
              type="text"
              autoFocus
              className="bg-transparent border-none text-text-primary text-xs font-mono outline-none w-full"
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
          <div className="flex items-center gap-2 px-2 py-1 bg-card rounded border border-brand">
            <Folder size={14} className="text-accent-amber" />
            <input
              type="text"
              autoFocus
              className="bg-transparent border-none text-text-primary text-xs font-mono outline-none w-full"
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
            <div key={folder} className="mb-0.5">
              <div
                className="flex items-center justify-between px-2 py-1 rounded cursor-pointer text-text-secondary hover:bg-card hover:text-text-primary transition-all group"
                onClick={() => toggleFolder(folder)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isCollapsed ? (
                    <ChevronRight size={13} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={13} className="text-text-muted" />
                  )}
                  {isCollapsed ? (
                    <Folder size={14} className="text-accent-amber" />
                  ) : (
                    <FolderOpen size={14} className="text-accent-amber" />
                  )}
                  <span className="text-xs font-semibold">{folder}</span>
                  <span className="text-[9.5px] font-bold bg-[rgba(44,38,30,0.06)] text-text-muted px-1.5 py-0.2 rounded-full">
                    {children.length}
                  </span>
                </div>

                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer transition-colors"
                    onClick={(e) => handleStartCreateInFolder(folder, e)}
                    title={`Create file inside ${folder}`}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    className="text-text-muted hover:text-accent-red p-0.5 rounded cursor-pointer transition-colors"
                    onClick={(e) => handleDeleteFolder(folder, e)}
                    title={`Delete folder ${folder}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Folder Children */}
              {!isCollapsed && (
                <div className="pl-3 border-l border-border-subtle ml-3 mb-0.5 flex flex-col gap-0.5">
                  {creatingInFolder === folder && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-card rounded border border-brand">
                      <FileText size={13} className="text-accent-blue" />
                      <input
                        type="text"
                        autoFocus
                        className="bg-transparent border-none text-text-primary text-xs font-mono outline-none w-full"
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
      <div className="h-8 border-t border-border-subtle flex items-center justify-between px-2.5 text-[11px] text-text-muted bg-sidebar shrink-0">
        <span>{totalFileCount} files</span>
        <span>Root: main.tex</span>
      </div>
    </aside>
  );
};
