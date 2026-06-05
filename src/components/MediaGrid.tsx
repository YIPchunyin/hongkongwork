'use client';

import { MediaItem } from '@/lib/types';
import MediaCard from './MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  loading: boolean;
  onTagClick?: (tag: string) => void;
  onDelete?: (media: MediaItem) => void;
}

export default function MediaGrid({ items, loading, onTagClick, onDelete }: MediaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-xl aspect-square animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400 text-lg">暂无内容</p>
        <p className="text-gray-300 text-sm mt-1">上传你的第一张照片吧</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((media) => (
        <MediaCard
          key={media._id || media.ossKey}
          media={media}
          onTagClick={onTagClick}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
