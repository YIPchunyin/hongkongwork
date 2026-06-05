'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import MediaGrid from '@/components/MediaGrid';
import { MediaItem } from '@/lib/types';

function SearchContent() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popularTags, setPopularTags] = useState<{ name: string; count: number }[]>([]);

  const handleSearch = useCallback(async (searchQuery: string, useTagParam = false) => {
    if (!searchQuery) return;

    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);

    try {
      // 优先用 tag 精准匹配（标签搜索），fallback 为全文模糊搜索
      const params = new URLSearchParams({ limit: '50' });
      if (useTagParam) {
        params.set('tag', searchQuery);
      } else {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.items);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 读取 URL 参数自动搜索
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSearch(q, true); // 从画廊标签跳转来的，用 tag 精准匹配
    }
  }, [searchParams, handleSearch]);

  // 获取热门标签作为搜索建议
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPopularTags(d.data.slice(0, 15));
      })
      .catch(() => {});
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    handleSearch(tag, true); // 卡片内点击标签，用 tag 精准搜索
  }, [handleSearch]);

  const handleDelete = useCallback(async (media: MediaItem) => {
    try {
      const res = await fetch(`/api/media/${media._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResults((prev) => prev.filter((m) => m._id !== media._id));
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">搜索</h1>
        <p className="text-gray-500">通过标题、描述或标签搜索你的媒体文件</p>
      </div>

      {/* 搜索栏 */}
      <div className="max-w-xl mb-8">
        <SearchBar
          onSearch={(q) => handleSearch(q)}
          placeholder="输入关键词搜索，如：旅行、美食、风景..."
          initialValue={query}
        />
      </div>

      {/* 搜索结果 */}
      {searched && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            搜索 &ldquo;{query}&rdquo; — 找到 {results.length} 个结果
          </h2>
          <MediaGrid items={results} loading={loading} onTagClick={handleTagClick} onDelete={handleDelete} />
        </div>
      )}

      {/* 空状态 + 热门标签 */}
      {!searched && !loading && (
        <div>
          {popularTags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">热门标签</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleSearch(tag.name, true)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    {tag.name}
                    <span className="ml-1.5 text-xs text-gray-400">({tag.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center py-12">
            <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-400 text-lg">输入关键词或点击上方标签开始搜索</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="max-w-xl mb-8">
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
