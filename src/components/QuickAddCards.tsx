'use client';

import { useState, useMemo, useCallback } from 'react';

interface PatternItem {
  industry: string;
  company: string;
  shift: string;
  hours: number;
  amount: number;
  count: number;
  latestDate: string;
}

interface QuickAddCardsProps {
  incomes: any[];
  /** 直接把选中的工作写入收入记录，返回是否全部成功 */
  onQuickAdd: (items: any[]) => Promise<boolean>;
}

const keyOf = (p: PatternItem) =>
  [p.industry, p.company, p.shift, p.hours].join('::');

export default function QuickAddCards({ incomes, onQuickAdd }: QuickAddCardsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const patterns = useMemo(() => {
    // Get records from last 2 months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const recent = incomes.filter((i: any) => {
      if (!i.date) return false;
      const d = new Date(i.date);
      return d >= twoMonthsAgo;
    });

    // Group by unique pattern (industry + company + shift + hours)
    const patternMap = new Map<string, PatternItem>();
    recent.forEach((i: any) => {
      if (!i.industry && !i.company) return;
      const key = [i.industry || '', i.company || '', i.shift || '', i.hours || 0].join('::');
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          industry: i.industry || '',
          company: i.company || '',
          shift: i.shift || '',
          hours: i.hours || 0,
          amount: i.amount || 0,
          count: 0,
          latestDate: i.date || '',
        });
      }
      const p = patternMap.get(key)!;
      p.count++;
      if (i.date > p.latestDate) { p.latestDate = i.date; p.amount = i.amount || 0; }
    });

    // Sort by count desc, limit to 6
    return Array.from(patternMap.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [incomes]);

  const companyColor = (com: string) => {
    const colors: Record<string, string> = {
      '国益': '#DC2626',
      '煌府': '#2563EB',
      '益哥': '#16A34A',
    };
    return colors[com] || '#9333EA';
  };

  const toItem = (p: PatternItem) => ({
    industry: p.industry,
    company: p.company,
    shift: p.shift,
    hours: p.hours,
    amount: p.amount,
    note: '',
  });

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const submit = useCallback(
    async (items: any[]) => {
      if (busy || items.length === 0) return;
      setBusy(true);
      const ok = await onQuickAdd(items);
      setBusy(false);
      if (ok) {
        setSelected(new Set());
        setFlash(`已添加 ${items.length} 条收入`);
        setTimeout(() => setFlash(''), 2200);
      }
    },
    [busy, onQuickAdd]
  );

  if (patterns.length === 0) return null;

  // 有选中项时，点卡片是继续勾选；没选中时，点卡片直接入账
  const selectMode = selected.size > 0;
  const selectedItems = patterns.filter((p) => selected.has(keyOf(p)));
  const selectedTotal = selectedItems.reduce((sum, p) => sum + (p.amount || 0), 0);

  const act = (p: PatternItem) => {
    const key = keyOf(p);
    if (selectMode) toggle(key);
    else void submit([toItem(p)]);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-800">常用工作</h3>
        <span className="text-[10px] text-gray-400">
          {selectMode ? '点卡片继续勾选，再点提交' : '点卡片直接添加，勾选可批量'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {patterns.map((p) => {
          const key = keyOf(p);
          const color = companyColor(p.company);
          const isSelected = selected.has(key);
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => act(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  act(p);
                }
              }}
              className={`group relative px-3 py-2.5 pr-9 rounded-xl border text-left transition-all active:scale-[0.97] hover:shadow-md cursor-pointer select-none ${
                busy ? 'opacity-60 pointer-events-none' : ''
              }`}
              style={{
                backgroundColor: isSelected ? color + '1f' : color + '0d',
                borderColor: isSelected ? color : color + '30',
                boxShadow: isSelected ? `0 0 0 1px ${color}55` : undefined,
              }}
            >
              <button
                type="button"
                aria-label={isSelected ? `取消选择 ${p.company}` : `选择 ${p.company} 批量添加`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(key);
                }}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                style={{
                  borderColor: isSelected ? color : color + '55',
                  backgroundColor: isSelected ? color : '#ffffff',
                }}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-800">{p.company}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 text-gray-500 font-medium border border-gray-200/50">
                      {p.shift}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {p.industry} · {p.hours}h · HK$ {p.amount.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectMode && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-gray-900 px-3 py-2 text-white animate-fade-in-up">
          <span className="text-[11px]">
            已选 {selected.size} 条 · 合计 HK$ {selectedTotal.toFixed(0)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[11px] text-gray-300 hover:text-white"
            >
              取消
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit(selectedItems.map(toItem))}
              className="text-[11px] font-bold bg-white text-gray-900 rounded-lg px-3 py-1 disabled:opacity-60"
            >
              {busy ? '添加中…' : `提交 ${selected.size} 条`}
            </button>
          </div>
        </div>
      )}

      {flash && (
        <p className="mt-2 text-[11px] text-emerald-600 font-medium">✓ {flash}</p>
      )}
    </div>
  );
}
