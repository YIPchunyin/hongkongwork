'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface IncomeItem {
  _id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
  shift: string;
  hours: number;
  industry: string;
  company: string;
}

interface Stats {
  totalIncome: number;
  totalHours: number;
  totalRecords: number;
  industries: string[];
  companies: string[];
  industryTotals: Record<string, number>;
  companyTotals: Record<string, number>;
  shiftTotals: Record<string, number>;
  categoryTotals: Record<string, number>;
  monthlyTotals: Record<string, number>;
}

  const chartColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
  const chartBgColors = chartColors.map(c => c + '33');

export default function IncomePage() {
  const { user, loading } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<IncomeItem | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('地盘');
  const [formNote, setFormNote] = useState('');
  const [formShift, setFormShift] = useState('早班');
  const [formHours, setFormHours] = useState('');
  const [formIndustry, setFormIndustry] = useState('地盘');
  const [formCompany, setFormCompany] = useState('国益');
  const [saving, setSaving] = useState(false);

  const monthKey = year + '-' + String(month).padStart(2, '0');
  const monthLabel = year + '\u5e74' + String(month).padStart(2, '0') + '\u6708';

  const fetchIncomes = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/income?year=' + (year || '') + '&month=' + (month ? String(month) : '') + '&page=' + page + '&limit=100');
      const json = await res.json();
      if (json.success) {
        setIncomes(json.data.items);
        setStats(json.data.stats);
      }
    } catch {} finally { setFetching(false); }
  }, [year, month, page]);

  useEffect(() => { if (user) fetchIncomes(); }, [user, fetchIncomes]);

  const openAdd = () => {
    setEditItem(null);
    setFormDate(new Date().toISOString().slice(0, 16).replace('T', ' '));
    setFormAmount('');
    setFormCategory('地盘');
    setFormNote('');
    setFormShift('早班');
    setFormHours('');
    setFormIndustry('地盘');
    setFormCompany('国益');
    setShowModal(true);
  };

  const openEdit = (item: IncomeItem) => {
    setEditItem(item);
    setFormDate(item.date);
    setFormAmount(String(item.amount));
    setFormCategory(item.category);
    setFormNote(item.note);
    setFormShift(item.shift);
    setFormHours(String(item.hours));
    setFormIndustry(item.industry);
    setFormCompany(item.company);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formAmount) { alert('请填写日期和金额'); return; }
    setSaving(true);
    try {
      const body = {
        date: formDate, amount: parseFloat(formAmount),
        category: formCategory, note: formNote,
        shift: formShift, hours: formHours ? parseFloat(formHours) : 0,
        industry: formIndustry, company: formCompany,
      };
      let res;
      if (editItem) {
        res = await fetch('/api/income/' + editItem._id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchIncomes();
      } else {
        alert(json.error || '保存失败');
      }
    } catch { alert('保存失败'); }
    finally { setSaving(false); }
  };

  const deleteIncome = async (id: string) => {
    if (!confirm('\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u6536\u5165\u8bb0\u5f55\uff1f')) return;
    try {
      const res = await fetch('/api/income/' + id, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchIncomes();
      else alert(json.error || '删除失败');
    } catch { alert('删除失败'); }
  };

  // Month navigation
  const prevMonth = () => { if (month === null) return; if (month === 1) { setYear(year - 1); setMonth(12); } else { setMonth(month - 1); } setPage(1); };
  const nextMonth = () => { if (month === null) return; if (month === 12) { setYear(year + 1); setMonth(1); } else { setMonth(month + 1); } setPage(1); };

  if (!loading && !user) return <div className="text-center py-20 text-gray-500">请先登录</div>;

  const statCards = stats ? [
    { label: monthLabel + ' 收入', value: 'HK$ ' + stats.totalIncome.toFixed(2), color: 'text-green-600' },
    { label: monthLabel + ' 工时', value: stats.totalHours.toFixed(1) + ' h', color: 'text-blue-600' },
    { label: monthLabel + ' 笔数', value: stats.totalRecords + ' 笔', color: 'text-gray-800' },
    { label: '时薪', value: stats.totalHours > 0 ? 'HK$ ' + (stats.totalIncome / stats.totalHours).toFixed(2) : '-', color: 'text-purple-600' },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">收入记录</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors min-h-[44px] inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新增收入
        </button>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-bold text-gray-800">{monthLabel}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={'text-2xl font-bold mt-1 ' + card.color}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts & Analysis */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Monthly Trend */}
          {Object.keys(stats.monthlyTotals).length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">月度收入趋势</h3>
              <Bar data={{
                labels: Object.keys(stats.monthlyTotals).sort(),
                datasets: [{ label: '收入 (HK$)', data: Object.keys(stats.monthlyTotals).sort().map(m => stats.monthlyTotals[m]), backgroundColor: '#10B98133', borderColor: '#10B981', borderWidth: 2, borderRadius: 4 }]
              }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v } } } }} />
            </div>
          )}

          {/* Industry Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">行业分布</h3>
            {Object.keys(stats.industryTotals).length > 0 && (
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 flex-shrink-0">
                  <Doughnut data={{
                    labels: Object.keys(stats.industryTotals),
                    datasets: [{ data: Object.values(stats.industryTotals), backgroundColor: chartColors.slice(0, Object.keys(stats.industryTotals).length), borderWidth: 0 }]
                  }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div className="flex-1 space-y-2">
                  {Object.entries(stats.industryTotals).sort((a: any, b: any) => b[1] - a[1]).map(([ind, total], i) => (
                    <div key={ind} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                        <span className="text-gray-600">{ind}</span>
                      </div>
                      <span className="font-medium text-gray-800">HK$ {Number(total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Company Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">公司收入</h3>
            {Object.keys(stats.companyTotals).sort().map((com, i) => {
              const amt = stats.companyTotals[com];
              const pct = stats.totalIncome > 0 ? (amt / stats.totalIncome * 100) : 0;
              return (
                <div key={com} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{com}</span>
                    <span className="font-medium">HK$ {amt.toFixed(2)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: pct.toFixed(1) + '%', backgroundColor: chartColors[i % chartColors.length] }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shift Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">班次分析</h3>
            {Object.keys(stats.shiftTotals).length > 0 && (
              <div className="space-y-2">
                {Object.entries(stats.shiftTotals).sort((a: any, b: any) => b[1] - a[1]).map(([sh, total], i) => (
                  <div key={sh} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                      <span className="text-sm text-gray-600">{sh}</span>
                    </div>
                    <span className="text-sm font-medium">HK$ {Number(total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Income list */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : incomes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">{monthLabel} 没有收入记录</p>
          <button onClick={openAdd} className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium">新增第一条 →</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {incomes.map((item) => (
              <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ' + (item.industry === '地盘' ? 'bg-blue-500' : item.industry === '酒楼' ? 'bg-orange-500' : 'bg-gray-400')}>
                    {item.industry === '地盘' ? '地' : item.industry === '酒楼' ? '酒' : item.industry === '补贴' ? '补' : '其'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{item.category || "未分类"}</span>
                      {item.shift ? <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.shift}</span> : null}
                      {item.company ? <span className="text-xs text-gray-400">{item.company}</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.date}
                      {item.hours > 0 ? ' · ' + item.hours.toFixed(1) + 'h' : ''}
                      {item.note ? ' · ' + item.note : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-green-600">HK$ {item.amount.toFixed(2)}</p>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => openEdit(item)} className="text-xs text-blue-400 hover:text-blue-600">编辑</button>
                      <button onClick={() => deleteIncome(item._id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editItem ? '编辑收入' : '新增收入'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期时间</label>
                <input type="datetime-local" value={formDate.replace(' ', 'T')} onChange={e => setFormDate(e.target.value.replace('T', ' '))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额 (HK$)</label>
                  <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工时 (小时)</label>
                  <input type="number" step="0.5" value={formHours} onChange={e => setFormHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行业</label>
                  <select value={formIndustry} onChange={e => setFormIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>地盘</option>
                    <option>酒楼</option>
                    <option>补贴</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                  <select value={formCompany} onChange={e => setFormCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>国益</option>
                    <option>煌府</option>
                    <option>益哥</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">二级分类</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>地盘</option>
                    <option>其他</option>
                    <option>补贴</option>
                    <option>半工地盤</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班次</label>
                  <select value={formShift} onChange={e => setFormShift(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>早班</option>
                    <option>晚班</option>
                    <option>半工</option>
                    <option>日班</option>
                    <option>补贴</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="选填"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {saving ? '保存中...' : (editItem ? '保存修改' : '添加记录')}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
