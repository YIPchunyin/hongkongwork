'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface NoteImage {
  url: string;
  key: string;
}

interface NoteItem {
  _id: string;
  title: string;
  content: string;
  images: NoteImage[];
  createdAt: string;
  updatedAt: string;
}

interface NotesData {
  items: NoteItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function NotesPage() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<NoteItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImages, setFormImages] = useState<NoteImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch('/api/notes?' + params.toString());
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setNotes(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {} finally { setFetching(false); }
  }, [page, search]);

  useEffect(() => { if (user) fetchNotes(); }, [user, fetchNotes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openAdd = () => {
    setEditItem(null);
    setFormTitle('');
    setFormContent('');
    setFormImages([]);
    setShowModal(true);
  };

  const openEdit = (item: NoteItem) => {
    setEditItem(item);
    setFormTitle(item.title || '');
    setFormContent(item.content || '');
    setFormImages(item.images || []);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/notes/upload', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) {
          setFormImages(prev => [...prev, json.data]);
        }
      }
    } catch {} finally { setUploading(false); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent && formImages.length === 0) {
      alert('请输入内容或添加图片');
      return;
    }
    setSaving(true);
    try {
      const body = { title: formTitle, content: formContent, images: formImages };
      if (editItem) {
        await fetch('/api/notes/' + editItem._id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      setShowModal(false);
      fetchNotes();
    } catch {} finally { setSaving(false); }
  };

  const deleteNote = async (id: string) => {
    setDeleteId(null);
    await fetch('/api/notes/' + id, { method: 'DELETE' });
    fetchNotes();
  };

  const closeLightbox = () => {
    setLightboxImg(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      <p className="text-gray-400 mb-4">请先登录</p>
      <a href="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">去登录</a>
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          记事本
        </h1>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all min-h-[44px] flex items-center gap-1.5 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新建
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="搜索记事标题或内容..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </form>

      {fetching ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-gray-400 mb-1">{search ? '没有找到匹配的记事' : '还没有记事'}</p>
          <p className="text-gray-300 text-sm">{search ? '试试其他关键词' : '点击右上角新建记事'}</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-400 mb-3">共 {total} 条记录{search && <span className="ml-1">(搜索: {search})</span>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.map((note) => (
              <div key={note._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                {note.images && note.images.length > 0 && (
                  <div className="flex gap-1 p-2 pb-0 overflow-x-auto">
                    {note.images.map((img, i) => (
                      <button key={i} onClick={() => setLightboxImg(img.url)} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-100 hover:opacity-80 transition-opacity">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{note.title || '无标题'}</h3>
                  {note.content && <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-3 whitespace-pre-wrap">{note.content}</p>}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString('zh-HK')} {new Date(note.createdAt).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(note)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="编辑">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteId(note._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors">上一页</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors">下一页</button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="font-semibold text-gray-900">{editItem ? '编辑记事' : '新建记事'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">标题（选填）</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="给记事起个标题" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">内容</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="写点什么..." rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">图片</label>
                {formImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formImages.map((img, i) => (
                      <div key={i} className="relative group/image">
                        <img src={img.url} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {uploading ? (
                      <><div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> 上传中...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 添加图片</>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all text-sm">{saving ? '保存中...' : (editItem ? '保存修改' : '创建记事')}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">确认删除</h3>
              <p className="text-sm text-gray-500 mb-4">删除后无法恢复，确定要删除这条记事吗？</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">取消</button>
                <button onClick={() => deleteNote(deleteId)} className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all text-sm">删除</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center touch-none select-none" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/20 backdrop-blur rounded-full px-4 py-2">
            <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, z - 0.5)); }} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
            </button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(5, z + 0.5)); }} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }} className="ml-2 px-3 py-1 text-xs text-white/80 hover:text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors">重置</button>
          </div>
          <img src={lightboxImg} alt="" className="max-w-[95vw] max-h-[95vh] object-contain cursor-grab active:cursor-grabbing transition-transform duration-100"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            onClick={(e) => e.stopPropagation()} draggable={false} />
        </div>
      )}
    </div>
  );
}
