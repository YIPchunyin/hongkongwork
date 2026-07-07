'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import QuickAddCards from '@/components/QuickAddCards';

interface IncomeItem {
  _id: string;
  date: string;
  amount: number;
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
  const router = useRouter();
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
  const [formNote, setFormNote] = useState('');
  const [formShift, setFormShift] = useState('早班');
  const [formHours, setFormHours] = useState('');
  const [formIndustry, setFormIndustry] = useState('地盘');
  const [formCompany, setFormCompany] = useState('国益');
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showAmount, setShowAmount] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const companyColor = (com: string) => {
    const colors: Record<string, string> = {
      '国益': '#D4536A',   // 深粉红 - 纯色
      '煌府': '#3B7DD8',   // 蓝色 - 纯色
      '益哥': '#44A64D',   // 绿色 - 纯色
      '司': '#D97A2E',         // 橙色 - 纯色
    };
    return colors[com] || '#8B5CF6';  // 紫色 - 纯色
  };

  const companyGradient = (com: string) => {
    const grads: Record<string, string> = {
      '国益': 'linear-gradient(135deg, #D4536A, #E8839A)',
      '煌府': 'linear-gradient(135deg, #3B7DD8, #6BA3E8)',
      '益哥': 'linear-gradient(135deg, #44A64D, #7ACC82)',
      '司': 'linear-gradient(135deg, #D97A2E, #E8A86A)',
    };
    return grads[com] || 'linear-gradient(135deg, #8B5CF6, #B794F4)';  // 紫色 - 渐变
  };

  const buildCalendarDays = (yr: number, mo: number, items: IncomeItem[]) => {
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const firstDay = new Date(yr, mo - 1, 1).getDay();
    const dayMap: Record<number, { dateNum: number; total: number; records: IncomeItem[]; companies: string[] }> = {};
    items.forEach(item => {
      if (!item.date) return;
      const d = parseInt(item.date.substring(8, 10));
      if (!dayMap[d]) dayMap[d] = { dateNum: d, total: 0, records: [], companies: [] as string[] };
      dayMap[d].total += item.amount;
      dayMap[d].records.push(item);
      if (item.company && !dayMap[d].companies.includes(item.company)) dayMap[d].companies.push(item.company);
    });
    const weeks: any[][] = [];
    let week: any[] = [];
    for (let i = 0; i < firstDay; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(dayMap[d] || { dateNum: d, total: 0, records: [], companies: [] as string[] });
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
    return weeks;
  };

  const renderShiftGroup = (recs: IncomeItem[]) => {
    const groups: Record<string, number> = {};
    recs.forEach(r => {
      const key = r.company || '其他';
      groups[key] = (groups[key] || 0) + r.amount;
    });
    return Object.entries(groups).map(([com, amt]) => (
      <div key={com} className="flex items-center gap-0.5 text-[9px] sm:text-[10px] leading-tight">
        <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: companyColor(com) }} />
        <span className="font-bold" style={{ color: companyColor(com) }}>+{amt.toFixed(0)}</span>
      </div>
    ));
  };
  const monthKey = month ? year + '-' + String(month).padStart(2, '0') : String(year);
  const monthLabel = month ? year + "年" + String(month).padStart(2, "0") + "月" : year + "年 (全年)";

  const fetchIncomes = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/income?year=' + (year || '') + '&month=' + (month ? String(month) : '') + '&page=' + page + '&limit=50');
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
        note: formNote,
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
    { label: '💰 ' + monthLabel + ' 收入', value: 'HK$ ' + stats.totalIncome.toFixed(2), color: 'text-white' },
    { label: '⏱️ ' + monthLabel + ' 工时', value: stats.totalHours.toFixed(1) + ' h', color: 'text-blue-600' },
    { label: '📋 ' + monthLabel + ' 笔数', value: stats.totalRecords + ' 笔', color: 'text-gray-800' },

  ] : [];

  return (
    <div className="relative h-dvh bg-[#f9fafb] flex flex-col">
      {/* Wave reveal overlay */}
      <div className="fixed inset-0 z-50 bg-[#f9fafb] animate-wave-reveal pointer-events-none" />
      {/* Aurora backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-green-300/20 via-emerald-300/15 to-transparent blur-3xl animate-aurora" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-blue-300/15 via-cyan-300/10 to-transparent blur-3xl animate-aurora-delayed" />
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-300/10 via-pink-300/10 to-transparent blur-3xl animate-aurora-slow" />
      </div>
      <div className="relative z-10 animate-fade-in flex-1 flex flex-col min-h-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-dvh md:h-auto flex flex-col md:block overflow-hidden md:overflow-visible"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchMove={(e) => setTouchEnd(e.touches[0].clientX)}
      onTouchEnd={() => {
        if (touchStart === null || touchEnd === null) return;
        const diff = touchStart - touchEnd;
        if (Math.abs(diff) > 80) {
          if (diff > 0) nextMonth(); else prevMonth();
        }
        setTouchStart(null);
        setTouchEnd(null);
      }}>
      {/* Header */}
      <div className="hidden md:flex md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200/50">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">收入记录</h1>
            <p className="text-xs sm:text-sm text-gray-400">📊 记录每一笔收入 · 轻松掌控财务</p>
          </div>
        </div>

      </div>

      {/* Month selector */}
      <div className="rounded-xl md:rounded-2xl px-2.5 py-1.5 md:p-3 mb-1.5 md:mb-2 shadow-lg bg-gradient-to-r from-green-600 to-emerald-700 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className={'p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90' + (month === null ? ' opacity-30 pointer-events-none' : '')}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-xl font-bold text-white">{monthLabel}</span>
            <button onClick={() => router.push('/income/annual?year=' + year)} className={"text-xs px-2.5 py-1 rounded-full font-medium transition-all " + (month === null ? "bg-green-600 text-white shadow-sm" : "bg-white/20 text-white hover:bg-white/30")}>&#x5168;&#x5e74;</button>

          </div>
          <button onClick={nextMonth} className={'p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90' + (month === null ? ' opacity-30 pointer-events-none' : '')}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="hidden md:flex md:flex-col gap-2 mb-2 sm:mb-3">
          {/* First card full width */}
          {(() => {
            const bgClasses = [
              'bg-gradient-to-r from-green-600 to-emerald-700 text-white',
              'bg-gradient-to-r from-blue-600 to-cyan-700 text-white',
              'bg-gradient-to-r from-purple-600 to-pink-700 text-white',
            ];
            return (
              <>
                <div className="rounded-xl p-3 sm:p-4 shadow-lg card-hover bg-gradient-to-r from-green-600 to-emerald-700 text-white">
                  <p className="text-[10px] sm:text-xs text-white/80 font-medium uppercase tracking-wide">{showAmount ? statCards[0].label : statCards[0].label.replace('收入', '')}</p>
                  <p className="text-lg sm:text-2xl font-black mt-0.5 text-white">{showAmount ? statCards[0].value : '💪 做牛做马中...'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statCards.slice(1).map((card, i) => (
                    <div key={i} className={'rounded-xl p-3 sm:p-4 shadow-lg card-hover ' + bgClasses[i + 1]}>
                      <p className="text-[10px] sm:text-xs text-white/80 font-medium uppercase tracking-wide">{card.label}</p>
                      <p className="text-lg sm:text-2xl font-black mt-0.5 text-white">{card.value}</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Advanced Analytics */}
      <div className="hidden md:block">
      {stats && month && year && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(() => {
            const today = new Date(); const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1; const maxDay = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate(); const totalDays = isCurrentMonth ? today.getDate() - 1 : maxDay;
            const workDates = new Set(incomes.map((i) => i.date?.substring(0, 10)).filter(Boolean));
            const adjustedWorkDays = [...workDates].filter(d => parseInt(d.substring(8)) <= totalDays).length;
            const restDays = Math.max(0, totalDays - adjustedWorkDays);
            const workRate = totalDays > 0 ? (adjustedWorkDays / totalDays * 100).toFixed(0) : '0';
            const dailyTotals: Record<string, number> = {};
            incomes.forEach((i) => {
              const key = i.date?.substring(0, 10);
              if (key) dailyTotals[key] = (dailyTotals[key] || 0) + i.amount;
            });
            return <>
              <div className="rounded-xl p-3 shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                <p className="text-[10px] text-white/80 font-medium">💼 工作天数</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{adjustedWorkDays}<span className="text-xs font-medium text-white/60"> / {totalDays + '天'}</span></p>
                <p className="text-[10px] text-white/70 mt-0.5">出勤率 {workRate}%</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl p-3 shadow-lg text-white">
                <p className="text-[10px] text-white/80 font-medium">🌙 放假天数</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{restDays}<span className="text-xs font-medium text-white/60"> 天</span></p>
                <p className="text-[10px] text-white/70 mt-0.5">{'☾'.repeat(Math.min(Math.max(restDays, 0), 5))}{restDays > 5 ? '...' : ''}</p>
              </div>

            </>
          })()}
        </div>
      )}

      </div>
      {/* Calendar View */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-1 sm:p-3 flex-1 md:flex-none flex flex-col min-h-0">
          {/* Calendar toolbar */}
          <div className="flex items-center justify-end mb-0.5 md:mb-1 flex-shrink-0 px-0.5">
            <button onClick={() => setShowAmount(!showAmount)}
              className="text-xs px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 hover:bg-gray-100 active:scale-95"
              title={showAmount ? '隐藏金额' : '显示金额'}>
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {showAmount ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                )}
              </svg>
              <span className="text-gray-400">{showAmount ? '💰' : '🏷️'}</span>
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 flex-shrink-0">
            {['日','一','二','三','四','五','六'].map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 py-1 uppercase tracking-wider">{d}</div>
            ))}</div>
          {/* Calendar grid */}
          <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
          {(() => { const dailyTotalMap = {} as Record<string, number>; incomes.forEach(i => { const d = i.date?.substring(0, 10); if (d) dailyTotalMap[d] = (dailyTotalMap[d] || 0) + i.amount; }); const maxAmountInMonth = Math.max(...Object.values(dailyTotalMap), 0); return month && year && buildCalendarDays(year, month, incomes).map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="min-h-[60px] sm:min-h-[80px]" />;
                const { dateNum, records } = day;
                const hasData = records.length > 0;
                // Group by shift, then by company
                const morningRecs = records.filter((r: any) => r.shift === '早班' || r.shift === '日班');
                const nightRecs = records.filter((r: any) => r.shift === '晚班');
                const otherRecs = records.filter((r: any) => r.shift !== '早班' && r.shift !== '日班' && r.shift !== '晚班');
                const maxAmt = maxAmountInMonth > 0 ? maxAmountInMonth : 1;
                const groupByCompany = (recs: any[]) => {
                  const g = {} as Record<string, number>;
                  recs.forEach((r: any) => { const k = r.company || '其他'; g[k] = (g[k] || 0) + r.amount; });
                  return Object.entries(g).sort((a: any, b: any) => b[1] - a[1]);
                };
                const morningComps = groupByCompany(morningRecs);
                const nightComps = groupByCompany(nightRecs);
                const otherComps = groupByCompany(otherRecs);
                const allBars: { com: string; amt: number }[] = [];
                morningComps.forEach(([c, a]) => allBars.push({ com: c, amt: a }));
                nightComps.forEach(([c, a]) => allBars.push({ com: c, amt: a }));
                otherComps.forEach(([c, a]) => allBars.push({ com: c, amt: a }));
                let cumPct = 0;
                return (
                  <button key={di}
                    onClick={() => hasData && setSelectedDay(day)}
                    className={'min-h-[60px] sm:min-h-[80px] rounded-lg p-1 text-left transition-all overflow-hidden relative flex items-center justify-center ' + (hasData ? 'hover:shadow-md hover:ring-2 hover:ring-green-300 cursor-pointer bg-white' : 'bg-gradient-to-b from-gray-50 to-white')}
                  >
                    <span className={'absolute top-0.5 left-0.5 z-20 text-sm sm:text-base font-black ' + (hasData ? 'text-gray-900' : 'text-gray-400')} style={{ textShadow: hasData ? '0 0 6px rgba(255,255,255,0.9)' : 'none' }}>{dateNum}</span>{!hasData && new Date(year, (month || 1) - 1, dateNum) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) && <span className="absolute inset-0 flex items-center justify-center text-xl text-gray-200 pt-4">🌙</span>}
                    {hasData && (
                      <div className="absolute inset-0 overflow-hidden rounded-lg">
                        {allBars.map(({ com, amt }) => {
                          const pct = Math.min((amt / maxAmt) * 100, 100);
                          if (pct <= 0) return null;
                          const top = cumPct;
                          cumPct += pct;
                          return (
                            <div key={com} className="absolute left-0 right-0 transition-all duration-300" style={{ top: top + '%', height: pct + '%', background: companyGradient(com), minHeight: '4px' }}>
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-bold leading-tight" style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.7)'}}>{showAmount ? ('+' + amt.toFixed(0)) : com}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )); })()}
          </div>
        </div>
      )}

      {/* Day Detail Popup */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedDay(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 max-h-[70vh] overflow-y-auto border border-green-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{year}年{String(month).padStart(2, '0')}月{String(selectedDay.dateNum).padStart(2, '0')}日</h3>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-1.5 hover:bg-red-50 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="text-right mb-3">
              <span className="text-2xl font-bold text-white">HK$ {selectedDay.total.toFixed(2)}</span>
              <span className="text-sm text-gray-400 ml-2">{selectedDay.records.length} 笔</span>
            </div>
            <div className="space-y-2 divide-y divide-gray-100">
              {selectedDay.records.map((item: any) => (
                <div key={item._id} className="pt-2 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: companyColor(item.company), boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">{item.category || '未分类'}</span>
                    {item.shift && <span className="text-xs text-gray-400">{item.shift}</span>}
                    {item.company && <span className="text-xs text-gray-400">{item.company}</span>}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <span className="font-bold text-gray-800">HK$ {item.amount.toFixed(2)}</span>
                      {item.hours > 0 && <span className="text-xs text-gray-400 ml-2">{item.hours}h</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(item); setSelectedDay(null); }} className="text-xs text-blue-400 hover:text-blue-600">编辑</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteIncome(item._id); setSelectedDay(null); }} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  </div>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                </div>
              ))
          }
            </div>
          </div>
        </div>
      )}

      {/* Charts & Analysis */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 w-full max-w-full">
          {/* Monthly Trend */}
          {Object.keys(stats.monthlyTotals).length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-3 sm:p-5 card-hover">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                📈 月度收入趋势
              </h3>
              <Bar data={{
                labels: Object.keys(stats.monthlyTotals).sort(),
                datasets: [{ label: '收入 (HK$)', data: Object.keys(stats.monthlyTotals).sort().map(m => stats.monthlyTotals[m]), backgroundColor: '#10B98133', borderColor: '#10B981', borderWidth: 2, borderRadius: 4 }]
              }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v } } } }} />
            </div>
          )}

          {/* Industry Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🏭 行业分布</h3>
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
                  ))
          }
                </div>
              </div>
            )}
          </div>

          {/* Company Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🏢 公司收入</h3>
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
                  {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-10 h-10 md:w-12 md:h-12 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
})}
          </div>

          {/* Hourly Rate Trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">💵 时薪走势</h3>
            {(function() {
              const dailyRates: Record<string, { income: number; hours: number }> = {};
              incomes.filter((i) => i.hours > 0).forEach((i) => {
                const day = i.date?.substring(0, 10);
                if (!day) return;
                if (!dailyRates[day]) dailyRates[day] = { income: 0, hours: 0 };
                dailyRates[day].income += i.amount;
                dailyRates[day].hours += i.hours;
              });
              const sortedDays = Object.keys(dailyRates).sort();
              const rates = sortedDays.map(d => dailyRates[d].hours > 0 ? (dailyRates[d].income / dailyRates[d].hours) : 0);
              const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
              return (
                <div>
                  <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                    <span>平均时薪: <span className="font-bold text-blue-600">HK$ {avgRate.toFixed(2)}</span></span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span>共 {sortedDays.length} 个工作日</span>
                  </div>
                  {sortedDays.length > 0 ? (
                    <Bar data={{
                      labels: sortedDays.map(d => d.substring(5)),
                      datasets: [{
                        label: "时薪 (HK$)",
                        data: rates.map(r => Number(r.toFixed(2))),
                        backgroundColor: rates.map(r => r >= avgRate ? "#3B82F633" : "#EF444433"),
                        borderColor: rates.map(r => r >= avgRate ? "#3B82F6" : "#EF4444"),
                        borderWidth: 1.5,
                        borderRadius: 3,
                      }]
                    }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => "HK$" + v } } } }} />
                  ) : <p className="text-sm text-gray-400 text-center py-4">暂无工时数据</p>}
                  {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-10 h-10 md:w-12 md:h-12 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
})()}
          </div>

          {/* Weekday Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 星期分布</h3>
            {(function() {
              const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
              const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
              const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
              incomes.forEach((i) => {
                if (!i.date) return;
                const d = new Date(i.date);
                const wd = d.getDay();
                weekdayTotals[wd] += i.amount;
                weekdayCounts[wd]++;
              });
              return (
                <div>
                  <Bar data={{
                    labels: weekdayNames,
                    datasets: [{
                      label: "收入 (HK$)",
                      data: weekdayTotals,
                      backgroundColor: ["#EF444433","#F59E0B33","#10B98133","#3B82F633","#8B5CF633","#EC489933","#EF444433"],
                      borderColor: ["#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#EF4444"],
                      borderWidth: 2,
                      borderRadius: 4,
                    }]
                  }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => "HK$ " + ctx.raw + " (" + weekdayCounts[ctx.dataIndex] + "次)" } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => "HK$" + v } } } }} />
                  {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-10 h-10 md:w-12 md:h-12 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
})()}
          </div>

          {/* Top Paying Days */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">最高收入日</h3>
            {(function() {
              const dayTotals: Record<string, { amount: number; count: number; companies: string[] }> = {};
              incomes.forEach((i) => {
                const day = i.date?.substring(0, 10);
                if (!day) return;
                if (!dayTotals[day]) dayTotals[day] = { amount: 0, count: 0, companies: [] };
                dayTotals[day].amount += i.amount;
                dayTotals[day].count++;
                if (i.company && !dayTotals[day].companies.includes(i.company)) dayTotals[day].companies.push(i.company);
              });
              const topDays = Object.entries(dayTotals).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);
              return (
                <div className="space-y-2">
                  {topDays.map(([day, data], i) => (
                    <div key={day} className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100/50">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-amber-600 w-5 text-center">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{day}</p>
                          <p className="text-xs text-gray-400">{data.count} 笔 · {data.companies.join(" ")}</p>
                        </div>
                      </div>
                      <span className="text-base font-bold text-amber-700">HK$ {data.amount.toFixed(0)}</span>
                    </div>
                  ))
          }
                  {topDays.length === 0 && <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>}
                  {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-10 h-10 md:w-12 md:h-12 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
})()}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto border border-green-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{editItem ? '编辑收入' : '✨ 新增收入'}</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <QuickAddCards incomes={incomes} onSelect={(item) => {
                setFormDate(item.date || '');
                setFormAmount(item.amount ? String(item.amount) : '');
                setFormShift(item.shift || '早班');
                setFormHours(item.hours ? String(item.hours) : '');
                setFormIndustry(item.industry || '地盘');
                setFormCompany(item.company || '国益');
                setFormNote(item.note || '');
                setEditItem(null);
              }} />

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
      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-10 h-10 md:w-12 md:h-12 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
        </div>
      </div>
    </div>
  );
}




















