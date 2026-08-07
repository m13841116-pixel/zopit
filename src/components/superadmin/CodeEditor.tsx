import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../ToastContext';
import { Save, Play, RotateCcw, Folder, File as FileIcon, ChevronDown, ChevronRight, X, AlertTriangle, UploadCloud, Code, Bug } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export default function CodeEditor() {
  const [activeTab, setActiveTab] = useState<'editor' | 'updater' | 'logs'>('editor');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<{stdout: string, stderr: string} | null>(null);
  
  // Updater State
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string; buildSuccess?: boolean; details?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error Logs State
  const [errorLogs, setErrorLogs] = useState<string>('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (activeTab === 'editor' && fileTree.length === 0) fetchFileTree();
    if (activeTab === 'logs') fetchErrorLogs();
  }, [activeTab]);

  const fetchFileTree = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/dev/files', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFileTree(data);
      } else {
        throw new Error('خطا در دریافت لیست فایل‌ها');
      }
    } catch (err: any) {
      addToast(err.message || 'خطا در برقراری ارتباط', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErrorLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/admin/dev/error-logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setErrorLogs(data.logs);
      }
    } catch (err: any) {
      addToast('خطا در دریافت لاگ‌ها', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const loadFile = async (path: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/dev/file?path=${encodeURIComponent(path)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
        setOriginalContent(data.content);
        setSelectedFile(path);
      } else {
        throw new Error('خطا در خواندن فایل');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/dev/file', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ path: selectedFile, content: fileContent })
      });
      if (res.ok) {
        setOriginalContent(fileContent);
        addToast('فایل با موفقیت ذخیره شد.', 'success');
      } else {
        throw new Error('خطا در ذخیره فایل');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerBuild = async () => {
    try {
      setIsBuilding(true);
      setBuildLogs(null);
      addToast('در حال کامپایل پروژه... ممکن است کمی طول بکشد.', 'info');
      const res = await fetch('/api/admin/dev/build', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('پروژه با موفقیت کامپایل شد.', 'success');
        setBuildLogs({ stdout: data.stdout, stderr: data.stderr });
      } else {
        addToast('خطا در کامپایل پروژه', 'error');
        setBuildLogs({ stdout: data.stdout || '', stderr: data.stderr || data.details || 'خطای نامشخص' });
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBuilding(false);
    }
  };

  const triggerRestart = async () => {
    try {
      await fetch('/api/admin/dev/restart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      addToast('دستور راه‌اندازی مجدد ارسال شد. لطفاً چند ثانیه صبر کنید.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (err: any) {
      addToast('خطا در ارسال دستور', 'error');
    }
  };

  const handleUpdateUpload = async () => {
    if (!selectedZip) return addToast('لطفاً فایل ZIP خروجی را انتخاب کنید.', 'error');
    
    const formData = new FormData();
    formData.append('updateZip', selectedZip);

    try {
      setIsUpdating(true);
      addToast('در حال آپلود و جایگزینی فایل‌ها...', 'info');
      const res = await fetch('/api/admin/dev/update', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        addToast('بروزرسانی با موفقیت انجام شد. لطفاً پروژه را بیلد کنید.', 'success');
        setSelectedZip(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        throw new Error(data.error || 'خطا در بروزرسانی');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderTree = (nodes: FileNode[], paddingLeft = 0) => {
    return nodes.map((node, i) => {
      if (node.type === 'directory') {
        const isExpanded = expandedDirs.has(node.path);
        return (
          <div key={node.path || i}>
            <div 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface cursor-pointer text-sm text-slate-700 select-none"
              style={{ paddingRight: `${paddingLeft}px` }}
              onClick={() => toggleDir(node.path)}
            >
              {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
              <Folder size={14} className="text-blue-500" />
              <span>{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, paddingLeft + 12)}</div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={node.path || i}
            className={`flex items-center gap-2 px-2 py-1.5 hover:bg-surface cursor-pointer text-sm select-none ${selectedFile === node.path ? 'bg-primary-default/10 text-primary-default font-semibold' : 'text-slate-600'}`}
            style={{ paddingRight: `${paddingLeft + 16}px` }}
            onClick={() => loadFile(node.path)}
          >
            <FileIcon size={14} className="text-slate-400" />
            <span>{node.name}</span>
          </div>
        );
      }
    });
  };

  const isModified = fileContent !== originalContent;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-card border border-subtle rounded-2xl overflow-hidden shadow-sm animate-fade-in" dir="rtl">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-subtle bg-surface">
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg border border-subtle">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white text-primary-default shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            <Code size={16} />
            ویرایشگر کد
          </button>
          <button 
            onClick={() => setActiveTab('updater')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'updater' ? 'bg-white text-primary-default shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            <UploadCloud size={16} />
            بروزرسانی خودکار
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-primary-default shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            <Bug size={16} />
            دیباگر (لاگ خطا)
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={triggerBuild}
            disabled={isBuilding}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isBuilding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={16} />}
            <span dir="ltr">Build (کامپایل)</span>
          </button>
          
          <button
            onClick={triggerRestart}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            <span>ری‌استارت</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <>
            {/* Sidebar (File Tree) */}
            <div className="w-64 bg-slate-50 border-l border-subtle flex flex-col overflow-y-auto" dir="ltr">
              <div className="p-2 border-b border-subtle">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">فایل‌های پروژه</span>
              </div>
              <div className="p-1 pb-4">
                {isLoading && !fileTree.length ? (
                  <div className="p-4 text-center text-sm text-slate-500">در حال بارگذاری...</div>
                ) : (
                  renderTree(fileTree)
                )}
              </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative" dir="ltr">
              {selectedFile ? (
                <>
                  {/* Editor Tabs / Info */}
                  <div className="flex items-center justify-between p-2 border-b border-subtle bg-slate-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-subtle rounded text-sm text-slate-700 font-mono shadow-sm">
                      <FileIcon size={14} className="text-slate-400" />
                      {selectedFile}
                      {isModified && <span className="w-2 h-2 rounded-full bg-warning ml-1"></span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveFile}
                        disabled={!isModified || isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-success hover:bg-success/90 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        dir="rtl"
                      >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        <span>ذخیره فایل</span>
                      </button>
                      <button onClick={() => setSelectedFile(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Editor */}
                  <div className="flex-1 relative">
                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed text-slate-800 bg-white resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-primary-default/20"
                      spellCheck={false}
                      wrap="off"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4" dir="rtl">
                  <FileIcon size={48} className="opacity-20" />
                  <p className="font-semibold text-slate-500">یک فایل را از لیست برای ویرایش انتخاب کنید</p>
                  <p className="text-sm">برای اعمال کدهایی که از هوش مصنوعی دریافت می‌کنید، فایل مربوطه را تغییر داده و بیلد بگیرید.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'updater' && (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-subtle shadow-sm">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-subtle">
                <div className="w-12 h-12 bg-primary-default/10 rounded-xl flex items-center justify-center text-primary-default">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">بروزرسانی خودکار سیستم</h3>
                  <p className="text-slate-500 text-sm mt-1">فایل خروجی هوش مصنوعی (.zip) را آپلود کنید تا سیستم تغییرات را اعمال کند.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    راهنمای استفاده
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                    <li>فایل زیپ که از طریق هوش مصنوعی یا AI Studio دانلود کرده‌اید را انتخاب کنید.</li>
                    <li>سیستم به طور خودکار فایل‌ها را جایگزین می‌کند (به جز دیتابیس و فایل env).</li>
                    <li>پس از اتمام، روی دکمه <strong>بیلد پروژه (Build)</strong> در بالای صفحه کلیک کنید.</li>
                    <li>سپس دکمه <strong>ری‌استارت</strong> را بزنید تا تغییرات کاملاً اعمال شوند.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">انتخاب فایل ZIP</label>
                  <input
                    type="file"
                    accept=".zip"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedZip(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-default/10 file:text-primary-default
                      hover:file:bg-primary-default/20
                      border border-subtle rounded-xl p-2 cursor-pointer bg-slate-50"
                  />
                </div>

                <button
                  onClick={handleUpdateUpload}
                  disabled={!selectedZip || isUpdating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-default/20"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>در حال استخراج و بروزرسانی...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} />
                      <span>شروع بروزرسانی</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col bg-slate-900 relative">
            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Bug size={18} className="text-red-400" />
                دیباگر سیستم (System Errors)
              </h3>
              <button 
                onClick={fetchErrorLogs}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
              >
                <RotateCcw size={14} /> بروزرسانی لاگ‌ها
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-sm leading-loose whitespace-pre-wrap bg-slate-900 text-slate-300" dir="ltr">
              {isLoadingLogs ? (
                <div className="flex justify-center mt-10 text-slate-500">در حال دریافت...</div>
              ) : errorLogs ? (
                errorLogs
              ) : (
                <div className="text-slate-500 text-center mt-10">هیچ خطایی در سیستم ثبت نشده است.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Build Logs Console Overlay */}
      {buildLogs && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-950 border-t border-slate-700 flex flex-col z-50 shadow-2xl" dir="ltr">
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-black">
            <span className="text-xs font-mono font-bold text-slate-300">Terminal (Build Output)</span>
            <button onClick={() => setBuildLogs(null)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed text-slate-300 bg-slate-950 whitespace-pre-wrap">
            {buildLogs.stdout && <div className="text-green-300 mb-2">{buildLogs.stdout}</div>}
            {buildLogs.stderr && <div className="text-red-400">{buildLogs.stderr}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
