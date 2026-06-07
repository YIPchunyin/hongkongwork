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

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (currentPage === 1) {
          setMediaList(data.data.items);
        } else {
          setMediaList((prev) => [...prev, ...data.data.items]);
        }
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('获取媒体列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchMedia(1, filterType);
  }, [filterType, fetchMedia]);

  const handleTagClick = useCallback((tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  }, [router]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia(nextPage, filterType);
  };

  const handleDelete = useCallback(async (media: MediaItem) => {
    try {
      const res = await fetch(`/api/media/${media._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((m) => m._id !== media._id));
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">画廊</h1>
          <p className="text-gray-500 mt-1">浏览所有上传的图片和视频</p>
        </div>

        {/* 类型筛选 */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'image', label: '图片' },
            { value: 'video', label: '视频' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value as typeof filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === filter.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <MediaGrid items={mediaList} loading={loading} onTagClick={handleTagClick} onDelete={handleDelete} />

      {/* 加载更多 */}
      {!loading && page < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            加载更多
          </button>
        </div>
      )}

      {/* 加载中指示器（加载更多时） */}
      {loading && page > 1 && (
        <div className="mt-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
