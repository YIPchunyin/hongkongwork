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
  confirmed: boolean;
  createdAt: string;
}

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [stats, setStats] = useState({ total: 0, byCategory: {} as Record<string, number>, totalAmount: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterConfirmed, setFilterConfirmed] = useState<string>('true');
  const [fetching, setFetching] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterConfirmed !== 'all') params.set('confirmed', filterConfirmed);

      const res = await fetch(`/api/expenses?${params}`);
      const json = await res.json();

      if (json.success) {
        setExpenses(json.data.items);
        setTotalPages(json.data.totalPages);

        // Calculate stats
        const all: ExpenseItem[] = json.data.items;
        const byCategory: Record<string, number> = {};
        let totalAmount = 0;
        for (const item of all) {
          byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
          totalAmount += item.amount;
        }
        setStats({ total: json.data.total, byCategory, totalAmount });
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  }, [page, filterConfirmed]);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, fetchExpenses]);

  const deleteExpense = async (id: string) => {
    if (!confirm('确定删除这条记录？')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setExpenses((prev) => prev.filter((e) => e._id !== id));
        fetchExpenses();
      }
    } catch {
      // ignore
    }
  };

  if (!loading && !user) {
    return <div className="text-center py-20 text-gray-500">请先登录</div>;
  }

  if (loading) {
    return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">杂费统计</h1>
          <p className="text-gray-500 mt-1">查看和管理你的费用记录</p>
        </div>
        <Link
          href="/expenses/upload"
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-center"
        >
          + 上传新单据
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">总记录</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">总金额</p>
          <p className="text-2xl font-bold text-blue-600">HK$ {stats.totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">分类数</p>
          <p className="text-2xl font-bold text-gray-800">{Object.keys(stats.byCategory).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">平均金额</p>
          <p className="text-2xl font-bold text-purple-600">
            HK$ {stats.total > 0 ? (stats.totalAmount / stats.total).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">分类汇总</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.byCategory).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{cat}</span>
                <span className="text-sm font-semibold text-gray-800">HK$ {amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: '全部' },
          { value: 'true', label: '已确认' },
          { value: 'false', label: '待确认' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilterConfirmed(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterConfirmed === f.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Expense List */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400">暂无账单记录</p>
          <Link href="/expenses/upload" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
            上传第一张单据 →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {expenses.map((item) => (
              <div key={item._id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                        {item.category}
                      </span>
                      {item.confirmed && (
                        <span className="text-xs text-green-500">✓ 已确认</span>
                      )}
                    </div>
                    <p className="mt-1 font-semibold text-gray-800">{item.merchant || '未命名'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.billDate}{item.description ? ` · ${item.description}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-blue-600">HK$ {item.amount.toFixed(2)}</p>
                    <button
                      onClick={() => deleteExpense(item._id)}
                      className="text-xs text-red-400 hover:text-red-600 mt-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium ${
                page === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
