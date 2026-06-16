'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface ReviewItem {
  _id: string;
  fileName: string;
  imageUrl: string;
  amount: number;
  merchant: string;
  category: string;
  billDate: string;
  description: string;
  status: string;
  aiRaw: string;
}

export default function ReviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedUpdate = (id: string, field: string, value: string | number) => {
    const key = id + "_" + field;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      updateItem(id, field, value);
    }, 500);
  };

  useEffect(() => {
    if (user) fetchReviewItems();
  }, [user]);

  const fetchReviewItems = async () => {
    try {
      const res = await fetch('/api/expenses/review');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch {} finally { setFetching(false); }
  };

  const updateItem = async (id: string, field: string, value: string | number) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    const json = await res.json();
    if (json.success) {
      setItems((prev) => prev.map((item) => item._id === id ? { ...item, ...json.data } : item));
    }
  };

  const confirmItem = async (id: string) => {
    await updateItem(id, 'status', 'confirmed');
  };

  const deleteItem = async (id: string) => {
    if (!confirm('删除这条记录？')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

    const confirmAll = async () => {
    setConfirming(true);
    try {
      const unconfirmedIds = items.filter((i) => i.status !== "confirmed").map((i) => i._id);
      if (unconfirmedIds.length === 0) { setConfirming(false); return; }
      const res = await fetch("/api/expenses/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unconfirmedIds }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.map((i) => ({ ...i, status: "confirmed" })));
        alert(json.message || `已确认 ${json.data.modifiedCount} 张单据`);
      } else {
        alert(json.error || "批量确认失败");
      }
    } catch {
      alert("网络错误，请重试");
    } finally {
      setConfirming(false);
    }
  };

  const categories = ['餐饮', '交通', '购物', '医疗', '娱乐', '居住', '通讯', '教育', '其他'];

  if (!loading && !user) { router.push('/login'); return null; }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">审核杂费单</h1>
          <p className="text-sm text-gray-500 mt-1">查看原图，确认 AI 识别结果</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/expenses/upload')} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
            + 上传
          </button>
          {items.length > 0 && (
            <button onClick={confirmAll} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors min-h-[44px]">
              全部确认
            </button>
          )}
        </div>
      </div>

      {fetching ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">没有待审核的账单</p>
          <button onClick={() => router.push('/expenses/upload')} className="mt-2 text-sm text-blue-600 hover:text-blue-700">
            上传新单据 →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Image + Info side by side */}
              <div className="flex flex-col sm:flex-row">
                {/* Original image */}
                <div
                  className="sm:w-48 sm:h-48 bg-gray-100 flex-shrink-0 cursor-pointer relative group"
                  onClick={() => setExpandedImg(expandedImg === item.imageUrl ? null : item.imageUrl)}
                >
                  <img src={item.imageUrl} alt={item.fileName} className="w-full h-48 sm:h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      点击查看大图
                    </span>
                  </div>
                </div>

                {/* Edit fields */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">商户</label>
                      <input
                        type="text" value={item.merchant}
                        onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((it) => it._id === item._id ? { ...it, merchant: v } : it)); debouncedUpdate(item._id, 'merchant', v); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">金额 (HK$)</label>
                      <input
                        type="number" step="0.01" value={item.amount}
                        onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((it) => it._id === item._id ? { ...it, amount: parseFloat(v) || 0 } : it)); debouncedUpdate(item._id, 'amount', parseFloat(v) || 0); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">日期</label>
                      <input
                        type="date" value={item.billDate}
                        onChange={(e) => updateItem(item._id, 'billDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">分类</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(item._id, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-0.5">备注</label>
                    <input
                      type="text" value={item.description}
                      onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((it) => it._id === item._id ? { ...it, description: v } : it)); debouncedUpdate(item._id, 'description', v); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="消费内容备注"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {item.status !== 'confirmed' ? (
                      <button
                        onClick={() => confirmItem(item._id)}
                        className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✓ 确认无误
                      </button>
                    ) : (
                      <div className="flex-1 py-2 text-green-600 text-sm font-medium text-center bg-green-50 rounded-lg">
                        ✓ 已确认
                      </div>
                    )}
                    <button
                      onClick={() => deleteItem(item._id)}
                      className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Bulk confirm */}
          {items.filter((i) => i.status !== 'confirmed').length > 0 && (
            <div className="text-center pt-2">
              <button onClick={confirmAll} disabled={confirming} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {confirming ? "确认中..." : "确认全部"} ({items.filter((i) => i.status !== 'confirmed').length} 条)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image lightbox */}
      {expandedImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setExpandedImg(null)}>
          <img src={expandedImg} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
