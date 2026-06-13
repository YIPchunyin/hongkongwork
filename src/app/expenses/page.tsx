'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ImageViewer from '@/components/ImageViewer';

interface ExpenseItem {
  _id: string;
  billDate: string;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  imageUrl: string;
  status: string;
  project: string;
  createdAt: string;
}

interface Stats {
  totalAmount: number;
  totalCount: number;
  byCategory: Record<string, { count: number; total: number }>;
}

const categoryEmoji: Record<string, string> = {
  '餐饮': '🍽️',
  '交通': '🚗',
  '购物': '🛍️',
  '医疗': '💊',
  '娱乐': '🎃',
  '居住': '🏔',
  '通讯': '📫',
  '教育': '📎',
  '其他': '📫',
};

const categoryColors: Record<string, string> = {
  '餐饮': 'bg-orange-100 text-orange-700 border-orange-200',
  '交通': 'bg-blue-100 text-blue-700 border-blue-200',
  '购物': 'bg-pink-100 text-pink-700 border-pink-200',
  '医疗': 'bg-red-100 text-red-700 border-red-200',
  '娱乐': 'bg-purple-100 text-purple-700 border-purple-200',
  '居住': 'bg-green-100 text-green-700 border-green-200',
  '通讯': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '教育': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '其他': 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewCount, setReviewCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseItem | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formMerchant, setFormMerchant] = useState("");
  const [formCategory, setFormCategory] = useState("其他");
  const [formDesc, setFormDesc] = useState("");
  const [formBillDate, setFormBillDate] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formProject, setFormProject] = useState("");
  const [saving, setSaving] = useState(false);

  // Lightbox state
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const lastPinchDist = useRef(0);
  const lastPan = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = `${year}年${String(month).padStart(2, "0")}月`;

  const fetchExpenses = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/expenses?month=${monthKey}&status=${statusFilter}&page=${page}&limit=100`);
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data.items);
        setStats(json.data.stats);
        setReviewCount(json.data.reviewCount || 0);
        setPendingCount(json.data.pendingCount || 0);
        setProcessingCount(json.data.processingCount || 0);
      }
    } catch {} finally { setFetching(false); }
  }, [monthKey, statusFilter, page]);

  useEffect(() => { if (user) fetchExpenses(); }, [user, fetchExpenses]);

  // Auto-refresh & trigger recognition when there are pending/processing items
  useEffect(() => {
    if (!user) return;
    const hasPending = pendingCount > 0 || processingCount > 0;
    if (!hasPending) return;
    const t = setInterval(() => {
      // Trigger background recognition for pending items
      fetch('/api/expenses/recognize', { method: 'POST' }).catch(() => {});
      // Refresh data
      fetchExpenses();
    }, 5000);
    return () => clearInterval(t);
  }, [user, pendingCount, processingCount, fetchExpenses]);

  const deleteExpense = async (id: string) => {
    if (!confirm('删除这条记录？')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };


  const openAdd = () => {
    setEditItem(null);
    setFormAmount("");
    setFormMerchant("");
    setFormCategory("其他");
    setFormDesc("");
    setFormBillDate(new Date().toISOString().split("T")[0]);
    setFormNote("");
    setShowModal(true);
  };

  const openEdit = (item: ExpenseItem) => {
    setEditItem(item);
    setFormAmount(String(item.amount));
    setFormMerchant(item.merchant || "");
    setFormCategory(item.category || "其他");
    setFormDesc(item.description || "");
    setFormBillDate(item.billDate || "");
    setFormNote("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBillDate || !formAmount) { alert("请填写日期和金额"); return; }
    setSaving(true);
    try {
      const body = { amount: parseFloat(formAmount), merchant: formMerchant, category: formCategory, description: formDesc, billDate: formBillDate, userNote: formNote, status: "confirmed" };
      const url = editItem ? "/api/expenses/" + editItem._id : "/api/expenses";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { setShowModal(false); fetchExpenses(); }
      else { alert(json.error || "保存澶辫触"); }
    } catch { alert("保存澶辫触"); } finally { setSaving(false); }
  };

    const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: m, label: `${m}月` };
  });
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  // Lightbox handlers
  const openLightbox = (url: string) => {
    setLightboxImg(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const closeLightbox = () => setLightboxImg(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(5, z - e.deltaY * 0.01)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPan.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setZoom((z) => Math.max(0.5, Math.min(5, z * (dist / lastPinchDist.current))));
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && zoom > 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setPan({ x: lastPan.current.x + dx, y: lastPan.current.y + dy });
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
  };

  if (!loading && !user) return <div className="text-center py-20 text-gray-500">璇峰厛鐧诲綍</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">杂费统计</h1>
        <div className="flex gap-2">
          <Link href="/expenses/upload" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors min-h-[44px] inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            上传单据
          </Link>
          <Link href="/expenses/review" className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            待审核 {(reviewCount + pendingCount > 0) ? '(' + (reviewCount + pendingCount) + ')' : ''}
          </Link>
        </div>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">馃搮 月份</span>
          <select
            value={year}
            onChange={(e) => { setYear(parseInt(e.target.value)); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {years.map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select
            value={month}
            onChange={(e) => { setMonth(parseInt(e.target.value)); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <span className="text-lg font-bold text-gray-800 ml-auto">{monthLabel}</span>
        </div>
      </div>

      {/* Status tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-4 flex gap-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={
            'flex-1 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px] ' +
            (statusFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50')
          }
        >全部 {reviewCount + pendingCount > 0 && <span className="ml-1 text-xs opacity-70">({reviewCount + pendingCount})</span>}</button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={
            'flex-1 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px] ' +
            (statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50')
          }
        >待审核{pendingCount > 0 && <span className="ml-1 text-xs opacity-70">({pendingCount})</span>}</button>
        <button
          onClick={() => setStatusFilter('confirmed')}
          className={
            'flex-1 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px] ' +
            (statusFilter === 'confirmed' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50')
          }
        >已确认</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 shadow-sm">
            <p className="text-xs text-blue-500 font-medium">{monthLabel} 总金额</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">HK$ {stats.totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200 shadow-sm">
            <p className="text-xs text-purple-500 font-medium">{monthLabel} 总笔数</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{stats.totalCount} 绗</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200 shadow-sm">
            <p className="text-xs text-green-500 font-medium">分类鏁</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1">{Object.keys(stats.byCategory).length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200 shadow-sm">
            <p className="text-xs text-amber-500 font-medium">平均每笔瑪</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
              HK$ {stats.totalCount > 0 ? (stats.totalAmount / stats.totalCount).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {stats && Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">馃搳 {monthLabel} 分类姹囨€</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {Object.entries(stats.byCategory).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">{categoryEmoji[cat] || '📫'} {cat}</p>
                  <p className="text-xs text-gray-400">{data.count} 绗</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">HK$ {data.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Copy for boss report */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">馃搵 鑰佹澘姹囨姤鏂囨锛堢偣鍑诲鍒讹級</p>
            <p
              className="text-sm text-gray-800 cursor-pointer hover:text-blue-600"
              onClick={() => {
                const text = monthLabel + "杂费汇报：\n总支出：HK$ " + stats.totalAmount.toFixed(2) + "（" + stats.totalCount + " 笔）\n" + Object.entries(stats.byCategory).map(function(e) { var cat = e[0]; var d = e[1]; return (categoryEmoji[cat] || "📫") + " " + cat + "：HK$ " + d.total.toFixed(2) + "（" + d.count + " 笔）"; }).join("\n") + "";
                navigator.clipboard.writeText(text);
                alert('已复制到剪贴板！');
              }}
            >
              📋 点击复制月报摘要
            </p>
          </div>
        </div>
      )}

      {/* Expense card grid */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <p className="text-gray-400">{monthLabel} 娌℃湁宸茬‘璁ょ殑璐﹀崟</p>
          <Link href="/expenses/upload" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:text-blue-700">
            上传鏂板崟鎹?鈫?
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {expenses.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Thumbnail */}
              {item.imageUrl ? (
                <div
                  className="relative aspect-[4/3] bg-gray-100 cursor-pointer overflow-hidden"
                  onClick={() => openLightbox(item.imageUrl)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.merchant || '单据'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                  <span className="text-3xl opacity-30">{categoryEmoji[item.category] || '📫'}</span>
                </div>
              )}

              {/* Card content */}
              <div className="p-3">
                {/* Category badge */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + (categoryColors[item.category] || "bg-gray-100 text-gray-700 border-gray-200")}>
                    {categoryEmoji[item.category] || ''} {item.category}
                  </span>
                  {(item.status === 'pending' || item.status === 'processing') && (
                    item.status === "processing" ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />识别中</span> : <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">待识别</span>
                  )}
                  {item.status === 'recognized' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">待审核</span>
                  )}
                </div>

                {/* Amount */}
                <p className="text-lg font-bold text-blue-600">HK$ {item.amount.toFixed(2)}</p>

                {/* Merchant */}
                <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{item.merchant || "未填写"}</p>
                {item.project && <p className="text-[10px] text-gray-400 mt-0.5 truncate">\馃彈\uFE0F {item.project}</p>}

                {/* Date */}
                <p className="text-xs text-gray-400 mt-1">
                  {item.billDate || new Date(item.createdAt).toLocaleDateString('zh-HK')}
                </p>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                    className="text-xs text-blue-400 hover:text-blue-600 transition-colors flex items-center gap-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    编辑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteExpense(item._id); }}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editItem ? '编辑杂费单' : '➕ 新增杂费'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">日期</label>
                <input type="date" value={formBillDate} onChange={(e) => setFormBillDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">閲戦 (HKD)</label>
                <input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">商户</label>
                <input type="text" value={formMerchant} onChange={(e) => setFormMerchant(e.target.value)} placeholder="商户名称" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">分类</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  list="cat-suggestions"
                  placeholder="宸ュ叿銆佷氦閫氥€佸叾浠?.."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                <datalist id="cat-suggestions">
                  <option value="宸ュ叿" />
                  <option value="交通" />
                  <option value="其他" />
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
                <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="备注淇℃伅" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">取消</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">{saving ? '保存中..' : (editItem ? '保存修改' : '娣诲姞记录')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Image Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center touch-none select-none"
          onClick={closeLightbox}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={closeLightbox}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Zoom controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/20 backdrop-blur rounded-full px-4 py-2">
            <button
              onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, z - 0.5)); }}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
            </button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(5, z + 0.5)); }}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="ml-2 px-3 py-1 text-xs text-white/80 hover:text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              閲嶇疆
            </button>
          </div>

          {/* Image */}
          <img
            src={lightboxImg}
            alt="单据大图"
            className="max-w-[95vw] max-h-[95vh] object-contain cursor-grab active:cursor-grabbing transition-transform duration-100"
            style={{
              transform: "scale(" + zoom + ") translate(" + (pan.x / zoom) + "px, " + (pan.y / zoom) + "px)",
            }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}


