'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NoteImage { url: string; thumbUrl?: string; }
interface NoteData { _id: string; title: string; content: string; images: NoteImage[]; createdAt: string; }

export default function ShareView({ id }: { id: string }) {
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    fetch('/api/notes/share/' + id)
      .then(r => r.json())
      .then(j => {
        if (j.success) { setNote(j.data); }
        else { setError(true); }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">这篇记事不存在或已被删除</p>
          <Link href="/" className="text-blue-500 hover:text-blue-600 font-medium text-sm">返回首页</Link>
        </div>
      </div>
    );
  }

  const images = note.images || [];
  const shareUrl = window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title || '分享的记事',
          text: note.content || '',
          url: shareUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('链接已复制到剪贴板');
      } catch {
        prompt('复制链接：', shareUrl);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Images */}
      {images.length > 0 && (
        <div className="relative bg-black max-w-2xl mx-auto">
          <div className="flex overflow-hidden">
            {images.map((img, i) => (
              <div
                key={i}
                className="w-full shrink-0 transition-transform duration-300"
                style={{ transform: 'translateX(-' + (imgIdx * 100) + '%)' }}
              >
                <img src={img.url} alt="" className="w-full object-contain bg-black max-h-[80vh]"
                  onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    const diff = e.changedTouches[0].clientX - touchStart;
                    if (Math.abs(diff) > 50) {
                      if (diff < 0 && imgIdx < images.length - 1) setImgIdx(i => i + 1);
                      if (diff > 0 && imgIdx > 0) setImgIdx(i => i - 1);
                    }
                  }}
                />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={'w-2 h-2 rounded-full transition-all ' + (i === imgIdx ? 'bg-white w-4' : 'bg-white/50')}
                />
              ))}
            </div>
          )}
          {imgIdx > 0 && (
            <button onClick={() => setImgIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {imgIdx < images.length - 1 && (
            <button onClick={() => setImgIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {note.title && <h1 className="text-xl font-bold text-gray-900 mb-3">{note.title}</h1>}
        {note.content && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>}
        {!note.title && !note.content && images.length === 0 && (
          <p className="text-gray-400 text-sm italic">暂无内容</p>
        )}

        {/* Meta */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {note.createdAt ? new Date(note.createdAt).toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              分享
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
