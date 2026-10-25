'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ImageEditorModal from '@/components/ImageEditorModal';

interface NoteImage {
  url: string;
  key: string;
  thumbUrl?: string;
  thumbKey?: string;
}

interface NoteItem {
  _id: string;
  title: string;
  content: string;
  images: NoteImage[];
  createdAt: string;
  updatedAt: string;
}

interface LightboxState {
  url: string;
  images: NoteImage[];
  idx: number;
}

// 克制的强调色：只用在卡片顶部细条 / 小圆点上，
// 卡片本身统一是白色玻璃，整体观感和收入页一致。
const ACCENTS = ['#10B981', '#0EA5E9', '#6366F1', '#14B8A6', '#8B5CF6', '#F59E0B'];

const accentOf = (i: number) => ACCENTS[i % ACCENTS.length];

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' });
};

const fullDate = (iso: string) => (iso ? iso.split('T')[0] : '');

/** 客户端压缩：最长边 1920，JPEG 质量 0.8 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1920;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w > h) {
          h = Math.round((img.naturalHeight * MAX) / img.naturalWidth);
          w = MAX;
        } else {
          w = Math.round((img.naturalWidth * MAX) / img.naturalHeight);
          h = MAX;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compress failed'))), 'image/jpeg', 0.8);
    };
    img.onerror = () => reject(new Error('Load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export default function NotesPage() {
  const { user, loading } = useAuth();

  // 列表
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [visible, setVisible] = useState<Set<string>>(new Set());

  // 新建 / 编辑
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<NoteItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImages, setFormImages] = useState<NoteImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingImgIdx, setEditingImgIdx] = useState<number | null>(null);

  // 详情
  const [detail, setDetail] = useState<NoteItem | null>(null);
  const [detailIdx, setDetailIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // 删除确认
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 图片灯箱
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const pinchPan = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchNotes = useCallback(async () => {
    setFetching(true);
    setVisible(new Set());
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch('/api/notes?' + params.toString());
      const json = await res.json();
      if (json.success) {
        setNotes(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } catch {
      /* 忽略网络错误，保持上一次列表 */
    } finally {
      setFetching(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user, fetchNotes]);

  // 卡片进入视口时淡入
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(new Set(notes.map((n) => n._id)));
      return;
    }
    observer.current?.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) setVisible((prev) => new Set(prev).add(id));
            observer.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    cardRefs.current.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, [notes]);

  const registerCard = (id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
      observer.current?.observe(el);
    } else {
      cardRefs.current.delete(id);
    }
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
    setVisible(new Set());
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchInput('');
    setPage(1);
    setVisible(new Set());
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append('file', compressed, file.name);
        const res = await fetch('/api/notes/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success) {
          setFormImages((prev) => [...prev, json.data]);
        } else {
          alert('上传失败: ' + (json.error || '未知错误'));
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('上传异常: ' + err);
    } finally {
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFormImage = (idx: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== idx));
  };

  /** 图片编辑器保存：上传编辑后的图片并替换对应项 */
  const handleImageEdited = async (dataUrl: string) => {
    if (editingImgIdx === null) return;
    const idx = editingImgIdx;
    setEditingImgIdx(null);
    try {
      const blob = await fetch(dataUrl).then((r) => r.blob());
      const fd = new FormData();
      fd.append('file', blob, 'edited_' + Date.now() + '.png');
      const res = await fetch('/api/notes/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setFormImages((prev) => {
          const next = [...prev];
          next[idx] = json.data;
          return next;
        });
      }
    } catch (err) {
      console.error('Save edited image failed:', err);
    }
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
        await fetch('/api/notes/' + editItem._id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setShowModal(false);
      fetchNotes();
    } catch {
      /* 忽略 */
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setDeleteId(null);
    await fetch('/api/notes/' + id, { method: 'DELETE' });
    fetchNotes();
  };

  const closeLightbox = () => {
    setLightbox(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goImage = (delta: number) => {
    if (!lightbox) return;
    const next = lightbox.idx + delta;
    if (next < 0 || next >= lightbox.images.length) return;
    setLightbox({ ...lightbox, idx: next, url: lightbox.images[next].url });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2) {
      isPinching.current = true;
      pinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchPan.current = { x: pan.x, y: pan.y };
    } else if (e.touches.length === 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pinchPan.current = { x: pan.x, y: pan.y };
    }
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2 && isPinching.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / (pinchDist.current || dist);
      setZoom((z) => Math.max(0.5, Math.min(5, z * scale)));
      pinchDist.current = dist;
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setPan({ x: pinchPan.current.x + dx, y: pinchPan.current.y + dy });
    }
  };

  const handleDetailTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleDetailTouchEnd = (e: React.TouchEvent) => {
    if (!detail?.images) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && detailIdx < detail.images.length - 1) setDetailIdx((i) => i + 1);
      if (diff > 0 && detailIdx > 0) setDetailIdx((i) => i - 1);
    }
  };

  const openLightbox = (note: NoteItem, idx: number) => {
    setLightbox({ url: note.images[idx].url, images: note.images, idx });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-[3px] border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <p className="text-gray-500 mb-4">请先登录</p>
        <a
          href="/login"
          className="inline-block px-6 py-2.5 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
        >
          去登录
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 pb-36 md:pb-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 顶栏 */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <span>📝</span>
            记事本
          </h1>
          <button
            onClick={openAdd}
            className="px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all min-h-[44px] flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新建
          </button>
        </div>

        {/* 搜索 */}
        <form onSubmit={submitSearch} className="mb-4 sm:mb-5">
          <div className="relative group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索记事..."
              className="w-full pl-11 pr-11 py-3 glass-card rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
                aria-label="清除搜索"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* 列表 */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-[3px] border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 mb-4">
              <svg className="w-9 h-9 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-1">{searchTerm ? '没有找到匹配的记事' : '还没有记事'}</p>
            <p className="text-gray-400 text-sm mb-5">{searchTerm ? '试试其他关键词吧' : '点击右上角创建第一条'}</p>
            {!searchTerm && (
              <button
                onClick={openAdd}
                className="px-5 py-2.5 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                创建第一条记事
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                共 {total} 条
                {searchTerm && <span className="ml-1 text-gray-400">· 搜索「{searchTerm}」</span>}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note, idx) => {
                const isVisible = visible.has(note._id);
                const hasImages = note.images && note.images.length > 0;
                const tallImages = hasImages && note.images.length >= 2;
                return (
                  <div
                    key={note._id}
                    ref={(el) => registerCard(note._id, el)}
                    data-id={note._id}
                    className={
                      'transition-all duration-700 ease-out ' +
                      (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')
                    }
                    style={{ transitionDelay: Math.min(idx * 60, 420) + 'ms' }}
                  >
                    <div
                      onClick={() => { setDetail(note); setDetailIdx(0); }}
                      className="glass-card glass-hover rounded-2xl overflow-hidden cursor-pointer group relative"
                    >
                      {/* 顶部强调色细条 */}
                      <div className="h-1 w-full" style={{ backgroundColor: accentOf(idx) }} />

                      {hasImages && (
                        <div className={'relative overflow-hidden ' + (tallImages ? 'h-44 sm:h-52' : 'h-36 sm:h-40')}>
                          <div className="flex h-full">
                            {note.images.slice(0, 3).map((img, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); openLightbox(note, i); }}
                                className={
                                  (note.images.length === 1
                                    ? 'w-full'
                                    : note.images.length === 2
                                      ? 'w-1/2'
                                      : i === 0
                                        ? 'w-1/2'
                                        : 'w-1/4') + ' overflow-hidden group/img'
                                }
                              >
                                <img
                                  src={img.thumbUrl || img.url}
                                  alt=""
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                />
                                {i === 2 && note.images.length > 3 && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">
                                    +{note.images.length - 3}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        {note.title && (
                          <h3 className="font-bold text-sm sm:text-base text-gray-800 truncate flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentOf(idx) }} />
                            {note.title}
                          </h3>
                        )}
                        {note.content && (
                          <p className={'text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-3' + (note.title ? ' mt-1.5' : '')}>
                            {note.content}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(note.createdAt)}
                          </span>
                          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(note); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              aria-label="编辑"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteId(note._id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label="删除"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 disabled:opacity-40 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-sm transition-all flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  上一页
                </button>
                <span className="text-sm font-medium text-gray-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 disabled:opacity-40 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-sm transition-all flex items-center gap-1"
                >
                  下一页
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 悬浮新增按钮（与收入页 FAB 一致） */}
      <button
        onClick={openAdd}
        aria-label="新建记事"
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-12 h-12 text-white rounded-full hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-lg shadow-emerald-500/40"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 新建 / 编辑弹窗 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3.5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">{editItem ? '✏️' : '📝'}</span>
                {editItem ? '编辑记事' : '新建记事'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">标题</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="给记事起个标题（选填）"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">内容</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="写点什么..."
                  rows={5}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">图片</label>
                {formImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formImages.map((img, i) => (
                      <div key={i} className="relative group/image">
                        <img
                          src={img.thumbUrl || img.url}
                          alt=""
                          className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                          onError={(e) => {
                            const el = e.currentTarget;
                            if (el.src.includes('thumb')) el.src = el.src.replace('thumb_', '');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditingImgIdx(i)}
                          className="absolute top-1 left-1 z-10 w-6 h-6 bg-emerald-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm hover:scale-105"
                          aria-label="编辑图片"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFormImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm hover:scale-105"
                          aria-label="移除图片"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {uploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        添加图片
                      </>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                  {formImages.length > 0 && <span className="text-xs text-gray-400">{formImages.length} 张</span>}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 disabled:opacity-50 transition-all text-sm"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      保存中...
                    </span>
                  ) : editItem ? (
                    '保存修改'
                  ) : (
                    '创建记事'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 图片编辑器：整个页面只挂载这一次 */}
      {editingImgIdx !== null && formImages[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={formImages[editingImgIdx].url}
          onSave={handleImageEdited}
          onClose={() => setEditingImgIdx(null)}
        />
      )}

      {/* 删除确认 */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setDeleteId(null)}
        >
          <div className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">确认删除</h3>
              <p className="text-sm text-gray-500 mb-5">删除后就找不回来了哦</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => confirmDelete(deleteId)}
                  className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors text-sm"
                >
                  确定删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 详情页 */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto" onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="min-h-screen">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setDetail(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-500">{fullDate(detail.createdAt)}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const shareUrl = window.location.origin + '/share/' + detail._id;
                    if (typeof navigator.share === 'function') {
                      navigator.share({ title: detail.title || '', text: detail.content || '', url: shareUrl }).catch(() => {});
                    } else {
                      navigator.clipboard
                        .writeText(shareUrl)
                        .then(() => alert('分享链接已复制'))
                        .catch(() => prompt('复制链接：', shareUrl));
                    }
                  }}
                  className="p-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  aria-label="分享"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setDetail(null); openEdit(detail); }}
                  className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  aria-label="编辑"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setDetail(null); setDeleteId(detail._id); }}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="删除"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {detail.images && detail.images.length > 0 && (
              <div className="relative bg-gray-50">
                <div className="flex overflow-x-hidden" onTouchStart={handleDetailTouchStart} onTouchEnd={handleDetailTouchEnd}>
                  {detail.images.map((img, i) => (
                    <div
                      key={i}
                      className="w-full shrink-0 transition-transform duration-300"
                      style={{ transform: 'translateX(-' + detailIdx * 100 + '%)' }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full object-contain max-h-[70vh] cursor-zoom-in"
                        onClick={(e) => { e.stopPropagation(); openLightbox(detail, i); }}
                      />
                    </div>
                  ))}
                </div>

                {detail.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {detail.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setDetailIdx(i); }}
                        className={'h-2 rounded-full transition-all ' + (i === detailIdx ? 'bg-emerald-500 w-5' : 'bg-gray-300 w-2')}
                        aria-label={'第 ' + (i + 1) + ' 张'}
                      />
                    ))}
                  </div>
                )}

                {detailIdx > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailIdx((i) => i - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                    aria-label="上一张"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {detailIdx < detail.images.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailIdx((i) => i + 1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                    aria-label="下一张"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="px-5 py-5 max-w-3xl mx-auto">
              {detail.title && <h1 className="text-lg font-bold text-gray-900 mb-2">{detail.title}</h1>}
              {detail.content && (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detail.content}</p>
              )}
              {!detail.title && !detail.content && <p className="text-sm text-gray-400 italic">暂无文字内容</p>}
            </div>

            <div className="h-8" />
          </div>
        </div>
      )}

      {/* 图片灯箱 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center touch-none select-none"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {lightbox.images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-white text-xs font-medium">
              {lightbox.idx + 1} / {lightbox.images.length}
            </div>
          )}

          {lightbox.idx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goImage(-1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
              aria-label="上一张"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {lightbox.idx < lightbox.images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goImage(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
              aria-label="下一张"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/15 backdrop-blur rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, z - 0.5)); }}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              aria-label="缩小"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(5, z + 0.5)); }}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              aria-label="放大"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="ml-2 px-3 py-1 text-xs text-white/70 hover:text-white bg-white/20 rounded-full hover:bg-white/40 transition-colors"
            >
              重置
            </button>
          </div>

          <img
            src={lightbox.url}
            alt=""
            className="max-w-[92vw] max-h-[90vh] object-contain cursor-grab active:cursor-grabbing rounded-2xl shadow-2xl"
            style={{ transform: 'scale(' + zoom + ') translate(' + pan.x / zoom + 'px,' + pan.y / zoom + 'px)' }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={() => { isPinching.current = false; }}
          />
        </div>
      )}
    </div>
  );
}
