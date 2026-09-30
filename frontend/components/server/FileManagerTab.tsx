'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '@/lib/api';

interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
}

interface FileManagerTabProps {
  serverId: string;
  server: any;
}

export default function FileManagerTab({ serverId, server }: FileManagerTabProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Dropdown states
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  // Modals
  const [showSftpModal, setShowSftpModal] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  // Inputs in modals
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renameValue, setRenameValue] = useState('');

  // Inline Editor
  const [editingFile, setEditingFile] = useState<{ path: string; name: string } | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorSavedNotice, setEditorSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editorGutterRef = useRef<HTMLDivElement>(null);

  const fetchFiles = async (targetPath = currentPath) => {
    setLoading(true);
    try {
      const data = await api.getFiles(serverId, targetPath);
      setFiles(data.files || []);
      setSelectedFiles(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, serverId]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  const foldersCount = useMemo(() => files.filter((f) => f.isDirectory).length, [files]);
  const filesCount = useMemo(() => files.filter((f) => !f.isDirectory).length, [files]);

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        await api.uploadFile(serverId, currentPath, fileList[i]);
      }
      await fetchFiles();
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open file in inline editor
  const openEditor = async (file: FileItem) => {
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    try {
      const data = await api.readFile(serverId, fullPath);
      setEditingFile({ path: fullPath, name: file.name });
      setEditorContent(data.content || '');
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };

  const handleSaveEditor = async () => {
    if (!editingFile) return;
    setEditorSaving(true);
    try {
      await api.writeFile(serverId, editingFile.path, editorContent);
      setEditorSavedNotice(true);
      setTimeout(() => setEditorSavedNotice(false), 2500);
      await fetchFiles();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setEditorSaving(false);
    }
  };

  // Create file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const target = currentPath ? `${currentPath}/${newFileName.trim()}` : newFileName.trim();
    try {
      await api.writeFile(serverId, target, '');
      setShowNewFileModal(false);
      setNewFileName('');
      await fetchFiles();
      // Auto open editor
      openEditor({ name: newFileName.trim(), isDirectory: false, size: 0, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error(err);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const target = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
    try {
      await api.createDir(serverId, target);
      setShowNewFolderModal(false);
      setNewFolderName('');
      await fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  // Rename
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    const oldPath = currentPath ? `${currentPath}/${renameTarget.name}` : renameTarget.name;
    try {
      await api.renameFile(serverId, oldPath, renameValue.trim());
      setRenameTarget(null);
      setRenameValue('');
      await fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Single
  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    const targetPath = currentPath ? `${currentPath}/${deleteTarget.name}` : deleteTarget.name;
    try {
      await api.deleteFile(serverId, targetPath);
      setDeleteTarget(null);
      await fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`ต้องการลบ ${selectedFiles.size} รายการที่เลือกหรือไม่?`)) return;

    for (const name of selectedFiles) {
      const targetPath = currentPath ? `${currentPath}/${name}` : name;
      try {
        await api.deleteFile(serverId, targetPath);
      } catch {}
    }
    await fetchFiles();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) return '📁';
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json': return '📜';
      case 'yml':
      case 'yaml': return '⚙️';
      case 'properties': return '🔧';
      case 'jar': return '☕';
      case 'txt': return '📄';
      case 'log': return '📝';
      case 'png':
      case 'jpg': return '🖼️';
      default: return '📄';
    }
  };

  const isEditable = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ['properties', 'json', 'yml', 'yaml', 'txt', 'log', 'sh', 'bat', 'cfg', 'conf', 'toml'].includes(ext || '');
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.name)));
    }
  };

  const toggleSelect = (name: string) => {
    const next = new Set(selectedFiles);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedFiles(next);
  };

  // Line count for editor
  const lineCount = useMemo(() => {
    return editorContent.split('\n').length;
  }, [editorContent]);

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />

      {/* Uploading Banner */}
      {uploading && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-sm text-emerald-300 backdrop-blur-md animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            <span className="font-bold text-white text-sm">กำลังอัปโหลดไฟล์สู่เซิร์ฟเวอร์...</span>
            <span className="text-emerald-300/80 font-mono text-xs">เป้าหมาย: /{currentPath || 'root'}</span>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-medium">กรุณารอสักครู่</span>
        </div>
      )}

      {/* Upper Bar: Title & Breadcrumbs + SFTP & Backup Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b101e]/95 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span className="text-2xl">📁</span>
              <span>File Manager</span>
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 font-mono font-semibold">
              {foldersCount} Folders, {filesCount} Files
            </span>
          </div>

          {/* Breadcrumbs Navigation */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button
              onClick={() => navigateTo('')}
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer font-mono ${
                currentPath === ''
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </button>

            {pathParts.map((part, index) => {
              const subPath = pathParts.slice(0, index + 1).join('/');
              const isLast = index === pathParts.length - 1;
              return (
                <div key={subPath} className="flex items-center gap-2">
                  <span className="text-slate-600 font-mono select-none">/</span>
                  <button
                    onClick={() => navigateTo(subPath)}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer font-mono truncate max-w-[200px] ${
                      isLast
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>📁</span>
                    <span>{part}</span>
                  </button>
                </div>
              );
            })}

            {currentPath && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText('/' + currentPath);
                  setCopiedPath(true);
                  setTimeout(() => setCopiedPath(false), 2000);
                }}
                type="button"
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors"
                title="คัดลอก Path ปัจจุบัน"
              >
                {copiedPath ? '✓ Copied' : '📋 Copy Path'}
              </button>
            )}
          </div>
        </div>

        {/* Right Buttons: SFTP & Export & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowSftpModal(true)}
            type="button"
            className="flex items-center gap-2 border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5V11a1 1 0 0 0-2 0v5.5a1 1 0 0 0 2 0zm-1-8a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 8.5z" strokeWidth="2" />
            </svg>
            <span>SFTP Connect</span>
          </button>

          <a
            href={api.getExportUrl(serverId)}
            download
            className="flex items-center gap-2 border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
            title="ดาวน์โหลดไฟล์ทั้งหมดเป็น ZIP"
          >
            <span>📦</span>
            <span>Export ZIP</span>
          </a>

          <button
            onClick={() => fetchFiles(currentPath)}
            type="button"
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="รีเฟรชรายการไฟล์"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lower Bar: Search & Primary Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="ค้นหาไฟล์หรือโฟลเดอร์... (กด / เพื่อค้นหา)"
            className="w-full bg-[#070b14] border border-slate-700/80 text-slate-200 text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Up + Upload + Create Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={navigateUp}
            disabled={!currentPath}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-sm cursor-pointer"
            title="ขึ้น 1 ระดับ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 19V5M5 12l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>ขึ้น 1 ระดับ</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Upload</span>
          </button>

          {/* Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              type="button"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <span className="text-base leading-none font-extrabold">+</span>
              <span>Create</span>
              <svg className="w-3.5 h-3.5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showCreateDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-[#0d131f] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-30">
                <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setShowNewFileModal(true);
                  }}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="text-emerald-400">📄</span>
                  <span>New File</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setShowNewFolderModal(true);
                  }}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="text-amber-400">📁</span>
                  <span>New Directory</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Selection Bar */}
      {selectedFiles.size > 0 && (
        <div className="sticky top-2 z-20 px-5 py-3 bg-[#0d1424]/95 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs backdrop-blur-xl shadow-[0_8px_30px_rgba(16,185,129,0.2)] animate-[slide-up_0.2s_ease-out]">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-white text-sm tracking-wide">{selectedFiles.size} รายการที่เลือก</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDelete}
              type="button"
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/30 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
            >
              <span>ลบที่เลือก (Delete {selectedFiles.size})</span>
            </button>
            <button
              onClick={() => setSelectedFiles(new Set())}
              type="button"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg font-medium transition-all cursor-pointer text-xs"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Main Files Table */}
      <div className="bg-[#090d18] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-400 mt-3">กำลังโหลดรายการไฟล์...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-24 text-center text-slate-500 font-mono text-sm">
            <div className="text-4xl mb-2">📂</div>
            <p>โฟลเดอร์นี้ว่างเปล่า หรือไม่พบไฟล์ที่ตรงกับคำค้นหา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 text-xs font-mono">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      checked={selectedFiles.size > 0 && selectedFiles.size === filteredFiles.length}
                      onChange={toggleSelectAll}
                      type="checkbox"
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold">ชื่อไฟล์ / โฟลเดอร์</th>
                  <th className="py-3 px-4 w-32 font-semibold">ขนาด</th>
                  <th className="py-3 px-4 w-44 font-semibold hidden md:table-cell">แก้ไขล่าสุด</th>
                  <th className="py-3 px-4 w-36 text-right font-semibold">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFiles.has(file.name);
                  return (
                    <tr
                      key={file.name}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          checked={isSelected}
                          onChange={() => toggleSelect(file.name)}
                          type="checkbox"
                          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg flex-shrink-0">{getFileIcon(file)}</span>
                          {file.isDirectory ? (
                            <button
                              onClick={() => navigateTo(currentPath ? `${currentPath}/${file.name}` : file.name)}
                              type="button"
                              className="font-bold text-slate-100 hover:text-emerald-400 text-sm transition-colors cursor-pointer text-left truncate"
                            >
                              {file.name}
                            </button>
                          ) : isEditable(file.name) ? (
                            <button
                              onClick={() => openEditor(file)}
                              type="button"
                              className="font-medium text-slate-200 hover:text-cyan-300 text-sm transition-colors cursor-pointer text-left truncate"
                            >
                              {file.name}
                            </button>
                          ) : (
                            <span className="font-medium text-slate-200 text-sm truncate">{file.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {file.isDirectory ? '-' : formatBytes(file.size)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 hidden md:table-cell">
                        {new Date(file.updatedAt).toLocaleDateString('th-TH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {!file.isDirectory && isEditable(file.name) && (
                            <button
                              onClick={() => openEditor(file)}
                              type="button"
                              className="p-1.5 hover:bg-slate-700/80 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                              title="เปิดแก้ไขไฟล์"
                            >
                              ✏️
                            </button>
                          )}
                          {!file.isDirectory && (
                            <a
                              href={api.getDownloadUrl(serverId, currentPath ? `${currentPath}/${file.name}` : file.name)}
                              download
                              className="p-1.5 hover:bg-slate-700/80 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              title="ดาวน์โหลดไฟล์"
                            >
                              ⬇️
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setRenameTarget(file);
                              setRenameValue(file.name);
                            }}
                            type="button"
                            className="p-1.5 hover:bg-slate-700/80 text-amber-300 rounded-lg transition-colors cursor-pointer"
                            title="เปลี่ยนชื่อ"
                          >
                            🏷️
                          </button>
                          <button
                            onClick={() => setDeleteTarget(file)}
                            type="button"
                            className="p-1.5 hover:bg-red-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="ลบ"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline File Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#070b14] border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-[scale-in_0.15s_ease-out]">
            {/* Editor Top Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📝</span>
                <div>
                  <h4 className="font-bold text-white text-sm font-mono">{editingFile.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">/{editingFile.path}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {editorSavedNotice && (
                  <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    ✓ บันทึกสำเร็จ
                  </span>
                )}
                <button
                  onClick={handleSaveEditor}
                  disabled={editorSaving}
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {editorSaving ? 'กำลังบันทึก...' : '💾 บันทึก (Save)'}
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  type="button"
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Editor Workspace with Line Numbers */}
            <div className="flex-1 flex overflow-hidden font-mono text-xs bg-[#040711]">
              <div
                ref={editorGutterRef}
                className="w-12 bg-slate-950/90 text-slate-600 text-right pr-3 py-4 select-none border-r border-slate-800 overflow-hidden leading-6"
              >
                {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={editorTextareaRef}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                onScroll={(e) => {
                  if (editorGutterRef.current) {
                    editorGutterRef.current.scrollTop = e.currentTarget.scrollTop;
                  }
                }}
                className="flex-1 p-4 bg-transparent text-slate-200 outline-none resize-none leading-6 font-mono whitespace-pre overflow-auto"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* SFTP Connect Modal */}
      {showSftpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101e] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-[scale-in_0.15s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔐</span>
                <span>SFTP Connection Details</span>
              </h4>
              <button
                onClick={() => setShowSftpModal(false)}
                type="button"
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              เชื่อมต่อผ่าน FileZilla, WinSCP หรือโปรแกรม SFTP client ใดๆ โดยใช้รายละเอียดต่อไปนี้:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px]">HOST</span>
                  <span className="text-slate-200 font-bold">127.0.0.1 (localhost)</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('127.0.0.1')}
                  type="button"
                  className="text-emerald-400 hover:text-white text-[11px] cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px]">PORT</span>
                  <span className="text-emerald-400 font-bold">2022</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('2022')}
                  type="button"
                  className="text-emerald-400 hover:text-white text-[11px] cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px]">USERNAME</span>
                  <span className="text-slate-200 font-bold">{serverId}</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(serverId)}
                  type="button"
                  className="text-emerald-400 hover:text-white text-[11px] cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px]">PASSWORD</span>
                  <span className="text-slate-200 font-bold">minecraft</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('minecraft')}
                  type="button"
                  className="text-emerald-400 hover:text-white text-[11px] cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSftpModal(false)}
              type="button"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateFile} className="bg-[#0b101e] border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>📄</span>
              <span>สร้างไฟล์ใหม่</span>
            </h4>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ชื่อไฟล์ (พร้อมนามสกุล เช่น test.txt หรือ config.yml)</label>
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                autoFocus
                placeholder="ชื่อไฟล์..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFileModal(false)}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                สร้างไฟล์
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateFolder} className="bg-[#0b101e] border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>📁</span>
              <span>สร้างโฟลเดอร์ใหม่</span>
            </h4>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ชื่อโฟลเดอร์</label>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                placeholder="ชื่อโฟลเดอร์..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                สร้างโฟลเดอร์
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleRename} className="bg-[#0b101e] border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏷️</span>
              <span>เปลี่ยนชื่อ {renameTarget.name}</span>
            </h4>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ชื่อใหม่</label>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRenameTarget(null)}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                บันทึกชื่อใหม่
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101e] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-red-400 flex items-center gap-2">
              <span>🗑️</span>
              <span>ยืนยันการลบ</span>
            </h4>
            <p className="text-xs text-slate-300">
              คุณแน่ใจหรือไม่ว่าต้องการลบ{' '}
              <span className="font-mono text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                {deleteTarget.name}
              </span>{' '}
              การกระทำนี้ไม่สามารถย้อนกลับได้!
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteSingle}
                type="button"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
