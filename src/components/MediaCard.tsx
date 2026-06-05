'use client';

import { useState, useRef, useEffect } from 'react';
import { MediaItem } from '@/lib/types';

interface MediaCardProps {
  media: MediaItem;
  onTagClick?: (tag: string) => void;
  onDelete?: (media: MediaItem) => void;
}

export default function MediaCard({ media, onTagClick, onDelete }: MediaCardProps) {
  const isVideo = media.type === 'video';
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDelete = () => {
    onDelete?.(media);
    setMenuOpen(false);
    setConfirming(false);
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]">
      {/* Media Preview */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
        {isVideo ? (
          <div className="relative w-full h-full">
            {media.thumbnailUrl ? (
              <img
                src={media.thumbnailUrl}
                alt={media.title}
                className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {media.duration && media.duration > 0 && (
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur">
                {formatDuration(media.duration)}
              </span>
            )}
          </div>
        ) : (
          <img
            src={media.thumbnailUrl || media.url}
            alt={media.title}
            className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}

        {/* Type badge */}
        <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-md font-medium backdrop-blur ${
          isVideo ? 'bg-purple-500/90 text-white' : 'bg-blue-500/90 text-white'
        }`}>
          {isVideo ? '视频' : '图片'}
        </span>

        {/* Delete menu */}
        {onDelete && (
          <div ref={menuRef} className="absolute top-2 right-2">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setConfirming(false); }}
              className={`w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-all active:scale-90 ${
                menuOpen ? 'opacity-100 shadow-md' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{ touchAction: 'manipulation' }}
              title="更多操作"
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px] z-10">
                {!confirming ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 min-h-[44px] active:bg-red-50"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500 mb-2">确定删除？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700 min-h-[36px]"
                      >
                        删除
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirming(false); setMenuOpen(false); }}
                        className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 min-h-[36px]"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-800 truncate" title={media.title}>
          {media.title}
        </h3>
        {media.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{media.description}</p>
        )}
        {media.tags && media.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {media.tags.map((tag, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[28px]"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>{formatFileSize(media.size)}</span>
          {media.width && media.height ? (
            <span>{media.width}×{media.height}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
