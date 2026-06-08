'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface ExpenseItem {
  _id: string;
  billDate: string;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  imageUrl: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalAmount: number;
  totalCount: number;
  byCategory: Record<string, { count: number; total: number }>;
}

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

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = `${year}年${String(month).padStart(2, '0')}月`;

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
      }
    } catch {} finally { setFetching(false); }
  }, [monthKey, page]);

  useEffect(() => { if (user) fetchExpenses(); }, [user, fetchExpenses]);

  const deleteExpense = async (id: string) => {
    if (!confirm('删除这条记录？')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: m, label: `${m}月` };
  });
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  if (!loading && !user) return <div className="text-center py-20 text-gray-500">请先登录</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">杂费统计</h1>
        <div className="flex gap-2">
          <Link href="/expenses/upload" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors min-h-[44px] inline-flex items-center">
            + 上传单据
          </Link>
          <Link href="/expenses/review" className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] inline-flex items-center">
            待审核
          </Link>
        </div>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">月份</span>
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
          className={'flex-1 py-2 text-sm font-medium rounded-xl transition-colors ' + (statusFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50')}
        >全部 {reviewCount > 0 && <span className="ml-1 text-xs opacity-70">({reviewCount + pendingCount})</span>}</button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={'flex-1 py-2 text-sm font-medium rounded-xl transition-colors ' + (statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50')}
        >待审核 {reviewCount > 0 && <span className="ml-1 text-xs">({reviewCount})</span>}</button>
        <button
          onClick={() => setStatusFilter('confirmed')}
          className={'flex-1 py-2 text-sm font-medium rounded-xl transition-colors ' + (statusFilter === 'confirmed' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50')}
        >已确认</button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">{monthLabel} 总金额</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">HK$ {stats.totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">{monthLabel} 总笔数</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalCount} 笔</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">分类数</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{Object.keys(stats.byCategory).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">平均每笔</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              HK$ {stats.totalCount > 0 ? (stats.totalAmount / stats.totalCount).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {stats && Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{monthLabel} 分类汇总</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {Object.entries(stats.byCategory).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">{cat}</p>
                  <p className="text-xs text-gray-400">{data.count} 笔</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">HK$ {data.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Copy for boss report */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">📋 老板汇报文案（点击复制）</p>
            <p
              className="text-sm text-gray-800 cursor-pointer hover:text-blue-600"
              onClick={() => {
                const text = `${monthLabel}杂费汇报：
总支出：HK$ ${stats.totalAmount.toFixed(2)}（${stats.totalCount} 笔）
${Object.entries(stats.byCategory).map(([cat, d]) => `${cat}：HK$ ${d.total.toFixed(2)}（${d.count} 笔）`).join('\n')}`;
                navigator.clipboard.writeText(text);
                alert('已复制到剪贴板！');
              }}
            >
              📋 点击复制月报摘要
            </p>
          </div>
        </div>
      )}

      {/* Expense list */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">{monthLabel} 没有已确认的账单</p>
          <Link href="/expenses/upload" className="mt-2 inline-block text-sm text-blue-600">上传新单据 →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {expenses.map((item) => (
              <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{item.category}</span>
                    </div>
                    <p className="mt-0.5 font-semibold text-gray-800">{item.merchant || '未命名'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.billDate || '日期未知'}
                      {item.description ? ` · ${item.description}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-blue-600">HK$ {item.amount.toFixed(2)}</p>
                    <button onClick={() => deleteExpense(item._id)} className="text-xs text-red-400 hover:text-red-600 mt-1">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
