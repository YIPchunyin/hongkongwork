'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MediaGrid from '@/components/MediaGrid';
import { MediaItem } from '@/lib/types';

export default function GalleryPage() {
  const router = useRouter();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  const fetchMedia = useCallback(async (currentPage: number, type: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
      if (type !== 'all') {
        params.set('type', type);
      }
      const res = await fetch('/api/media?' + params.toString());
      const data = await res.json();
      if (data.success) {
        if (currentPage === 1) {
          setMediaList(data.data.items);
        } else {
          setMediaList((prev) => [...prev, ...data.data.items]);
        }
        setTotalPages(data.data.totalPages);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchMedia(1, filterType);
  }, [filterType, fetchMedia]);

  const handleTagClick = useCallback((tag: string) => {
    router.push('/search?q=' + encodeURIComponent(tag));
  }, [router]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia(nextPage, filterType);
  };

  const handleDelete = useCallback(async (media: MediaItem) => {
    try {
      const res = await fetch('/api/media/' + media._id, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((m) => m._id !== media._id));
      }
    } catch {}
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold apple-text-primary">画廊</h1>
          <p className="apple-text-secondary text-sm mt-1">浏览所有上传的图片和视频</p>
        </div>
        <div className="flex gap-2 animate-fade-in-up-d1">
          {[
            { value: 'all' as const, label: '全部' },
            { value: 'image' as const, label: '图片' },
            { value: 'video' as const, label: '视频' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value)}
              className={'px-4 py-2 rounded-xl text-sm font-medium transition-all ' + (
                filterType === filter.value
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : 'apple-card text-gray-600 hover:bg-gray-50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in-up-d2">
        <MediaGrid items={mediaList} loading={loading} onTagClick={handleTagClick} onDelete={handleDelete} />
      </div>

      {!loading && page < totalPages && (
        <div className="mt-8 text-center animate-fade-in-up">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 apple-card text-gray-700 font-medium rounded-xl hover:shadow-md transition-all active:scale-[0.97]"
          >
            加载更多
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div className="mt-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
