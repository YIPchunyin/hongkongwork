'use client';

import { useState, useMemo } from 'react';

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
  onSelect: (item: any) => void;
}

export default function QuickAddCards({ incomes, onSelect }: QuickAddCardsProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

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

  if (patterns.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-800">常用工作</h3>
        <span className="text-[10px] text-gray-400">点击快速添加</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {patterns.map((p, idx) => (
          <button
            key={[p.industry, p.company, p.shift, p.hours].join('-')}
            onClick={() => {
              setSelectedIdx(idx);
              onSelect({
                industry: p.industry,
                company: p.company,
                shift: p.shift,
                hours: p.hours,
                amount: p.amount,
                note: '',
                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              });
            }}
            className="group relative px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.97] hover:shadow-md"
            style={{
              backgroundColor: companyColor(p.company) + '0d',
              borderColor: companyColor(p.company) + '30',
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: companyColor(p.company) }}
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
          </button>
        ))}
      </div>
    </div>
  );
}

